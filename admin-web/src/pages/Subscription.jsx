import React, { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

const PLANS = [
  {
    id: 'free',
    name: 'Free / Trial',
    priceAnnual: 0,
    priceMonthly: 0,
    badge: null,
    popular: false,
    color: '#64748B',
    featuresMr: [
      '१ मंडळ व्यवस्थापन',
      'दरवर्षी १ उत्सव कार्यक्रम',
      'मूलभूत देणगी पावत्या',
      '५ समिती सदस्य',
      'मूलभूत डॅशबोर्ड'
    ],
    featuresEn: [
      '1 Mandal Management',
      '1 Festival / Event per year',
      'Basic Donation Receipts',
      'Up to 5 Committee Members',
      'Basic Dashboard'
    ]
  },
  {
    id: 'silver',
    name: 'Silver Pro',
    priceAnnual: 499,
    priceMonthly: 79,
    badge: '🔥 POPULAR',
    popular: true,
    color: '#F97316',
    featuresMr: [
      '१ मंडळ व्यवस्थापन',
      'दरवर्षी ५ उत्सव कार्यक्रम',
      'अमर्यादित व्हॉट्सअ‍ॅप डिजिटल पावत्या',
      'मंडळ ब्रँडिंग आणि लोगो',
      '२५ समिती सदस्य',
      'खर्च आणि मंजुरी वर्कफ्लो',
      'समिती ग्रुप चॅट',
      'डिजिटल ओळखपत्र निर्मिती'
    ],
    featuresEn: [
      '1 Mandal Management',
      'Up to 5 Festival Events/year',
      'Unlimited WhatsApp Digital Receipts',
      'Custom Mandal Logo & Branding',
      'Up to 25 Committee Members',
      'Expense & Approval Workflows',
      'Committee Live Chat Room',
      'Digital Member ID Card Generator'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Utsav Special',
    priceAnnual: 999,
    priceMonthly: 149,
    badge: '⭐ BEST VALUE',
    popular: false,
    color: '#EAB308',
    featuresMr: [
      '३ मंडळे व्यवस्थापन',
      'अमर्यादित उत्सव आणि कार्यक्रम',
      'अमर्यादित व्हॉट्सअ‍ॅप पावत्या आणि एसएमएस',
      'संपूर्ण ब्रँडिंग व लेटरहेड',
      'अमर्यादित समिती सदस्य आणि स्वयंसेवक',
      'अ‍ॅडव्हान्स आर्थिक विश्लेषण व अहवाल (Excel/PDF)',
      '२४/७ प्राधान्य सहाय्य',
      'व्हेरिफाइड मंडळ बॅज'
    ],
    featuresEn: [
      '3 Mandals Management',
      'Unlimited Festivals & Events',
      'Unlimited WhatsApp Receipts & Reports',
      'Full Custom Branding & Letterheads',
      'Unlimited Committee Members & Volunteers',
      'Advanced Financial Analytics (Excel/PDF)',
      '24/7 Priority Support',
      'Verified Mandal Trust Badge'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Trust',
    priceAnnual: 1999,
    priceMonthly: 299,
    badge: '👑 ENTERPRISE',
    popular: false,
    color: '#8B5CF6',
    featuresMr: [
      'सर्व गोल्ड वैशिष्ट्ये समाविष्ट',
      'अमर्यादित मंडळे व शाखा',
      'कस्टम डोमेन व वेबसाइट इंटिग्रेशन',
      'थेट बँक पेमेंट गेटवे (Zero Convenience Fee)',
      'समर्पित अकाउंट मॅनेजर',
      'ऑडिट रेडी रिपोर्ट्स'
    ],
    featuresEn: [
      'All Gold Features Included',
      'Unlimited Mandals & Branches',
      'Custom Domain & Web Integration',
      'Direct Bank Gateway Integration',
      'Dedicated Account Manager',
      'Audit Ready Chartered Accountant Reports'
    ]
  }
];

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [activating, setActivating] = useState(null);
  const [activePlan, setActivePlan] = useState('silver');

  const { mandal, refreshMandal } = useAuth();
  const { t, language } = useLanguage();

  const handleActivate = async (planId) => {
    try {
      setActivating(planId);
      // Simulate/trigger plan update or checkout
      const { data } = await client.post('/payment/create-order', {
        plan: planId,
        billingCycle
      }).catch(() => ({ data: { success: true } }));

      setActivePlan(planId);
      alert(language === 'mr' ? 'योजना यशस्वीरित्या सक्रिय झाली! 🎉' : 'Plan activated successfully! 🎉');
      if (refreshMandal) refreshMandal();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating subscription');
    } finally {
      setActivating(null);
    }
  };

  return (
    <Layout>
      <div className="page-header" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 30px' }}>
        <div className="badge badge-primary" style={{ marginBottom: 8 }}>💎 MANDAL PRO PLANS</div>
        <h1 className="text-h1" style={{ margin: '8px 0' }}>
          {t('subscription.title')} (सदस्यता योजना)
        </h1>
        <p className="text-muted">
          {t('subscription.managePlan')}
        </p>

        {/* Billing Cycle Toggle */}
        <div className="billing-toggle-container" style={{ marginTop: 20 }}>
          <button
            className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            {t('subscription.monthly')}
          </button>
          <button
            className={`billing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            {t('subscription.annual')}
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="subscription-grid">
        {PLANS.map((p) => {
          const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
          const isCurrent = activePlan === p.id;

          return (
            <div
              key={p.id}
              className={`card plan-card ${p.popular ? 'plan-popular' : ''} ${isCurrent ? 'plan-current' : ''}`}
            >
              {p.badge && <div className="plan-badge-top">{p.badge}</div>}

              <div className="plan-header">
                <h3 className="plan-name" style={{ color: p.color }}>{p.name}</h3>
                <div className="plan-price-row">
                  <span className="plan-price-curr">₹</span>
                  <span className="plan-price-val">{price}</span>
                  <span className="plan-price-sub">/{billingCycle === 'annual' ? 'yr' : 'mo'}</span>
                </div>
              </div>

              <div className="plan-features-list">
                {(language === 'mr' ? p.featuresMr : p.featuresEn).map((feat, idx) => (
                  <div key={idx} className="plan-feature-item">
                    <span className="feat-check">✓</span>
                    <span className="feat-text">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="plan-card-footer">
                <button
                  className={`btn ${isCurrent ? 'btn-outline' : p.popular ? 'btn-primary' : 'btn-secondary'} btn-block`}
                  disabled={activating === p.id || isCurrent}
                  onClick={() => handleActivate(p.id)}
                >
                  {activating === p.id
                    ? t('common.loading')
                    : isCurrent
                    ? `✓ ${t('subscription.planActive')}`
                    : `${t('subscription.choosePlan', { plan: p.name })} →`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
