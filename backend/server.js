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
  } else {
    // MongoDB mode: check if Users is empty and seed default users & announcements
    try {
      const User = require('./models/Users');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('🌱 MongoDB database is empty. Auto-seeding initial data...');
        const mongoose = require('mongoose');
        const bcrypt = require('bcryptjs');
        const hashPassword = (p) => bcrypt.hashSync(p, 10);
        
        // Seed default users
        const users = [
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a1'),
            name: 'Vikram Aditya',
            email: 'admin@societyfix.com',
            password: hashPassword('admin123'),
            phone: '+91 98765 43210',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            notificationPreferences: { email: true, sms: true, inApp: true }
          },
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a2'),
            name: 'Suresh Patil',
            email: 'manager@societyfix.com',
            password: hashPassword('manager123'),
            phone: '+91 98765 43211',
            role: 'manager',
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            notificationPreferences: { email: true, sms: true, inApp: true }
          },
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a3'),
            name: 'Amit Sharma',
            email: 'amit@societyfix.com',
            password: hashPassword('resident123'),
            phone: '+91 98765 43212',
            role: 'resident',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            details: { building: 'Orchid', wing: 'A', floor: 4, flatNumber: '402' },
            notificationPreferences: { email: true, sms: true, inApp: true }
          },
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a4'),
            name: 'Priya Deshmukh',
            email: 'priya@societyfix.com',
            password: hashPassword('resident123'),
            phone: '+91 98765 43213',
            role: 'resident',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            details: { building: 'Orchid', wing: 'B', floor: 12, flatNumber: '1205' },
            notificationPreferences: { email: true, sms: false, inApp: true }
          },
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a5'),
            name: 'Rohan Mehta',
            email: 'rohan@societyfix.com',
            password: hashPassword('resident123'),
            phone: '+91 98765 43214',
            role: 'resident',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            details: { building: 'Tulip', wing: 'C', floor: 8, flatNumber: '801' },
            notificationPreferences: { email: false, sms: false, inApp: true }
          },
          {
            _id: new mongoose.Types.ObjectId('660d1b2f9f8c3c2f48d3c1a6'),
            name: 'Rahul Kumar',
            email: 'rahul@societyfix.com',
            password: hashPassword('staff123'),
            phone: '+91 98765 43220',
            role: 'staff',
            avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150',
            details: { skills: ['Electrician', 'Plumber'], rating: 4.8, activeJobsCount: 1, isSuspended: false },
            notificationPreferences: { email: true, sms: true, inApp: true }
          }
        ];
        
        await User.insertMany(users);
        console.log('⚡ MongoDB Users seeded successfully.');
        
        // Seed a default complaint
        const Complaint = require('./models/Complaints');
        const complaints = [
          {
            title: 'Water Leakage in Bathroom Ceiling',
            description: 'Water is dripping constantly from the ceiling in the master bathroom. It is starting to damage the wall paint.',
            category: 'Plumbing',
            priority: 'high',
            status: 'assigned',
            location: { building: 'Orchid', wing: 'A', floor: 4, flatNumber: '402', exactLocation: 'Master Bathroom Ceiling' },
            residentId: '660d1b2f9f8c3c2f48d3c1a3',
            assignedStaffId: '660d1b2f9f8c3c2f48d3c1a6',
            images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'],
            timeline: [
              { status: 'pending', notes: 'Complaint registered by Resident Amit Sharma', updatedBy: '660d1b2f9f8c3c2f48d3c1a3' }
            ]
          }
        ];
        await Complaint.insertMany(complaints);
        
        // Seed default announcements
        const Announcement = require('./models/Announcements');
        const announcements = [
          {
            title: 'Scheduled Water Shutdown',
            content: 'Please note there will be a scheduled water shutdown on Thursday (July 3) from 10:00 AM to 2:00 PM for cleaning of overhead water tanks of building Orchid Wing A & B.',
            category: 'water-shutdown',
            postedBy: '660d1b2f9f8c3c2f48d3c1a2'
          }
        ];
        await Announcement.insertMany(announcements);
        console.log('🌱 MongoDB seeding complete!');
      }
    } catch (err) {
      console.error('Error auto-seeding MongoDB:', err);
    }
  }
  
  server.listen(PORT, () => {
    console.log(`🚀 SocietyFix server listening on port ${PORT} (JSON Fallback Mode: ${global.useJsonDb})`);
  });
});
