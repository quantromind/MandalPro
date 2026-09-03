const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String },
    emailVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'president', 'treasurer', 'secretary', 'volunteer'],
      default: 'volunteer'
    },
    permissions: {
      canCollect: { type: Boolean, default: true },
      canManageExpenses: { type: Boolean, default: false },
      canAddMembers: { type: Boolean, default: false },
      canChat: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: false }
    },
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal' },      // primary / active mandal
    mandalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mandal' }],   // all owned mandals
    status: { type: String, enum: ['active', 'invited', 'disabled'], default: 'active' }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model('User', userSchema);
