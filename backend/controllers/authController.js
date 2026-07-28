const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jsonDb = require('../data/jsonDb');

const JWT_SECRET = process.env.JWT_SECRET || 'societyfix_jwt_super_secret_key_12345';

// Handle user sign up (Residents only)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, building, wing, floor, flatNumber } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Check if user already exists
    let existingUser;
    if (global.useJsonDb) {
      existingUser = jsonDb.findOne('users', { email: email.toLowerCase() });
    } else {
      const User = require('../models/Users'); // If Mongo is connected
      existingUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const newUserObj = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'resident',
      avatar: defaultAvatar,
      details: {
        building: building || 'Orchid',
        wing: wing || 'A',
        floor: floor ? parseInt(floor) : 1,
        flatNumber: flatNumber || '101'
      },
      notificationPreferences: { email: true, sms: true, inApp: true }
    };

    let user;
    if (global.useJsonDb) {
      user = jsonDb.insert('users', newUserObj);
    } else {
      const User = require('../models/Users');
      const mongoUser = new User(newUserObj);
      await mongoUser.save();
      user = mongoUser.toObject();
      user.id = user._id.toString();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete password from output
    delete user.password;

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Handle user login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    let user;
    if (global.useJsonDb) {
      user = jsonDb.findOne('users', { email: email.toLowerCase() });
    } else {
      const User = require('../models/Users');
      const mongoUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (mongoUser) {
        user = mongoUser.toObject();
        user.id = user._id.toString();
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;

    res.status(200).json({
      message: 'Login successful!',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Get current user profile details
exports.getMe = async (req, res) => {
  try {
    let user;
    if (global.useJsonDb) {
      user = jsonDb.findById('users', req.user.id);
    } else {
      const User = require('../models/Users');
      user = await User.findById(req.user.id).lean();
      if (user) user.id = user._id.toString();
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    delete user.password;
    res.status(200).json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error retrieving profile.' });
  }
};

// Update profile details
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, notificationPreferences, language } = req.body;
    let user;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;
    if (language) updates.language = language;

    if (global.useJsonDb) {
      user = jsonDb.updateById('users', req.user.id, updates);
    } else {
      const User = require('../models/Users');
      const mongoUser = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).lean();
      if (mongoUser) {
        user = mongoUser;
        user.id = mongoUser._id.toString();
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    delete user.password;
    res.status(200).json({
      message: 'Profile updated successfully!',
      user
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

// Mock Forgot Password / Email Verification for simulation flow
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide email.' });
  }
  res.status(200).json({ 
    message: 'Reset password link sent successfully! (Check simulation console/logs)' 
  });
};

exports.resetPassword = (req, res) => {
  res.status(200).json({ message: 'Password reset successful!' });
};
