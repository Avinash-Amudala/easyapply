const express = require('express');
const { requireAuth, requireSubscription } = require('../middleware/authMiddleware');
const {
    getJobs,
    addJob,
    updateJob,
    deleteJob,
    delegateJob,
    getAssignedJobs,
    updateJobStatus,
    getJobRecommendations
} = require('../controllers/jobController');
const router = express.Router();

router.get('/', requireAuth, requireSubscription, getJobs);
router.post('/', requireAuth, requireSubscription, addJob);
router.patch('/:id', requireAuth, requireSubscription, updateJob);
router.delete('/:id', requireAuth, requireSubscription, deleteJob);
router.post('/delegate', requireAuth, requireSubscription, delegateJob);
router.get('/assigned', requireAuth, getAssignedJobs);
router.patch('/status/:id', requireAuth, updateJobStatus);
router.post('/recommendations', requireAuth, requireSubscription, getJobRecommendations);

module.exports = router;