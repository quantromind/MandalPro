const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    type: { type: String, enum: ['sponsor', 'vendor'], required: true },
    name: { type: String, required: true },
    contact: { type: String },
    packageOrContract: { type: String },
    totalAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
