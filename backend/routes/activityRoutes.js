const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const Activity = mongoose.model('Activity', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    data: { type: Object },
    timestamp: { type: Date, default: Date.now }
}));

router.post('/track', requireAuth, async (req, res) => {
    try {
        const activity = new Activity({
            userId: req.user._id,
            type: req.body.type,
            data: req.body
        });
        await activity.save();
        res.status(200).json({ message: 'Activity tracked' });
    } catch (error) {
        console.error('Error tracking activity:', error);
        res.status(500).json({ message: 'Failed to track activity' });
    }
});

module.exports = router;