const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  provision,
  updateProfile,
  updateChecklist,
  upgradePlan,
  uploadVerificationDocs
} = require('../controllers/onboardingController');

router.post('/provision', protect, provision);
router.patch('/profile', protect, updateProfile);
router.patch('/checklist/:item', protect, updateChecklist);
router.patch('/plan', protect, upgradePlan);
router.post('/verification-docs', protect, uploadVerificationDocs);

module.exports = router;
