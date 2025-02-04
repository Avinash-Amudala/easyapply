const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const newUser = new User({ name, email, password });
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
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ isSubscribed: user.subscriptionStatus });
    } catch (error) {
        console.error('Error checking subscription status:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        const { plan } = req.body;

        // Log incoming data
        console.log('Received subscription request:', plan);
        console.log('Authenticated user ID:', req.user._id);

        // Validate the plan
        if (!['basic', 'pro', 'premium'].includes(plan)) {
            console.error('Invalid subscription plan:', plan);
            return res.status(400).json({ message: 'Invalid subscription plan' });
        }

        // Attempt to update the user in the database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                subscriptionPlan: plan,
                subscriptionStatus: true,
            },
            { new: true }
        );

        if (!user) {
            console.error('User not found:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Subscription updated successfully:', user.subscriptionPlan);
        res.status(200).json({ message: 'Subscription updated successfully', plan: user.subscriptionPlan });
    } catch (error) {
        // Log the full error
        console.error('Error updating subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
