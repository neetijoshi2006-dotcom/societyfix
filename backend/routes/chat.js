const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// Complaint-based chat (legacy)
router.post('/', authenticateToken, messageController.sendMessage);
router.get('/:complaintId', authenticateToken, messageController.getMessages);

// Direct Messages between users
router.post('/dm', authenticateToken, messageController.sendDirectMessage);
router.get('/dm/:partnerId', authenticateToken, messageController.getDirectMessages);

module.exports = router;
