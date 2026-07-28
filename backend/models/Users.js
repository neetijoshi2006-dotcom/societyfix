const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true },
  role: { type: String, enum: ['resident', 'staff', 'manager', 'admin'], default: 'resident' },
  avatar: { type: String },
  details: {
    // For Resident
    building: { type: String },
    wing: { type: String },
    floor: { type: Number },
    flatNumber: { type: String },
    // For Staff
    skills: [{ type: String }],
    rating: { type: Number, default: 5.0 },
    activeJobsCount: { type: Number, default: 0 },
    isSuspended: { type: Boolean, default: false }
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  language: { type: String, default: 'English' }
}, {
  timestamps: true
});

// Configure Virtual ID to mimic JSON DB id
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
