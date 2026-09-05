const mongoose = require('mongoose');

const mandalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    establishedYear: { type: String, default: '2023' },
    logoBase64: { type: String },            // base64 encoded logo
    address: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    upiId: { type: String },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String
    },
    eventTypes: [{ type: String, enum: ['Ganesh Utsav', 'Navratri', 'Jayanti', 'Diwali', 'Wedding/Hall', 'Custom'] }],
    plan: { type: String, default: 'None' },
    planStatus: { type: String, enum: ['Inactive', 'Active', 'GracePeriod', 'Expired'], default: 'Inactive' },
    planRenewsAt: { type: Date },
    lastPaymentId: { type: String },
    verified: { type: Boolean, default: false },
    verificationDocs: [{ type: String }],    // base64 encoded docs
    receiptPrefix: { type: String, default: 'RCPT' },
    receiptCounter: { type: Number, default: 1 },
    financialYearStartMonth: { type: Number, default: 4 }, // April
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Onboarding tracking
    onboardingComplete: { type: Boolean, default: false },
    checklist: {
      profileComplete:    { type: Boolean, default: false },
      eventTypesSelected: { type: Boolean, default: false },
      planSelected:       { type: Boolean, default: false },
      inviteTeam:         { type: Boolean, default: false },
      setReceiptNumber:   { type: Boolean, default: false },
      firstDonation:      { type: Boolean, default: false },
      firstEvent:         { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mandal', mandalSchema);

