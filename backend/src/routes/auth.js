const express = require('express');
const router = express.Router();
const { sendOtp, forgotPasswordSendOtp, verifyOtp, testEmail, checkEmail } = require('../controllers/otpController');
const {
  register,
  login,
  loginWithOtp,
  getMe,
  updateProfile,
  inviteMember,
  sendDeleteAccountOtp,
  deleteAccountWithOtp,
  verifyForgotPasswordOtp,
  resetPassword
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

// Forgot Password & Reset Password
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset-password', resetPassword);
router.post('/reset-password', resetPassword);

// Account deletion with OTP verification
router.post('/delete-account/send-otp', protect, sendDeleteAccountOtp);
router.post('/delete-account', protect, deleteAccountWithOtp);
router.delete('/delete-account', protect, deleteAccountWithOtp);

module.exports = router;
