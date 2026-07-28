const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRoles('manager', 'admin'), announcementController.createAnnouncement);
router.get('/', authenticateToken, announcementController.getAnnouncements);
router.delete('/:id', authenticateToken, authorizeRoles('manager', 'admin'), announcementController.deleteAnnouncement);

module.exports = router;
