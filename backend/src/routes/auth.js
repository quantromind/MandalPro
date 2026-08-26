const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, testEmail, checkEmail } = require('../controllers/otpController');
const {
  register,
  login,
  loginWithOtp,
  getMe,
  updateProfile,
  inviteMember,
  sendDeleteAccountOtp,
  deleteAccountWithOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.all('/test-email', testEmail);
router.post('/check-email', checkEmail);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/login-otp', loginWithOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/invite', protect, allowRoles('president', 'secretary'), inviteMember);

// Account deletion with OTP verification
router.post('/delete-account/send-otp', protect, sendDeleteAccountOtp);
router.post('/delete-account', protect, deleteAccountWithOtp);
router.delete('/delete-account', protect, deleteAccountWithOtp);

module.exports = router;
