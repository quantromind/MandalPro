const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, otpStore } = require('../controllers/otpController');
const { register, login, loginWithOtp, getMe, updateProfile, inviteMember } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/login-otp', loginWithOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/invite', protect, allowRoles('president', 'secretary'), inviteMember);

module.exports = router;
