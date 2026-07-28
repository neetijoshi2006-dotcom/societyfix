const mongoose = require('mongoose');

const VisitorPassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  purpose: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['Awaiting', 'Checked-In', 'Checked-Out', 'Expired'], default: 'Awaiting' },
  residentId: { type: String, required: true }, // Using string for JSON DB compatibility
  count: { type: Number, default: 1 }
}, {
  timestamps: true
});

VisitorPassSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
VisitorPassSchema.set('toJSON', { virtuals: true });
VisitorPassSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VisitorPass', VisitorPassSchema);
