const asyncHandler = require('express-async-handler');
const Plan = require('../models/Plan');

const DEFAULT_PLANS = [
  {
    name: 'Silver Pro Plan',
    nameMr: 'सिल्व्हर प्रो योजना',
    code: 'Silver',
    price: 199,
    period: '/month',
    periodMr: '/महिना',
    tier: 1,
    memberLimit: 15,
    memberLimitEn: 'Up to 15 Committee Members',
    memberLimitMr: '१५ समिती सदस्य व स्वयंसेवक',
    tagline: 'Ideal for local & community mandals',
    taglineMr: 'स्थानिक आणि छोट्या मंडळांसाठी सर्वोत्तम',
    badge: '⚡ AFFORDABLE',
    badgeMr: '⚡ परवडणारी योजना',
    color: '#0284C7',
    popular: false,
    isActive: true,
    sortOrder: 1,
    features: [
      '1 Mandal Management',
      'Up to 15 Committee Members',
      'Instant WhatsApp Receipts',
      'Expense Tracker & Bill Upload',
      'Marathi & English Language Support',
      'Basic Financial Summary Report'
    ],
    featuresMr: [
      '१ मंडळ संपूर्ण व्यवस्थापन',
      'कमाल १५ समिती सदस्य व कार्यकर्ते जोडण्याची सोय',
      'झटपट डिजिटल WhatsApp पावती (PDF)',
      'खर्च नोंद व बिलांचे फोटो साठवणूक',
      'मराठी आणि इंग्रजी दोन्ही भाषांमध्ये उपलब्ध',
      'सोपे आर्थिक ताळेबंद अहवाल'
    ]
  },
  {
    name: 'Gold Pro Membership',
    nameMr: 'गोल्ड प्रो सदस्यत्व',
    code: 'Gold',
    price: 299,
    period: '/month',
    periodMr: '/महिना',
    tier: 2,
    memberLimit: 25,
    memberLimitEn: 'Up to 25 Committee Members',
    memberLimitMr: '२५ समिती सदस्य व स्वयंसेवक',
    tagline: 'Complete financial & festival management for active mandals',
    taglineMr: 'सक्रिय आणि मोठ्या मंडळांसाठी परिपूर्ण व्यवस्थापन',
    badge: '🔥 MOST POPULAR • BEST VALUE',
    badgeMr: '🔥 सर्वाधिक पसंती • BEST VALUE',
    color: '#D97706',
    popular: true,
    isActive: true,
    sortOrder: 2,
    features: [
      '2 Mandals / Branches Management',
      'Up to 25 Committee Members & Volunteers',
      'Official Logo & Seal Branded WhatsApp Receipts',
      'Expense Approval Workflow with Bill Photos',
      'CA Audit-Ready Balance Sheet (Excel/PDF)',
      'Verified Mandal Trust Badge',
      '24/7 Priority WhatsApp & Call Support',
      'Free Access to All Future Pro Features'
    ],
    featuresMr: [
      '२ मंडळे / शाखा संपूर्ण व्यवस्थापन',
      'कमाल २५ समिती सदस्य व कार्यकर्ते जोडण्याची सोय',
      'अधिकृत शिक्का व लोगो असलेली Branded WhatsApp पावती',
      'खर्च मंजुरी वर्कफ्लो (Approval) व बिलांचे फोटो साठवणूक',
      'सीए ऑडिट-रेडी Excel व PDF ताळेबंद अहवाल',
      'व्हेरिफाइड मंडळ ट्रस्ट बॅज (Verified Mandal Badge)',
      '२४/७ प्राधान्य WhatsApp व फोन सहाय्य',
      'भविष्यातील सर्व नवीन फीचर्सचा मोफत समावेश'
    ]
  }
];

// Helper to seed default plans if collection is empty
const seedDefaultPlansIfEmpty = async () => {
  const count = await Plan.countDocuments();
  if (count === 0) {
    console.log('[Plans] Seeding default plans...');
    await Plan.insertMany(DEFAULT_PLANS);
    console.log('[Plans] Default plans seeded successfully');
  }
};

// @desc  Get all active plans (for public / users)
// @route GET /api/plans
const getActivePlans = asyncHandler(async (req, res) => {
  await seedDefaultPlansIfEmpty();
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, tier: 1, price: 1 });
  res.json(plans);
});

// @desc  Get single plan by code
// @route GET /api/plans/:code
const getPlanByCode = asyncHandler(async (req, res) => {
  await seedDefaultPlansIfEmpty();
  const plan = await Plan.findOne({
    $or: [{ code: req.params.code }, { code: new RegExp(`^${req.params.code}$`, 'i') }]
  });
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }
  res.json(plan);
});

module.exports = {
  getActivePlans,
  getPlanByCode,
  seedDefaultPlansIfEmpty,
  DEFAULT_PLANS
};
