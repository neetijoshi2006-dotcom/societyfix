const jsonDb = require('../data/jsonDb');

exports.createPass = async (req, res) => {
  try {
    const { name, phone, date, time, purpose, count } = req.body;
    const residentId = req.user.id;

    if (!name || !phone || !date) {
      return res.status(400).json({ message: 'Name, phone and date are required.' });
    }

    const code = 'V-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const newPassObj = {
      name,
      phone,
      date,
      time,
      purpose,
      code,
      status: 'Awaiting',
      residentId,
      count: count || 1
    };

    let pass;
    if (global.useJsonDb) {
      pass = jsonDb.insert('visitors', newPassObj);
    } else {
      const VisitorPass = require('../models/VisitorPass');
      const mongoPass = new VisitorPass(newPassObj);
      await mongoPass.save();
      pass = mongoPass.toObject();
      pass.id = mongoPass._id.toString();
    }

    res.status(201).json({ message: 'Gate pass generated successfully!', pass });
  } catch (error) {
    console.error('Create pass error:', error);
    res.status(500).json({ message: 'Server error generating pass.' });
  }
};

exports.getPasses = async (req, res) => {
  try {
    const residentId = req.user.id;
    let list = [];
    
    if (global.useJsonDb) {
      list = jsonDb.find('visitors', { residentId });
    } else {
      const VisitorPass = require('../models/VisitorPass');
      list = await VisitorPass.find({ residentId }).sort({ createdAt: -1 }).lean();
      list = list.map(p => ({ ...p, id: p._id.toString() }));
    }

    // Auto-expire old passes
    const today = new Date().toISOString().split('T')[0];
    let updated = false;
    
    list = list.map(p => {
      if (p.status === 'Awaiting' && p.date < today) {
        p.status = 'Expired';
        updated = true;
        if (global.useJsonDb) {
          jsonDb.updateById('visitors', p.id, { status: 'Expired' });
        } else {
          const VisitorPass = require('../models/VisitorPass');
          VisitorPass.findByIdAndUpdate(p.id, { status: 'Expired' }).exec();
        }
      }
      return p;
    });

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ passes: list });
  } catch (error) {
    console.error('Get passes error:', error);
    res.status(500).json({ message: 'Server error retrieving passes.' });
  }
};
