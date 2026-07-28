const express = require('express');
const router = express.Router();
const classifiedsController = require('../controllers/classifiedsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, classifiedsController.getClassifieds);
router.post('/', authenticateToken, classifiedsController.addClassified);

module.exports = router;
