const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-deleted by MongoDB after 10 minutes (600s)
  },
  { timestamps: true }
);

otpSchema.index({ email: 1 });

module.exports = mongoose.model('Otp', otpSchema);
