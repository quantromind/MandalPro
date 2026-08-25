const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    category: { type: String, required: true },
    allocatedAmount: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

budgetSchema.index({ mandalId: 1, eventId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
