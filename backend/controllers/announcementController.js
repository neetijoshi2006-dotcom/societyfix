const jsonDb = require('../data/jsonDb');

// Create a new announcement (Managers and Admins only)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const postedBy = req.user.id;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content and category are required.' });
    }

    const newAnnObj = {
      title,
      content,
      category,
      postedBy
    };

    let announcement;
    if (global.useJsonDb) {
      announcement = jsonDb.insert('announcements', newAnnObj);
      const managerUser = jsonDb.findById('users', postedBy);
      announcement.postedByName = managerUser ? managerUser.name : 'Manager';
    } else {
      const Announcement = require('../models/Announcements');
      const mongoAnn = new Announcement(newAnnObj);
      await mongoAnn.save();
      
      const User = require('../models/Users');
      const managerUser = await User.findById(postedBy).lean();
      
      announcement = mongoAnn.toObject();
      announcement.id = mongoAnn._id.toString();
      announcement.postedByName = managerUser ? managerUser.name : 'Manager';
    }

    // Broadcast announcement in real-time to all connected users
    if (req.io) {
      req.io.emit('notification_received', {
        id: Math.random().toString(36).substring(2, 9),
        type: 'announcement',
        title: `Notice: ${title}`,
        content: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
        announcementId: announcement.id,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Announcement broadcasted successfully!',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error broadcasting announcement.' });
  }
};

// Retrieve all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    let list = [];
    if (global.useJsonDb) {
      list = jsonDb.find('announcements');
      const users = jsonDb.find('users');
      list = list.map(a => {
        const poster = users.find(u => u.id === a.postedBy);
        return {
          ...a,
          postedByName: poster ? poster.name : 'Manager'
        };
      });
    } else {
      const Announcement = require('../models/Announcements');
      list = await Announcement.find()
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
      
      list = list.map(a => ({
        ...a,
        id: a._id.toString(),
        postedByName: a.postedBy ? a.postedBy.name : 'Manager',
        postedBy: a.postedBy ? a.postedBy._id.toString() : null
      }));
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ announcements: list });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error retrieving announcements.' });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (global.useJsonDb) {
      const item = jsonDb.findById('announcements', id);
      if (!item) return res.status(404).json({ message: 'Announcement not found.' });
      jsonDb.deleteById('announcements', id);
    } else {
      const Announcement = require('../models/Announcements');
      const result = await Announcement.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.status(200).json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error deleting announcement.' });
  }
};
