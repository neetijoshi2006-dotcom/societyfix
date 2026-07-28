const mongoose = require('mongoose');

const DomesticHelpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }, // e.g., 'Maid', 'Cook', 'Driver', 'Plumber'
  phone: { type: String, required: true },
  rating: { type: Number, default: 5 },
  reviews: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  availability: { type: String, enum: ['Available', 'Busy', 'Unavailable'], default: 'Available' },
  avatarUrl: { type: String }
}, { timestamps: true });

DomesticHelpSchema.virtual('id').get(function() { return this._id.toHexString(); });
DomesticHelpSchema.set('toJSON', { virtuals: true });
DomesticHelpSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DomesticHelp', DomesticHelpSchema);
