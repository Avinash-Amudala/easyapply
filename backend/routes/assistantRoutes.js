const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
    requireAuth,
    requireRole
} = require('../middleware/authMiddleware');
const {
    getAssignedJobs,
    updateJobStatus
} = require('../controllers/jobController');

router.get('/jobs',
    requireAuth,
    requireRole(['assistant']),
    getAssignedJobs
);

router.put('/jobs/:id',
    requireAuth,
    requireRole(['assistant']),
    upload.single('document'),
    updateJobStatus
);

module.exports = router;