const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'accepted', 'in-progress', 'waiting-materials', 'completed', 'closed'],
    default: 'pending' 
  },
  location: {
    building: { type: String, required: true },
    wing: { type: String, required: true },
    floor: { type: Number, required: true },
    flatNumber: { type: String, required: true },
    exactLocation: { type: String }
  },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  images: [{ type: String }],
  beforeAfterImages: {
    before: [{ type: String }],
    after: [{ type: String }]
  },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  timeline: [{
    status: { type: String, required: true },
    notes: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  rating: {
    stars: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    suggestions: { type: String },
    createdAt: { type: Date }
  }
}, {
  timestamps: true
});

ComplaintSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
ComplaintSchema.set('toJSON', { virtuals: true });
ComplaintSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
