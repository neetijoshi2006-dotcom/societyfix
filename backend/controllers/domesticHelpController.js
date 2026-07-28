const jsonDb = require('../data/jsonDb');

const DEFAULT_HELPERS = [
  { name: 'Lakshmi', role: 'Maid', phone: '+91 98765 43210', rating: 4.8, reviews: 24, isVerified: true, availability: 'Available' },
  { name: 'Raju', role: 'Plumber', phone: '+91 98765 43211', rating: 4.5, reviews: 15, isVerified: true, availability: 'Busy' },
  { name: 'Sunita', role: 'Cook', phone: '+91 98765 43212', rating: 4.9, reviews: 42, isVerified: true, availability: 'Available' },
  { name: 'Ramesh', role: 'Electrician', phone: '+91 98765 43213', rating: 4.2, reviews: 8, isVerified: true, availability: 'Available' },
];

exports.getHelpers = async (req, res) => {
  try {
    let list = [];
    if (global.useJsonDb) {
      list = jsonDb.find('domesticHelp');
      if (list.length === 0) {
        // Seed default data
        DEFAULT_HELPERS.forEach(h => jsonDb.insert('domesticHelp', h));
        list = jsonDb.find('domesticHelp');
      }
    } else {
      const DomesticHelp = require('../models/DomesticHelp');
      list = await DomesticHelp.find().lean();
      if (list.length === 0) {
        await DomesticHelp.insertMany(DEFAULT_HELPERS);
        list = await DomesticHelp.find().lean();
      }
      list = list.map(h => ({ ...h, id: h._id.toString() }));
    }
    res.status(200).json({ helpers: list });
  } catch (error) {
    console.error('Get helpers error:', error);
    res.status(500).json({ message: 'Server error retrieving domestic help.' });
  }
};

exports.addHelper = async (req, res) => {
  try {
    const { name, role, phone } = req.body;
    if (!name || !role || !phone) {
      return res.status(400).json({ message: 'Name, role, and phone are required.' });
    }
    const newObj = { name, role, phone, rating: 5, reviews: 0, isVerified: true, availability: 'Available' };
    
    let helper;
    if (global.useJsonDb) {
      helper = jsonDb.insert('domesticHelp', newObj);
    } else {
      const DomesticHelp = require('../models/DomesticHelp');
      const doc = new DomesticHelp(newObj);
      await doc.save();
      helper = doc.toObject();
      helper.id = doc._id.toString();
    }
    res.status(201).json({ message: 'Helper added successfully', helper });
  } catch (error) {
    console.error('Add helper error:', error);
    res.status(500).json({ message: 'Server error adding helper.' });
  }
};
