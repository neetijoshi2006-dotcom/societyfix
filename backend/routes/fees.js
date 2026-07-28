const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, feeController.getFees);
router.post('/:id/pay', authenticateToken, feeController.payFee);

module.exports = router;
