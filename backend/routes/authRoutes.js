const express = require('express');
const { registerUser, loginUser, checkSubscriptionStatus, updateSubscription } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/check-subscription', requireAuth, checkSubscriptionStatus);
router.post('/update-subscription', requireAuth, updateSubscription);

module.exports = router;
