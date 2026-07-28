const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, amenityController.createBooking);
router.get('/', authenticateToken, amenityController.getBookings);

module.exports = router;
