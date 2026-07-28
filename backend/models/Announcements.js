const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['water-shutdown', 'maintenance', 'events', 'electricity', 'security-alerts'], 
    required: true 
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

AnnouncementSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
AnnouncementSchema.set('toJSON', { virtuals: true });
AnnouncementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
