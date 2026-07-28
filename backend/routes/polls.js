const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRoles('manager', 'admin'), pollController.createPoll);
router.get('/', authenticateToken, pollController.getPolls);
router.post('/:id/vote', authenticateToken, pollController.votePoll);
router.delete('/:id', authenticateToken, authorizeRoles('manager', 'admin'), pollController.deletePoll);

module.exports = router;
