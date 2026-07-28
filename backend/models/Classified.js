const mongoose = require('mongoose');

const ClassifiedSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String }, // Can be base64 or URL
  sellerName: { type: String, required: true },
  sellerPhone: { type: String, required: true },
  residentId: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Sold'], default: 'Available' }
}, { timestamps: true });

ClassifiedSchema.virtual('id').get(function() { return this._id.toHexString(); });
ClassifiedSchema.set('toJSON', { virtuals: true });
ClassifiedSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Classified', ClassifiedSchema);
