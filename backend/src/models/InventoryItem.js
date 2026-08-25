const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['stock', 'asset'], default: 'stock' },
    quantity: { type: Number, default: 1 },
    lowStockThreshold: { type: Number, default: 0 },
    qrCode: { type: String },
    status: { type: String, enum: ['Available', 'Issued', 'Overdue'], default: 'Available' },
    issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date },
    dueBackAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
