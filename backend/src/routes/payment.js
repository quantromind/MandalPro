const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { createOrder, verifyPayment, getKey, getCheckoutPage } = require('../controllers/paymentController');

router.get('/checkout-page', getCheckoutPage);
router.get('/key', protect, getKey);
router.post('/create-order', protect, requireMandal, createOrder);
router.post('/verify', protect, requireMandal, verifyPayment);

module.exports = router;
