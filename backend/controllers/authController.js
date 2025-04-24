const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, experience } = req.body;

        if (!name || !email || !password || experience === undefined) {
            return res.status(400).json({ message: "All fields (name, email, password, experience) are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const newUser = new User({ name, email, password, experience });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set token in a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            userId: user._id,
            role: user.role,
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });
    res.json({
        message: 'Logged out successfully',
        token: null
    });
};

exports.checkSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            isSubscribed: user.subscriptionStatus,
            plan: user.subscriptionPlan,
            credits: user.credits,
            validUntil: user.subscriptionEndDate
        });
    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { plan } = req.body;
        let credits;

        switch (plan) {
            case 'basic': credits = 500; break;
            case 'pro': credits = 800; break;
            case 'premium': credits = 1100; break;
            default: return res.status(400).json({ message: 'Invalid plan' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                subscriptionPlan: plan,
                subscriptionStatus: true,
                subscriptionStartDate: startDate,
                subscriptionEndDate: endDate,
                credits
            },
            { new: true }
        );

        if (!user.assignedAssistant) {
            let assistant = await User.aggregate([
                { $match: { role: 'assistant' } },
                { $lookup: { from: 'delegatedjobs', localField: '_id', foreignField: 'assistant', as: 'jobs' } },
                { $addFields: { jobCount: { $size: "$jobs" } } },
                { $sort: { jobCount: 1 } },
                { $limit: 1 }
            ]);

            if (assistant.length === 0) {
                assistant = await User.findOne({ role: 'admin' });
                if (!assistant) {
                    return res.status(500).json({ message: "❌ No admin found. Please set up an admin account." });
                }
            } else {
                assistant = assistant[0];
            }

            user.assignedAssistant = assistant._id;
            await user.save();

            await User.findByIdAndUpdate(
                assistant._id,
                { $addToSet: { managedUsers: user._id } }
            );
        }

        res.status(200).json({
            message: 'Subscription updated successfully',
            plan: user.subscriptionPlan,
            isSubscribed: user.isSubscriptionActive(),
            credits: user.credits,
            validUntil: user.subscriptionEndDate,
            assignedAssistant: user.assignedAssistant
        });

    } catch (error) {
        console.error('❌ Error updating subscription:', error);
        res.status(500).json({ message: 'Failed to update subscription' });
    }
};

exports.checkSession = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('assignedAssistant');

        if (!user) {
            return res.status(401).json({ isAuthenticated: false });
        }

        res.json({
            isAuthenticated: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ isAuthenticated: false });
    }
};

exports.verify = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('subscriptionStatus credits');

        res.json({
            isValid: true,
            isSubscribed: user.subscriptionStatus,
            credits: user.credits
        });
    } catch (error) {
        res.status(401).json({ isValid: false });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, experience, skills, jobPreferences } = req.body;

        const parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
        const parsedJobPreferences = typeof jobPreferences === 'string' ? JSON.parse(jobPreferences) : jobPreferences;

        const uploadedDocuments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            path: file.path,
            uploadedAt: new Date()
        })) : [];

        const updatedProfile = {
            name,
            email,
            experience: parseInt(experience, 10) || 0,
            skills: parsedSkills || [],
            ...(uploadedDocuments.length > 0 && { uploadedDocuments }),
            jobPreferences: parsedJobPreferences || {
                desiredSalary: 0,
                visaStatus: { needsSponsorship: false }
            }
        };

        const user = await User.findByIdAndUpdate(userId, updatedProfile, {
            new: true,
            runValidators: true
        });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const oldToken = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!oldToken) throw new Error('No token provided');

        const decoded = jwt.decode(oldToken);
        if (!decoded?.userId) throw new Error('Invalid token structure');

        const user = await User.findById(decoded.userId);
        if (!user) throw new Error('User not found');

        const newToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000
        });

        res.json({
            token: newToken,
            expiresIn: 7200
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            code: 'REFRESH_FAILED',
            message: error.message
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const profileData = user.toObject();
        profileData.jobPreferences = profileData.jobPreferences || {};
        profileData.jobPreferences.visaStatus = profileData.jobPreferences.visaStatus || {};
        profileData.jobPreferences.visaStatus.needsSponsorship =
            profileData.jobPreferences.visaStatus.needsSponsorship !== undefined
                ? profileData.jobPreferences.visaStatus.needsSponsorship
                : false;

        res.json(profileData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
