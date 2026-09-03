const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    title: { type: String },
    donorName: { type: String, required: true },
    donorMobile: { type: String },
    amount: { type: Number, required: true },
    purpose: { type: String },
    category: { type: String },
    date: { type: Date, default: Date.now },
    description: { type: String },
    paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'netbanking'], default: 'cash' },
    status: { type: String, enum: ['Draft', 'Issued', 'Cancelled', 'Reversed'], default: 'Issued' },
    receiptNumber: { type: String, index: true },
    qrCodeDataUrl: { type: String },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    idempotencyKey: { type: String, index: true },
    syncStatus: { type: String, enum: ['Synced', 'Pending', 'Conflict'], default: 'Synced' },
    cancelReason: { type: String }
  },
  { timestamps: true }
);

donationSchema.index(
  { mandalId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Donation', donationSchema);
