// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAssistant,
    getAllUsers,
    getAllAssistants,
    assignAssistant,
    getAssistantProgress
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.post('/assistants',
    requireAuth,
    requireRole(['admin']),
    createAssistant
);

router.get('/users',
    requireAuth,
    requireRole(['admin']),
    getAllUsers
);

router.get('/assistants',
    requireAuth,
    requireRole(['admin']),
    getAllAssistants
);

router.post('/assign',
    requireAuth,
    requireRole(['admin']),
    assignAssistant
);

router.get('/progress/:assistantId',
    requireAuth,
    requireRole(['admin']),
    getAssistantProgress
);

module.exports = router;