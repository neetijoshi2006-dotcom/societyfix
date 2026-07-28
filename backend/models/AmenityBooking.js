const mongoose = require('mongoose');

const AmenityBookingSchema = new mongoose.Schema({
  amenityName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  residentId: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Confirmed' },
  membersCount: { type: Number, default: 1 }
}, {
  timestamps: true
});

AmenityBookingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
AmenityBookingSchema.set('toJSON', { virtuals: true });
AmenityBookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AmenityBooking', AmenityBookingSchema);
