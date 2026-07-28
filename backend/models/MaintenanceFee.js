const mongoose = require('mongoose');

const MaintenanceFeeSchema = new mongoose.Schema({
  residentId: { type: String, required: true },
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  dueOn: { type: String, required: true },
  paidOn: { type: String },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Due Soon'], default: 'Pending' }
}, {
  timestamps: true
});

MaintenanceFeeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
MaintenanceFeeSchema.set('toJSON', { virtuals: true });
MaintenanceFeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MaintenanceFee', MaintenanceFeeSchema);
