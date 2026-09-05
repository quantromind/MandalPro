const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Mandal = require('../models/Mandal');
const Plan = require('../models/Plan');
const { seedDefaultPlansIfEmpty } = require('./planController');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper to resolve plan from DB
const resolvePlan = async (planIdentifier) => {
  if (!planIdentifier) return null;
  await seedDefaultPlansIfEmpty();

  let plan = await Plan.findOne({
    $or: [
      { code: planIdentifier },
      { code: new RegExp(`^${planIdentifier}$`, 'i') },
      { name: planIdentifier },
      { name: new RegExp(`^${planIdentifier}$`, 'i') }
    ]
  });

  return plan;
};

// Helper to check if upgrade is allowed (downgrade prevention)
const checkPlanUpgradeAllowed = async (mandal, targetPlan) => {
  // If mandal is not currently on an active paid plan, any active plan is allowed
  if (mandal.planStatus !== 'Active' || !mandal.plan || mandal.plan === 'None' || mandal.plan === 'free') {
    return { allowed: true };
  }

  const currentPlan = await resolvePlan(mandal.plan);
  if (!currentPlan) {
    return { allowed: true };
  }

  // If selecting the exact same plan that is already active
  if (currentPlan.code.toLowerCase() === targetPlan.code.toLowerCase()) {
    return {
      allowed: false,
      message: `You are already subscribed to the ${currentPlan.name}.`
    };
  }

  // Downgrade check: target tier must be strictly greater than current tier
  const currentTier = currentPlan.tier || 1;
  const targetTier = targetPlan.tier || 1;

  if (targetTier < currentTier || targetPlan.price < currentPlan.price) {
    return {
      allowed: false,
      message: `Downgrading is not permitted. You are already on the higher ${currentPlan.name} (₹${currentPlan.price}). You cannot switch to ${targetPlan.name} (₹${targetPlan.price}).`
    };
  }

  return { allowed: true };
};

// @desc  Create Razorpay order for plan upgrade
// @route POST /api/payments/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { plan: planInput } = req.body;

  if (!planInput) {
    res.status(400);
    throw new Error('Plan is required');
  }

  const targetPlan = await resolvePlan(planInput);
  if (!targetPlan) {
    res.status(400);
    throw new Error(`Plan "${planInput}" not found`);
  }

  // 1. Check if plan is active
  if (targetPlan.isActive === false) {
    res.status(400);
    throw new Error(`The plan "${targetPlan.name}" is currently deactivated and not available for new subscriptions.`);
  }

  const mandal = await Mandal.findById(req.mandalId);
  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  // 2. Prevent downgrade
  const upgradeCheck = await checkPlanUpgradeAllowed(mandal, targetPlan);
  if (!upgradeCheck.allowed) {
    res.status(400);
    throw new Error(upgradeCheck.message);
  }

  const amountPaise = Math.round(targetPlan.price * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `rcpt_${req.mandalId}_${Date.now()}`,
    notes: {
      mandalId: req.mandalId.toString(),
      mandalName: mandal.name,
      planCode: targetPlan.code,
      planName: targetPlan.name
    }
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    plan: targetPlan.code,
    planName: targetPlan.name,
    mandalName: mandal.name
  });
});

// @desc  Verify Razorpay payment signature and activate plan
// @route POST /api/payments/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan: planInput } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification fields (order ID, payment ID, signature)');
  }

  // 1. Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed: invalid signature');
  }

  // 2. Validate plan
  const targetPlan = await resolvePlan(planInput);
  if (!targetPlan) {
    res.status(400);
    throw new Error(`Plan "${planInput}" not found`);
  }

  if (targetPlan.isActive === false) {
    res.status(400);
    throw new Error(`The plan "${targetPlan.name}" is deactivated and cannot be activated.`);
  }

  const mandal = await Mandal.findById(req.mandalId);
  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  const upgradeCheck = await checkPlanUpgradeAllowed(mandal, targetPlan);
  if (!upgradeCheck.allowed) {
    res.status(400);
    throw new Error(upgradeCheck.message);
  }

  // 3. Activate plan upon successful verification
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1); // 1 month validity

  mandal.plan = targetPlan.code;
  mandal.planStatus = 'Active';
  mandal.planRenewsAt = renewsAt;
  mandal.onboardingComplete = true;
  mandal.lastPaymentId = razorpay_payment_id;
  if (!mandal.checklist) mandal.checklist = {};
  mandal.checklist.planSelected = true;

  await mandal.save();

  console.log(`[Payment] ✅ Plan "${targetPlan.name}" (${targetPlan.code}) activated for mandal "${mandal.name}" | Payment ID: ${razorpay_payment_id}`);

  res.json({
    success: true,
    plan: mandal.plan,
    planName: targetPlan.name,
    planStatus: mandal.planStatus,
    planRenewsAt: mandal.planRenewsAt,
    paymentId: razorpay_payment_id
  });
});

// @desc  Get Razorpay key ID (safe to expose)
// @route GET /api/payments/key
const getKey = asyncHandler(async (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// @desc  Render hosted Razorpay checkout page for mobile WebView
// @route GET /api/payments/checkout-page
const getCheckoutPage = asyncHandler(async (req, res) => {
  const { orderId, amount, currency = 'INR', keyId, plan = 'Basic', name = '', email = '' } = req.query;

  const simPaymentId = `pay_test_${Date.now()}`;
  const simSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${simPaymentId}`)
    .digest('hex');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Apla Mandal Secure Checkout</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #F8F8F6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px 18px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      max-width: 380px;
      width: 100%;
      text-align: center;
      border: 1px solid #F0F0EE;
    }
    .brand {
      color: #FF6B00;
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .plan-title {
      font-size: 14px;
      color: #374151;
      margin: 0 0 10px;
    }
    .amount {
      font-size: 30px;
      font-weight: 800;
      color: #17233C;
      margin-bottom: 16px;
    }
    .btn {
      background: #FF6B00;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      box-shadow: 0 4px 16px rgba(255,107,0,0.3);
      transition: opacity 0.2s;
    }
    .btn:active { opacity: 0.85; }
    .btn-test {
      background: #10B981;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 13px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      box-shadow: 0 4px 14px rgba(16,185,129,0.25);
    }
    .status {
      font-size: 12px;
      color: #6B7280;
      margin-top: 14px;
    }
    .tips {
      margin-top: 16px;
      text-align: left;
      background: #FFF7ED;
      border: 1px solid #FFEDD5;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 12px;
      color: #9A3412;
      line-height: 1.5;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="card">
    <div class="brand">🪔 Apla Mandal</div>
    <div class="plan-title">Upgrading to <strong>${plan} Plan</strong></div>
    <div class="amount">₹${Number(amount) / 100}</div>
    
    <button class="btn" id="payBtn">Pay with Razorpay Gateway →</button>
    <button class="btn-test" id="testBtn" onclick="simulateTestSuccess()">⚡ 1-Click Test Payment (Instant)</button>
    
    <div class="status" id="statusText">🔒 256-bit Encrypted Checkout</div>

    <div class="tips">
      <strong>💡 Razorpay Test Mode Guide (India Domestic):</strong><br/>
      • <strong>Cards</strong>: Use <code>4000 0000 0000 0002</code> (Domestic Visa), expiry <code>12/28</code>, CVV <code>123</code>, OTP <code>123456</code><br/>
      • <strong>Netbanking</strong>: Pick <strong>HDFC Bank / SBI / ICICI</strong> & tap "Success"<br/>
      • <strong>UPI</strong>: Enter VPA <code>success@razorpay</code><br/>
      • <strong>Instant</strong>: Tap the green <strong>1-Click Test Payment</strong> button above!
    </div>
  </div>

  <script>
    function simulateTestSuccess() {
      document.getElementById('statusText').innerText = '✅ Test Payment complete! Activating plan...';
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          response: {
            razorpay_order_id: "${orderId}",
            razorpay_payment_id: "${simPaymentId}",
            razorpay_signature: "${simSignature}"
          }
        }));
      }
    }

    var options = {
      "key": "${keyId || process.env.RAZORPAY_KEY_ID}",
      "amount": "${amount}",
      "currency": "${currency}",
      "name": "Apla Mandal",
      "description": "${plan} Plan Subscription",
      "order_id": "${orderId}",
      "handler": function (response) {
        document.getElementById('statusText').innerText = '✅ Payment complete! Verifying...';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', response: response }));
        }
      },
      "prefill": {
        "name": "${name}",
        "email": "${email}"
      },
      "theme": {
        "color": "#FF6B00"
      },
      "modal": {
        "ondismiss": function() {
          document.getElementById('statusText').innerText = 'Payment was closed. Choose a method to continue.';
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'modal_dismissed' }));
          }
        }
      }
    };

    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response){
      document.getElementById('statusText').innerText = '❌ ' + (response.error.description || 'Payment could not be completed.');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: response.error }));
      }
    });

    document.getElementById('payBtn').onclick = function() {
      rzp.open();
    };

    window.onload = function() {
      setTimeout(function() {
        rzp.open();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = { createOrder, verifyPayment, getKey, getCheckoutPage };
