require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for local testing
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Configure middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from different origins
}));

// CORS — allow local dev + any configured FRONTEND_URL (Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (Protect APIs from brute-force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Socket.io connection mapping
const activeUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Register user socket
  socket.on('register', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} registered to socket ${socket.id}`);
  });

  // Join a complaint room for chat
  socket.on('join_complaint', (complaintId) => {
    socket.join(`complaint_${complaintId}`);
    console.log(`💬 Socket ${socket.id} joined room: complaint_${complaintId}`);
  });

  // Typing indicators
  socket.on('typing', ({ complaintId, userId, userName, isTyping }) => {
    socket.to(`complaint_${complaintId}`).emit('typing_status', {
      complaintId,
      userId,
      userName,
      isTyping
    });
  });

  // Message sent
  socket.on('send_message', (data) => {
    const { complaintId, senderId, receiverId, message, id, createdAt, attachments } = data;
    // Broadcast to the room
    io.to(`complaint_${complaintId}`).emit('message_received', data);
    
    // Also notify receiver if they are not in the room
    io.to(`user_${receiverId}`).emit('notification_received', {
      type: 'new_message',
      title: 'New Chat Message',
      content: `${data.senderName || 'Staff'}: ${message.substring(0, 40)}${message.length > 40 ? '...' : ''}`,
      complaintId,
      createdAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    // Clean up registered user
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Attach Socket.IO instance to app request object so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  req.activeUsers = activeUsers;
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const announcementRoutes = require('./routes/announcements');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const pollRoutes = require('./routes/polls');
const visitorRoutes = require('./routes/visitors');
const amenityRoutes = require('./routes/amenities');
const feeRoutes = require('./routes/fees');
const domesticHelpRoutes = require('./routes/domesticHelp');
const classifiedsRoutes = require('./routes/classifieds');

// Declare Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/domesticHelp', domesticHelpRoutes);
app.use('/api/classifieds', classifiedsRoutes);

// Serve static frontend files in production/deployment
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all route to serve React app for non-API requests
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API Route Not Found' });
  }
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'SocietyFix API Server is running successfully.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ 
    message: err.message || 'An internal server error occurred.' 
  });
});

// Database connection & start server
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // If we are using the JSON DB fallback, seed it automatically if empty
  if (global.useJsonDb) {
    const dbPath = path.join(__dirname, 'data', 'db.json');
    if (!fs.existsSync(dbPath) || fs.readFileSync(dbPath, 'utf8').trim() === '') {
      try {
        const seedData = require('./data/seed');
      } catch (e) {
        console.error('Error seeding JSON database:', e);
      }
    }
    try {
      const jsonDb = require('./data/jsonDb');
      const bcrypt = require('bcryptjs');
      const hash = '$2a$10$YUOuOx7mCsEr2Rhu6MCHCeSBVeE5v49cZNWdrzVsHatwDPhXm992.';
      const admin1 = jsonDb.findOne('users', { email: 'neetijoshi2006@gmail.com' });
      if (admin1) {
        jsonDb.update('users', { email: 'neetijoshi2006@gmail.com' }, { password: hash, role: 'admin' });
      } else {
        jsonDb.insert('users', {
          name: 'Neeti Joshi',
          email: 'neetijoshi2006@gmail.com',
          password: hash,
          phone: '+91 98765 43210',
          role: 'admin',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Neeti',
          notificationPreferences: { email: true, sms: true, inApp: true }
        });
      }
      const admin2 = jsonDb.findOne('users', { email: 'admin@societyfix.com' });
      if (admin2) {
        jsonDb.update('users', { email: 'admin@societyfix.com' }, { password: hash, role: 'admin' });
      }
    } catch (e) {
      console.error('Error updating JSON DB admin credentials:', e);
    }
  } else {
    // MongoDB mode: Guarantee admin accounts exist and passwords match admin123 on startup
    try {
      const User = require('./models/Users');
      const bcrypt = require('bcryptjs');
      const hashPassword = (p) => bcrypt.hashSync(p, 10);

      const adminAccounts = [
        {
          name: 'Neeti Joshi',
          email: 'neetijoshi2006@gmail.com',
          password: hashPassword('admin123'),
          phone: '+91 98765 43210',
          role: 'admin',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Neeti',
          notificationPreferences: { email: true, sms: true, inApp: true }
        },
        {
          name: 'Vikram Aditya',
          email: 'admin@societyfix.com',
          password: hashPassword('admin123'),
          phone: '+91 98765 43211',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          notificationPreferences: { email: true, sms: true, inApp: true }
        }
      ];

      for (const adminData of adminAccounts) {
        await User.findOneAndUpdate(
          { email: adminData.email },
          { $set: adminData },
          { upsert: true, new: true }
        );
      }
      console.log('⚡ Admin accounts verified & ready in MongoDB Atlas.');
    } catch (err) {
      console.error('Error verifying admin accounts:', err);
    }
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 SocietyFix server listening on port ${PORT} (JSON Fallback Mode: ${global.useJsonDb})`);
  });
});
