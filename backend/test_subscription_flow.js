require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('./src/config/db');
const Mandal = require('./src/models/Mandal');
const Plan = require('./src/models/Plan');
const { seedDefaultPlansIfEmpty } = require('./src/controllers/planController');
const { createOrder, verifyPayment } = require('./src/controllers/paymentController');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SUBSCRIPTION FLOW TESTS');
  console.log('====================================================');

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Default Plans Auto-Seeding
    // ----------------------------------------------------
    console.log('\n--- Test 1: Plan Seeding & Schema ---');
    await seedDefaultPlansIfEmpty();
    const activePlans = await Plan.find({ isActive: true }).sort({ tier: 1 });
    assert(activePlans.length >= 2, `Default plans seeded (found ${activePlans.length} active plans)`);
    const silverPlan = activePlans.find(p => p.code === 'Silver');
    const goldPlan = activePlans.find(p => p.code === 'Gold');
    assert(silverPlan && silverPlan.price === 199 && silverPlan.tier === 1, 'Silver plan present with ₹199 and Tier 1');
    assert(goldPlan && goldPlan.price === 299 && goldPlan.tier === 2, 'Gold plan present with ₹299 and Tier 2');

    // ----------------------------------------------------
    // TEST 2: SuperAdmin Plan Management (Create, Deactivate, Activate, Delete)
    // ----------------------------------------------------
    console.log('\n--- Test 2: SuperAdmin Plan Management ---');
    // Cleanup any previous test plan
    await Plan.deleteOne({ code: 'TestDiamond' });

    // 2a. Create Plan
    const newPlan = await Plan.create({
      name: 'Test Diamond Plan',
      code: 'TestDiamond',
      price: 699,
      tier: 3,
      memberLimit: 50,
      features: ['Unlimited Everything', 'VIP Support'],
      isActive: true
    });
    assert(newPlan && newPlan.code === 'TestDiamond', 'SuperAdmin can create a new plan');

    // 2b. Deactivate Plan
    newPlan.isActive = false;
    await newPlan.save();
    const plansAfterDeactivate = await Plan.find({ isActive: true });
    const isDiamondInActive = plansAfterDeactivate.some(p => p.code === 'TestDiamond');
    assert(!isDiamondInActive, 'Deactivated plan is excluded from active plans query');

    // 2c. Reactivate Plan
    newPlan.isActive = true;
    await newPlan.save();
    const plansAfterReactivate = await Plan.find({ isActive: true });
    const isDiamondInReactivated = plansAfterReactivate.some(p => p.code === 'TestDiamond');
    assert(isDiamondInReactivated, 'Reactivated plan is included in active plans query');

    // ----------------------------------------------------
    // TEST 3: Deactivated Plan Subscription Rejection
    // ----------------------------------------------------
    console.log('\n--- Test 3: Deactivated Plan Rejection in Payment Order ---');
    // Deactivate Diamond plan
    newPlan.isActive = false;
    await newPlan.save();

    // Create a temporary test mandal
    const testMandal = await Mandal.create({
      name: 'Automated Test Mandal',
      plan: 'None',
      planStatus: 'Inactive'
    });

    let orderErrorMsg = '';
    const reqDeactivated = {
      body: { plan: 'TestDiamond' },
      mandalId: testMandal._id
    };
    const resMock = {
      status: (code) => ({ json: (data) => data }),
      json: (data) => data
    };

    try {
      await createOrder(reqDeactivated, resMock);
    } catch (err) {
      orderErrorMsg = err.message;
    }
    assert(
      orderErrorMsg.includes('deactivated and not available'),
      `Attempting to subscribe to a deactivated plan is blocked: "${orderErrorMsg}"`
    );

    // ----------------------------------------------------
    // TEST 4: Downgrade Prevention
    // ----------------------------------------------------
    console.log('\n--- Test 4: Downgrade Prevention ---');
    // Set test mandal to Active Gold (Tier 2, ₹299)
    testMandal.plan = 'Gold';
    testMandal.planStatus = 'Active';
    await testMandal.save();

    let downgradeErrorMsg = '';
    const reqDowngrade = {
      body: { plan: 'Silver' }, // Silver is Tier 1, ₹199 (Lower)
      mandalId: testMandal._id
    };

    try {
      await createOrder(reqDowngrade, resMock);
    } catch (err) {
      downgradeErrorMsg = err.message;
    }
    assert(
      downgradeErrorMsg.includes('Downgrading is not permitted'),
      `Downgrade attempt from Gold to Silver is blocked: "${downgradeErrorMsg}"`
    );

    // Same-plan re-selection check
    let samePlanErrorMsg = '';
    const reqSame = {
      body: { plan: 'Gold' },
      mandalId: testMandal._id
    };
    try {
      await createOrder(reqSame, resMock);
    } catch (err) {
      samePlanErrorMsg = err.message;
    }
    assert(
      samePlanErrorMsg.includes('already subscribed'),
      `Re-selecting currently active plan is blocked: "${samePlanErrorMsg}"`
    );

    // ----------------------------------------------------
    // TEST 5: Full Payment Flow - Order Creation to Verification
    // ----------------------------------------------------
    console.log('\n--- Test 5: Successful Payment & Plan Activation ---');
    // Set mandal to Silver (Tier 1) so it can legitimately upgrade to Gold (Tier 2)
    testMandal.plan = 'Silver';
    testMandal.planStatus = 'Active';
    await testMandal.save();

    let createdOrder = null;
    const resOrderCapture = {
      status: (c) => resOrderCapture,
      json: (data) => { createdOrder = data; }
    };

    await createOrder({
      body: { plan: 'Gold' },
      mandalId: testMandal._id
    }, resOrderCapture);

    assert(createdOrder && createdOrder.orderId, `Razorpay order created successfully: ${createdOrder?.orderId}`);
    assert(createdOrder && createdOrder.amount === 29900, `Order amount is correct (₹299 = 29900 paise)`);

    // Simulate successful payment with valid signature
    const simPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${createdOrder.orderId}|${simPaymentId}`)
      .digest('hex');

    let verifyResult = null;
    const resVerifyCapture = {
      status: (c) => resVerifyCapture,
      json: (data) => { verifyResult = data; }
    };

    await verifyPayment({
      body: {
        razorpay_order_id: createdOrder.orderId,
        razorpay_payment_id: simPaymentId,
        razorpay_signature: validSignature,
        plan: 'Gold'
      },
      mandalId: testMandal._id
    }, resVerifyCapture);

    assert(verifyResult && verifyResult.success === true, 'Payment verification returned success');

    // Verify DB state
    const updatedMandal = await Mandal.findById(testMandal._id);
    assert(updatedMandal.plan === 'Gold', `Mandal plan upgraded to Gold (DB: ${updatedMandal.plan})`);
    assert(updatedMandal.planStatus === 'Active', `Mandal plan status is Active (DB: ${updatedMandal.planStatus})`);
    assert(updatedMandal.lastPaymentId === simPaymentId, `Mandal stored valid payment ID`);

    // ----------------------------------------------------
    // TEST 6: Failed Payment Verification (Tampered/Invalid Signature)
    // ----------------------------------------------------
    console.log('\n--- Test 6: Failed Payment Verification Rejection ---');
    let failedPaymentError = '';
    const fakeSignature = 'bad_forged_signature_00000000000000000000000000';

    try {
      await verifyPayment({
        body: {
          razorpay_order_id: createdOrder.orderId,
          razorpay_payment_id: 'pay_fraud_123',
          razorpay_signature: fakeSignature,
          plan: 'Gold'
        },
        mandalId: testMandal._id
      }, resVerifyCapture);
    } catch (err) {
      failedPaymentError = err.message;
    }

    assert(
      failedPaymentError.includes('invalid signature'),
      `Invalid payment signature is rejected: "${failedPaymentError}"`
    );

    // ----------------------------------------------------
    // TEST 7: Direct Plan Bypass Route Disallowed
    // ----------------------------------------------------
    console.log('\n--- Test 7: Direct Unverified Plan Activation Blocked ---');
    const { upgradePlan } = require('./src/controllers/onboardingController');
    let bypassError = '';
    try {
      await upgradePlan({
        body: { plan: 'Gold' },
        mandalId: testMandal._id
      }, resMock);
    } catch (err) {
      bypassError = err.message;
    }
    assert(
      bypassError.includes('Direct plan activation without payment is disabled'),
      `Direct unverified plan activation endpoint is disabled: "${bypassError}"`
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\n--- Cleanup ---');
    await Mandal.findByIdAndDelete(testMandal._id);
    await Plan.deleteOne({ code: 'TestDiamond' });
    console.log('Cleaned up test mandal and test plan.');

  } catch (error) {
    console.error('Unexpected test failure:', error);
    failed++;
  } finally {
    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
