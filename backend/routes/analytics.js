const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRoles('manager', 'admin'), analyticsController.getAnalytics);
router.get('/staff', authenticateToken, authorizeRoles('manager', 'admin'), analyticsController.getStaffList);
router.post('/staff', authenticateToken, authorizeRoles('manager', 'admin'), analyticsController.createStaff);
router.put('/staff/:staffId/suspend', authenticateToken, authorizeRoles('manager', 'admin'), analyticsController.toggleSuspendStaff);

// Super admin exclusive routes
router.get('/users', authenticateToken, authorizeRoles('admin'), analyticsController.getAllUsers);

module.exports = router;
