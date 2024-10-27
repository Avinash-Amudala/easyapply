const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) return res.status(403).json({ message: 'Access denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(403).json({ message: 'Access denied' });

        req.user = user; // Populate `req.user` with the authenticated user
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to check if the user has an active subscription
exports.requireSubscription = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) return res.status(403).json({ message: 'Access denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.subscriptionStatus) {
            return res.status(403).json({ message: 'Subscription required to access this feature' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
