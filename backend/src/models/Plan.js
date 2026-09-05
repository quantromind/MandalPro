const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameMr: { type: String, default: '', trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    period: { type: String, default: '/month' },
    periodMr: { type: String, default: '/महिना' },
    tier: { type: Number, required: true, default: 1 },
    memberLimit: { type: Number, default: 15 },
    memberLimitEn: { type: String, default: '' },
    memberLimitMr: { type: String, default: '' },
    tagline: { type: String, default: '' },
    taglineMr: { type: String, default: '' },
    badge: { type: String, default: '' },
    badgeMr: { type: String, default: '' },
    color: { type: String, default: '#0284C7' },
    popular: { type: Boolean, default: false },
    features: [{ type: String }],
    featuresMr: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
