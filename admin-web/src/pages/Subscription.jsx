import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import { initiatePlanUpgrade } from '../utils/razorpay';

const DEFAULT_PLANS = [
  {
    id: 'Silver',
    code: 'Silver',
    tier: 1,
    nameMr: 'सिल्व्हर योजना (Silver Plan)',
    nameEn: 'Silver Pro Plan',
    taglineMr: 'लहान व मध्यम आकाराच्या मंडळांसाठी',
    taglineEn: 'Ideal for local & community mandals',
    price: 199,
    periodMr: '/महिना',
    periodEn: '/month',
    badgeMr: '⚡ परवडणारी योजना',
    badgeEn: '⚡ AFFORDABLE',
    popular: false,
    color: '#0284C7',
    memberLimitMr: '१५ समिती सदस्य व स्वयंसेवक',
    memberLimitEn: 'Up to 15 Committee Members',
    featuresMr: [
      '१ मंडळ संपूर्ण व्यवस्थापन',
      'कमाल १५ समिती सदस्य व स्वयंसेवक जोडण्याची सोय',
      'अमर्यादित WhatsApp डिजिटल पावत्या (QR कोडसह)',
      'वर्गणी व देणगी हिशोब व्यवस्थापन',
      'खर्च आणि अंदाजपत्रक (Budget) ट्रॅकिंग',
      'समिती लाइव्ह ग्रुप चॅट',
      'डिजिटल सदस्य ओळखपत्रे (ID Cards)',
      'उत्सव जमा-खर्च अहवाल'
    ],
    featuresEn: [
      '1 Complete Mandal Management',
      'Up to 15 Committee Members & Volunteers',
      'Unlimited WhatsApp Digital Receipts with QR',
      'Collections & Donations Accounting',
      'Expense & Budget Tracking',
      'Committee Live Group Chat',
      'Digital Member ID Card Generator',
      'Festival Balance Sheet & Reports'
    ]
  },
  {
    id: 'Gold',
    code: 'Gold',
    tier: 2,
    nameMr: 'गोल्ड मेंबरशिप (Gold Membership)',
    nameEn: 'Gold Pro Membership',
    taglineMr: 'मोठ्या उत्सव व प्रतिष्ठित मंडळांसाठी',
    taglineEn: 'Best for large festive & public trusts',
    price: 299,
    periodMr: '/महिना',
    periodEn: '/month',
    badgeMr: '🔥 सर्वाधिक पसंती • BEST VALUE',
    badgeEn: '🔥 MOST POPULAR • BEST VALUE',
    popular: true,
    color: '#D97706',
    memberLimitMr: '२५ समिती सदस्य व स्वयंसेवक',
    memberLimitEn: 'Up to 25 Committee Members',
    featuresMr: [
      '२ मंडळे / शाखा संपूर्ण व्यवस्थापन',
      'कमाल २५ समिती सदस्य व कार्यकर्ते जोडण्याची सोय',
      'अधिकृत शिक्का व लोगो असलेली Branded WhatsApp पावती',
      'खर्च मंजुरी वर्कफ्लो (Approval) व बिलांचे फोटो साठवणूक',
      'सीए ऑडिट-रेडी Excel व PDF ताळेबंद अहवाल',
      'व्हेरिफाइड मंडळ ट्रस्ट बॅज (Verified Mandal Badge)',
      '२४/७ प्राधान्य WhatsApp व फोन सहाय्य',
      'भविष्यातील सर्व नवीन फीचर्सचा मोफत समावेश'
    ],
    featuresEn: [
      '2 Mandals / Branches Management',
      'Up to 25 Committee Members & Volunteers',
      'Official Logo & Seal Branded WhatsApp Receipts',
      'Expense Approval Workflow with Bill Photos',
      'CA Audit-Ready Balance Sheet (Excel/PDF)',
      'Verified Mandal Trust Badge',
      '24/7 Priority WhatsApp & Call Support',
      'Free Access to All Future Pro Features'
    ]
  }
];

export default function Subscription() {
  const [activating, setActivating] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  const { user, mandal, refreshMandal } = useAuth();
  const { language } = useLanguage();
  const isMr = language === 'mr';

  useEffect(() => {
    client.get('/plans')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((p) => ({
            id: p.code || p.id,
            code: p.code || p.id,
            tier: p.tier || 1,
            nameMr: p.nameMr || p.name,
            nameEn: p.name,
            taglineMr: p.taglineMr || p.tagline,
            taglineEn: p.tagline,
            price: p.price,
            periodMr: p.periodMr || '/महिना',
            periodEn: p.period || '/month',
            badgeMr: p.badgeMr || p.badge,
            badgeEn: p.badge,
            popular: Boolean(p.popular),
            color: p.color || '#0284C7',
            memberLimitMr: p.memberLimitMr || `${p.memberLimit || 15} सदस्य`,
            memberLimitEn: p.memberLimitEn || `Up to ${p.memberLimit || 15} Members`,
            featuresMr: p.featuresMr && p.featuresMr.length > 0 ? p.featuresMr : p.features,
            featuresEn: p.features || []
          }));
          setPlans(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const getCurrentTier = () => {
    if (!mandal || mandal.planStatus !== 'Active' || !mandal.plan || mandal.plan === 'None') {
      return 0;
    }
    const current = plans.find((p) => (p.code || p.id).toLowerCase() === mandal.plan.toLowerCase());
    return current?.tier || 1;
  };

  const handleActivate = async (planCode) => {
    const targetPlan = plans.find((p) => (p.code || p.id) === planCode);
    if (!targetPlan) return;

    const currentTier = getCurrentTier();
    if (mandal?.planStatus === 'Active' && targetPlan.tier <= currentTier) {
      alert(isMr ? 'कमी योजना किंवा सध्याची योजना निवडता येत नाही.' : 'Downgrading or re-selecting your active plan is not permitted.');
      return;
    }

    setActivating(planCode);

    await initiatePlanUpgrade({
      planCode,
      user,
      onSuccess: (verifyRes) => {
        setActivating(null);
        alert(isMr ? `योजना यशस्वीरित्या अपग्रेड झाली: ${verifyRes.planName || planCode}! 🎉` : `Plan upgraded successfully to ${verifyRes.planName || planCode}! 🎉`);
        if (refreshMandal) refreshMandal();
      },
      onError: (err) => {
        setActivating(null);
        alert(err.message || (isMr ? 'पेमेंट अयशस्वी झाले. योजना अपग्रेड झाली नाही.' : 'Payment failed. Plan was not upgraded.'));
      },
      onCancel: (cancelMsg) => {
        setActivating(null);
        alert(cancelMsg || (isMr ? 'पेमेंट रद्द केले. योजना अपग्रेड झाली नाही.' : 'Payment was cancelled. Plan was not upgraded.'));
      }
    });
  };

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 16px 40px' }}>
        
        {/* ── Page Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              color: '#EA580C',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: 0.5,
              marginBottom: 12
            }}
          >
            💎 APLA MANDAL MEMBERSHIP PLANS
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 34px)',
              fontWeight: 900,
              color: '#0F172A',
              margin: '0 0 10px',
              letterSpacing: -0.5
            }}
          >
            {isMr ? 'मंडळ सदस्यता मासिक योजना' : 'Simple & Transparent Monthly Plans'}
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#64748B',
              margin: 0,
              maxWidth: 580,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.5
            }}
          >
            {isMr
              ? 'कोणतीही छुपी फी नाही • पारदर्शक मासिक हिशोब • एका क्लिकवर अपग्रेड करा'
              : 'No hidden fees • Cancel anytime • Instant activation for your mandal'}
          </p>
        </div>

        {/* ── 2 Plan Cards Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 28,
            maxWidth: 880,
            margin: '0 auto 40px',
            alignItems: 'stretch'
          }}
        >
          {plans.map((p) => {
            const currentTier = getCurrentTier();
            const isCurrent = mandal?.planStatus === 'Active' && mandal?.plan?.toLowerCase() === (p.code || p.id).toLowerCase();
            const currentPrice = plans.find(ap => (ap.code || ap.id).toLowerCase() === mandal?.plan?.toLowerCase())?.price || 0;
            const isDowngrade = mandal?.planStatus === 'Active' && !isCurrent && ((p.tier || 1) < currentTier || p.price < currentPrice);
            const planName = isMr ? (p.nameMr || p.nameEn) : (p.nameEn || p.name);
            const tagline = isMr ? (p.taglineMr || p.taglineEn) : (p.taglineEn || p.tagline);
            const badgeText = isMr ? (p.badgeMr || p.badgeEn) : (p.badgeEn || p.badge);
            const periodText = isMr ? (p.periodMr || p.periodEn) : (p.periodEn || p.period);
            const memberLimitText = isMr ? (p.memberLimitMr || p.memberLimitEn) : (p.memberLimitEn || p.memberLimitMr);

            return (
              <div
                key={p.code || p.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 22,
                  border: p.popular
                    ? '2px solid #F59E0B'
                    : '1px solid #E2E8F0',
                  boxShadow: p.popular
                    ? '0 20px 45px -10px rgba(245, 158, 11, 0.2), 0 8px 20px -5px rgba(15, 23, 42, 0.06)'
                    : '0 12px 30px -8px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  padding: '32px 28px 26px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Top Badge */}
                {badgeText && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: p.popular
                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                        : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                      color: '#FFFFFF',
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '5px 16px',
                      borderRadius: 999,
                      boxShadow: p.popular
                        ? '0 4px 14px rgba(217, 119, 6, 0.4)'
                        : '0 4px 14px rgba(2, 132, 199, 0.35)',
                      whiteSpace: 'nowrap',
                      letterSpacing: 0.3
                    }}
                  >
                    {badgeText}
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 4 }}>
                    <h2
                      style={{
                        fontSize: 21,
                        fontWeight: 800,
                        color: p.color,
                        margin: '0 0 6px',
                        letterSpacing: -0.3
                      }}
                    >
                      {planName}
                    </h2>
                    
                    <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
                      {tagline}
                    </p>

                    {/* Price Block */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: 2,
                        marginBottom: 14
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>₹</span>
                      <span style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{p.price}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#64748B', marginLeft: 4 }}>{periodText}</span>
                    </div>

                    {/* Member Limit Pill */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: p.popular ? 'rgba(245, 158, 11, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                        border: p.popular ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(2, 132, 199, 0.2)',
                        color: p.popular ? '#B45309' : '#0369A1',
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700
                      }}
                    >
                      <span>👥</span>
                      <span>{memberLimitText}</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: 20,
                      marginBottom: 24
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        color: '#94A3B8',
                        marginBottom: 14
                      }}
                    >
                      {isMr ? 'समाविष्ट वैशिष्ट्ये:' : 'Included Features:'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(isMr ? p.featuresMr : p.featuresEn).map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: p.popular ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                              color: p.color,
                              fontSize: 11,
                              fontWeight: 900,
                              flexShrink: 0,
                              marginTop: 2
                            }}
                          >
                            ✓
                          </span>
                          <span
                            style={{
                              fontSize: 13.5,
                              color: '#334155',
                              fontWeight: 500,
                              lineHeight: 1.45
                            }}
                          >
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card CTA Action */}
                <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => !isCurrent && !isDowngrade && handleActivate(p.code || p.id)}
                    disabled={activating === (p.code || p.id) || isCurrent || isDowngrade}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: (isCurrent || isDowngrade) ? 'not-allowed' : 'pointer',
                      border: 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      ...(isCurrent
                        ? {
                            background: '#F1F5F9',
                            color: '#059669',
                            border: '1px solid #A7F3D0'
                          }
                        : isDowngrade
                        ? {
                            background: '#F8FAFC',
                            color: '#94A3B8',
                            border: '1px solid #E2E8F0'
                          }
                        : p.popular
                        ? {
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)'
                          }
                        : {
                            background: '#0F172A',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                          })
                    }}
                  >
                    {activating === (p.code || p.id) ? (
                      <span>⏳ {isMr ? 'गेटवे उघडत आहे...' : 'Opening Gateway...'}</span>
                    ) : isCurrent ? (
                      <span>✓ {isMr ? 'सध्याची सक्रिय योजना' : 'Current Active Plan'}</span>
                    ) : isDowngrade ? (
                      <span>🚫 {isMr ? 'कमी योजना निवडता येत नाही (Downgrade Not Permitted)' : 'Downgrade Not Permitted'}</span>
                    ) : (
                      <span>
                        {p.popular ? '⚡ ' : ''}
                        {isMr ? `${planName} अपग्रेड करा (₹${p.price}) →` : `Upgrade to ${planName} (₹${p.price}) →`}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Trust & Assurance Strip ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '20px 24px',
            maxWidth: 880,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: 26 }}>🔒</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                {isMr ? '१००% सुरक्षित पेमेंट' : '100% Secure Payments'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {isMr ? 'Razorpay आणि UPI द्वारे' : 'Via Razorpay, UPI & Cards'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: 26 }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                {isMr ? 'झटपट अ‍ॅक्टिव्हेशन' : 'Instant Activation'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {isMr ? 'पेमेंट होताच १ सेकंदात सुरू' : 'Live immediately on checkout'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: 26 }}>📞</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                {isMr ? 'मंडळ सहाय्य केंद्र' : 'Dedicated Support'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {isMr ? 'WhatsApp वर थेट मदत' : 'Priority WhatsApp assistance'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
