const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    action: { type: String, required: true }, // e.g. 'donation.cancel', 'expense.approve'
    entity: { type: String, required: true }, // e.g. 'Donation'
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
