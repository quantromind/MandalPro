const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    title: { type: String },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    vendor: { type: String },
    date: { type: Date, default: Date.now },
    description: { type: String },
    billImageUrl: { type: String },
    ocrData: {
      vendor: String,
      date: String,
      amount: Number,
      taxAmount: Number,
      confidence: Number
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid', 'Reconciled'],
      default: 'Draft'
    },
    paymentType: { type: String, enum: ['cash', 'digital'] },
    rejectReason: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
