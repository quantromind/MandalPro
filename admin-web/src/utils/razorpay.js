import api from '../api/client';

export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay payment gateway SDK'));
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay payment for a plan upgrade
 * @param {Object} params
 * @param {string} params.planCode - Target plan code (e.g., 'Gold', 'Silver')
 * @param {Object} params.user - Current authenticated user
 * @param {Function} params.onSuccess - Callback on successful verification
 * @param {Function} params.onError - Callback on payment failure or API error
 * @param {Function} params.onCancel - Callback when payment modal is dismissed
 */
export const initiatePlanUpgrade = async ({
  planCode,
  user,
  onSuccess,
  onError,
  onCancel
}) => {
  try {
    // 1. Create order on backend (checks active status and downgrade prevention)
    const { data: orderData } = await api.post('/payments/create-order', { plan: planCode });

    // 2. Ensure Razorpay script is loaded
    await loadRazorpayScript();

    // 3. Open Razorpay Checkout
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'Apla Mandal',
      description: `${orderData.planName || orderData.plan} Plan Subscription`,
      order_id: orderData.orderId,
      image: '/logo.png',
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.mobile || ''
      },
      theme: {
        color: '#FF6B00'
      },
      handler: async (response) => {
        try {
          // 4. Verify payment on backend
          const { data: verifyRes } = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan: orderData.plan
          });

          if (onSuccess) {
            onSuccess(verifyRes);
          }
        } catch (verifyErr) {
          const errMsg = verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed';
          if (onError) onError(new Error(errMsg));
        }
      },
      modal: {
        ondismiss: () => {
          if (onCancel) {
            onCancel('Payment window was closed. No charges were made.');
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      const reason = response.error?.description || response.error?.reason || 'Payment failed';
      if (onError) onError(new Error(reason));
    });

    rzp.open();
  } catch (err) {
    const errMsg = err.response?.data?.message || err.message || 'Failed to initiate payment';
    if (onError) onError(new Error(errMsg));
  }
};
