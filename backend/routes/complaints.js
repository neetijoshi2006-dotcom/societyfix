const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const complaintController = require('../controllers/complaintController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Setup Multer Storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG/JPG/PNG/WEBP/GIF) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// AI Suggestions (Public/Any logged-in user can query as they type)
router.post('/suggest-ai', authenticateToken, complaintController.suggestAI);

// Main Complaint CRUD
router.post('/', authenticateToken, upload.array('images', 5), complaintController.createComplaint);
router.get('/', authenticateToken, complaintController.getComplaints);
router.get('/:id', authenticateToken, complaintController.getComplaintById);
router.delete('/:id', authenticateToken, complaintController.deleteComplaint);

// Assignments & Progress updates
router.put('/:id/assign', authenticateToken, authorizeRoles('manager', 'admin'), complaintController.assignStaff);
router.put('/:id/status', authenticateToken, upload.array('afterImages', 3), complaintController.updateComplaintStatus);
router.put('/:id/close', authenticateToken, authorizeRoles('manager', 'admin'), complaintController.closeComplaint);
router.post('/:id/rate', authenticateToken, complaintController.rateComplaint);

module.exports = router;
