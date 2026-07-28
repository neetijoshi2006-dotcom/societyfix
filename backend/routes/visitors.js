const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, visitorController.createPass);
router.get('/', authenticateToken, visitorController.getPasses);

module.exports = router;
