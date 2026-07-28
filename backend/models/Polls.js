const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const PollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [PollOptionSchema],
  createdBy: { type: String, required: true },
  expiry: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  voters: [{ type: String }],
  totalVotes: { type: Number, default: 0 }
}, {
  timestamps: true
});

PollSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
PollSchema.set('toJSON', { virtuals: true });
PollSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Poll', PollSchema);
