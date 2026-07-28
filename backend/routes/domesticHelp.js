const express = require('express');
const router = express.Router();
const domesticHelpController = require('../controllers/domesticHelpController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, domesticHelpController.getHelpers);
router.post('/', authenticateToken, authorizeRoles('manager', 'admin'), domesticHelpController.addHelper);

module.exports = router;
