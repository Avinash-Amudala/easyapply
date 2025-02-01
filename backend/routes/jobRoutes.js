const express = require('express');
const { requireSubscription } = require('../middleware/authMiddleware');
const { getJobs, addJob, updateJob, deleteJob, delegateJob } = require('../controllers/jobController');
const router = express.Router();

router.get('/', requireSubscription, getJobs);
router.post('/', requireSubscription, addJob);
router.patch('/:id', requireSubscription, updateJob);
router.delete('/:id', requireSubscription, deleteJob);
router.post('/delegate', requireSubscription, delegateJob);

module.exports = router;
