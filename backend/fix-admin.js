const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = "mongodb+srv://neetijoshi2006_db_user:9I6rMFu50zdNrgmg@cluster0.bptsgf4.mongodb.net/societyfix?appName=Cluster0";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas!");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    const User = require('./models/Users');
    const count = await User.countDocuments();
    console.log("Total users:", count);
    
    const users = await User.find({}).select('email role').lean();
    console.log("Users:", JSON.stringify(users, null, 2));
    
    if (count === 0) {
      console.log("Database is empty! Seeding admin user...");
      const hash = bcrypt.hashSync('admin123', 10);
      await User.create({
        name: 'Neeti Joshi',
        email: 'neetijoshi2006@gmail.com',
        password: hash,
        phone: '+91 98765 43210',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Neeti',
        notificationPreferences: { email: true, sms: true, inApp: true }
      });
      console.log("Admin user created!");
    } else {
      // Force create/update admin user
      const existing = await User.findOne({ email: 'neetijoshi2006@gmail.com' });
      if (!existing) {
        console.log("Admin not found, creating now...");
        const hash = bcrypt.hashSync('admin123', 10);
        await User.create({
          name: 'Neeti Joshi',
          email: 'neetijoshi2006@gmail.com',
          password: hash,
          phone: '+91 98765 43210',
          role: 'admin',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Neeti',
          notificationPreferences: { email: true, sms: true, inApp: true }
        });
        console.log("Admin user created!");
      } else {
        console.log("Admin found! Resetting password...");
        const hash = bcrypt.hashSync('admin123', 10);
        await User.updateOne({ email: 'neetijoshi2006@gmail.com' }, { $set: { password: hash, role: 'admin' }});
        console.log("Admin password reset to admin123, role confirmed as admin.");
      }
    }
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Done.");
  }
}

run();
