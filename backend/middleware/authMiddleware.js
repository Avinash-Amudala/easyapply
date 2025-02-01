const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to require authentication
exports.requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'No token provided or invalid format' });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(403).json({ message: 'User not found or access denied' });
        }

        req.user = user; // Attach the authenticated user to the request object
        next();
    } catch (error) {
        console.error('Authorization error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to require a valid subscription
exports.requireSubscription = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'No token provided or invalid format' });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || !user.subscriptionStatus) {
            return res.status(403).json({ message: 'Active subscription required to access this feature' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.status(500).json({ message: 'Server error' });
    }
};