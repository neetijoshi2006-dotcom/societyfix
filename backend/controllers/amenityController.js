const jsonDb = require('../data/jsonDb');

exports.createBooking = async (req, res) => {
  try {
    const { amenityName, date, time, membersCount } = req.body;
    const residentId = req.user.id;

    if (!amenityName || !date || !time) {
      return res.status(400).json({ message: 'Amenity name, date and time are required.' });
    }

    const newBookingObj = {
      amenity: amenityName,
      date,
      time,
      residentId,
      status: 'Confirmed',
      membersCount: membersCount || 1
    };

    let booking;
    if (global.useJsonDb) {
      booking = jsonDb.insert('amenities', newBookingObj);
    } else {
      const AmenityBooking = require('../models/AmenityBooking');
      const mongoBooking = new AmenityBooking({ amenityName, date, time, residentId, membersCount });
      await mongoBooking.save();
      booking = mongoBooking.toObject();
      booking.id = mongoBooking._id.toString();
      booking.amenity = booking.amenityName; // Map name for consistency
    }

    res.status(201).json({ message: 'Booking confirmed successfully!', booking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error generating booking.' });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const residentId = req.user.id;
    let list = [];
    
    if (global.useJsonDb) {
      list = jsonDb.find('amenities', { residentId });
    } else {
      const AmenityBooking = require('../models/AmenityBooking');
      list = await AmenityBooking.find({ residentId }).sort({ createdAt: -1 }).lean();
      list = list.map(p => ({ ...p, id: p._id.toString(), amenity: p.amenityName }));
    }

    // Auto-complete past bookings
    const today = new Date().toISOString().split('T')[0];
    
    list = list.map(p => {
      if (p.status === 'Confirmed' && p.date < today) {
        p.status = 'Completed';
        if (global.useJsonDb) {
          jsonDb.updateById('amenities', p.id, { status: 'Completed' });
        } else {
          const AmenityBooking = require('../models/AmenityBooking');
          AmenityBooking.findByIdAndUpdate(p.id, { status: 'Completed' }).exec();
        }
      }
      return p;
    });

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ bookings: list });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error retrieving bookings.' });
  }
};
