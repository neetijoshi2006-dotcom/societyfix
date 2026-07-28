const mongoose = require('mongoose');

global.useJsonDb = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.warn('⚠️ MONGO_URI not found in env. Falling back to local JSON database.');
      global.useJsonDb = true;
      return;
    }
    
    // Connect to MongoDB with timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('⚡ Connected to MongoDB successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️ Falling back to local JSON database.');
    global.useJsonDb = true;
  }
};

module.exports = connectDB;
