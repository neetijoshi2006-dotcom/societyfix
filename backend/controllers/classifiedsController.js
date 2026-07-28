const jsonDb = require('../data/jsonDb');

const DEFAULT_CLASSIFIEDS = [
  { title: 'IKEA 3-Seater Sofa', description: 'Barely used, moving out sale. Light grey color.', price: 12000, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80', sellerName: 'Rahul Sharma', sellerPhone: '+91 98765 11111', residentId: 'r1', status: 'Available' },
  { title: 'LG Washing Machine 7kg', description: 'Front load, 2 years old, excellent condition.', price: 15000, imageUrl: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=500&q=80', sellerName: 'Priya Desai', sellerPhone: '+91 98765 22222', residentId: 'r2', status: 'Available' },
  { title: 'Study Table & Office Chair', height: '100%', description: 'Ergonomic chair and wooden table. Must go this week!', price: 4000, imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80', sellerName: 'Vikram Singh', sellerPhone: '+91 98765 33333', residentId: 'r3', status: 'Available' },
];

exports.getClassifieds = async (req, res) => {
  try {
    let list = [];
    if (global.useJsonDb) {
      list = jsonDb.find('classifieds');
      if (list.length === 0) {
        DEFAULT_CLASSIFIEDS.forEach(c => jsonDb.insert('classifieds', c));
        list = jsonDb.find('classifieds');
      }
    } else {
      const Classified = require('../models/Classified');
      list = await Classified.find().sort({ createdAt: -1 }).lean();
      if (list.length === 0) {
        await Classified.insertMany(DEFAULT_CLASSIFIEDS);
        list = await Classified.find().sort({ createdAt: -1 }).lean();
      }
      list = list.map(h => ({ ...h, id: h._id.toString() }));
    }
    
    // Sort descending by date
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.status(200).json({ classifieds: list });
  } catch (error) {
    console.error('Get classifieds error:', error);
    res.status(500).json({ message: 'Server error retrieving classifieds.' });
  }
};

exports.addClassified = async (req, res) => {
  try {
    const { title, description, price, imageUrl, sellerPhone } = req.body;
    const residentId = req.user.id;
    const sellerName = req.user.name;

    if (!title || !price || !sellerPhone) {
      return res.status(400).json({ message: 'Title, price, and phone are required.' });
    }

    const newObj = { title, description, price, imageUrl, sellerName, sellerPhone, residentId, status: 'Available' };
    
    let classified;
    if (global.useJsonDb) {
      classified = jsonDb.insert('classifieds', newObj);
    } else {
      const Classified = require('../models/Classified');
      const doc = new Classified(newObj);
      await doc.save();
      classified = doc.toObject();
      classified.id = doc._id.toString();
    }
    res.status(201).json({ message: 'Item listed successfully', classified });
  } catch (error) {
    console.error('Add classified error:', error);
    res.status(500).json({ message: 'Server error listing item.' });
  }
};
