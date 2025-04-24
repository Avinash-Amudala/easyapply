const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    checkSubscriptionStatus,
    updateSubscription,
    getUserProfile,
    updateUserProfile
} = require('../controllers/authController');
const { requireAuth, authenticateUser } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Files will be saved in 'uploads/' directory

// Profile routes with multer for file uploads
router.route('/profile')
    .get(requireAuth, getUserProfile)
    .put(requireAuth, upload.array('uploadedDocuments'), updateUserProfile); // Handle multiple files

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Session check endpoint
router.get('/session', authenticateUser, (req, res) => {
    res.json({ isAuthenticated: true, user: req.user });
});

// Subscription routes
router.get('/check-subscription', requireAuth, checkSubscriptionStatus);
router.post('/subscribe', requireAuth, updateSubscription);

module.exports = router;