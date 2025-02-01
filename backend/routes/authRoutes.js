const express = require('express');
const {
    registerUser,
    loginUser,
    checkSubscriptionStatus,
    updateSubscription,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/check-subscription', requireAuth, checkSubscriptionStatus);

router.post('/update-subscription', requireAuth, updateSubscription);

router.get('/status', (req, res) => {
    res.json({ isAuthenticated: true, isSubscribed: true });
});

router.get('/login', (req, res) => {
    res.json({ message: 'Mock login route for testing' });
});

router.get('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = router;
