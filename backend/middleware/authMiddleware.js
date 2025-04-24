const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
    console.log('Request URL:', req.originalUrl);
    console.log('Auth headers:', req.headers.authorization);
    try {
        let token = req.cookies.token ||
            req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
            req.headers['extension-token'];

        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
            .select('-password')
            .populate('assignedAssistant');

        if (!user) return res.status(401).json({ message: "Invalid user" });

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: "Invalid token" });
    }
};

exports.authenticateUser = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ isAuthenticated: false, message: "User not logged in" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ isAuthenticated: false, message: "Invalid token" });
        }

        req.user = decoded;
        next();
    });
};

// Middleware to check if the user has an active subscription
exports.requireSubscription = async (req, res, next) => {
    try {
        // Always get fresh user data from DB
        const user = await User.findById(req.user._id);
        if (!user) return res.status(403).json({ message: 'User not found' });

        const hasValidSubscription = user.isSubscriptionActive();
        const hasCredits = user.credits > 0;

        if (!hasValidSubscription && !hasCredits) {
            return res.status(403).json({
                message: 'Active subscription or credits required',
                errorCode: 'SUBSCRIPTION_REQUIRED'
            });
        }

        req.user = user; // Attach fresh user data
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkSubscription = (req, res) => {
    res.json({ isSubscribed: req.user.subscriptionStatus });
};

exports.requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.log(`Role violation attempt: ${req.user.role} tried accessing ${roles} route`);
            return res.status(403).json({
                message: 'Unauthorized role',
                requiredRole: roles,
                currentRole: req.user.role
            });
        }
        next();
    };
};