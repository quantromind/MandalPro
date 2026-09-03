import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/* ─── Constants ─────────────────────────────────────────────── */
const EVENT_TYPES = [
  {
    id: 'Ganesh Utsav', icon: '🐘', color: '#FF6B00',
    desc: 'Ganapati festival management',
    templates: { receipts: 4, budgetCategories: 14, checklistItems: 10, roles: 5 },
    tags: ['Decoration', 'Prasad', 'Visarjan', 'Sponsor Drive']
  },
  {
    id: 'Navratri', icon: '🪔', color: '#6C4DD9',
    desc: 'Dandiya & Garba events',
    templates: { receipts: 3, budgetCategories: 10, checklistItems: 8, roles: 4 },
    tags: ['Dandiya Night', 'Garba Setup', 'DJ/Music', 'Food Stall']
  },
  {
    id: 'Jayanti', icon: '📿', color: '#0EA5E9',
    desc: 'Jayanti & anniversary celebrations',
    templates: { receipts: 2, budgetCategories: 8, checklistItems: 6, roles: 3 },
    tags: ['Puja Setup', 'Procession', 'Bhajan', 'Prasad Vitaran']
  },
  {
    id: 'Diwali', icon: '✨', color: '#F59E0B',
    desc: 'Diwali programs & community melas',
    templates: { receipts: 3, budgetCategories: 9, checklistItems: 7, roles: 4 },
    tags: ['Diya Decoration', 'Fireworks', 'Mela Stalls', 'Community Gifts']
  },
  {
    id: 'Wedding/Hall', icon: '💒', color: '#EC4899',
    desc: 'Hall booking & wedding management',
    templates: { receipts: 5, budgetCategories: 12, checklistItems: 12, roles: 6 },
    tags: ['Hall Booking', 'Catering', 'Decoration', 'Guest Management']
  },
  {
    id: 'Custom', icon: '⚙️', color: '#10B981',
    desc: 'Define your own event type',
    templates: { receipts: 2, budgetCategories: 6, checklistItems: 5, roles: 3 },
    tags: ['Custom Receipt', 'Flexible Budget', 'Custom Roles', 'Open Checklist']
  }
];

const PLANS = [
  {
    id: 'Basic', price: 199, label: '₹199', period: '/month', color: '#64748B',
    tagline: 'Perfect to get started',
    features: ['1 Mandal', 'Up to 5 events/year', 'Basic receipts', 'Up to 10 members', 'Dashboard & reports'],
    missing: ['Custom branding', 'Priority support', 'Verified badge'],
    cta: 'Choose Basic'
  },
  {
    id: 'Pro', price: 499, label: '₹499', period: '/month', color: '#FF6B00', badge: 'Most Popular',
    tagline: 'For active mandals',
    features: ['1 Mandal', 'Unlimited events', 'Custom receipt branding', 'Up to 25 members', 'Verified Mandal badge', 'Priority support'],
    missing: ['Multiple mandals', 'Analytics export'],
    cta: 'Choose Pro'
  },
  {
    id: 'Premium', price: 999, label: '₹999', period: '/month', color: '#6C4DD9', badge: 'Best Value',
    tagline: 'For multi-mandal organizations',
    features: ['3 Mandals', 'Unlimited events', 'Full branding', 'Unlimited members', 'Verified badge', 'Analytics export', 'Dedicated support'],
    missing: ['API access', 'White-label'],
    cta: 'Choose Premium'
  },
  {
    id: 'Enterprise', price: null, label: 'Custom', period: '', color: '#10B981',
    tagline: 'For large trusts & federations',
    features: ['Unlimited Mandals', 'Everything in Premium', 'White-label option', 'API access', 'SLA support', 'Custom integrations'],
    missing: [],
    cta: 'Contact Sales'
  }
];

const STEPS = [
  { num: 1, label: 'Mandal Profile', icon: '🏛', desc: 'Your mandal identity' },
  { num: 2, label: 'Event Types', icon: '🎪', desc: 'What you organize' },
  { num: 3, label: 'Choose Plan', icon: '📋', desc: 'Select subscription' },
  { num: 4, label: 'Payment', icon: '💳', desc: 'Activate your plan' },
  { num: 5, label: 'Verification', icon: '✅', desc: 'Get verified badge' },
  { num: 6, label: 'Get Started', icon: '🚀', desc: 'Complete setup' }
];

const CHECKLIST_ITEMS = [
  { id: 'invite', icon: '👥', title: 'Invite your team', desc: 'Add members and assign roles', link: '/members', cta: 'Invite Members' },
  { id: 'receipt', icon: '🧾', title: 'Set receipt numbering', desc: 'Configure your receipt format & serial', link: '/settings', cta: 'Configure' },
  { id: 'donation', icon: '💰', title: 'Add first donation', desc: 'Record your first community donation', link: '/donations', cta: 'Add Donation' },
  { id: 'event', icon: '🎉', title: 'Create first event', desc: 'Set up your first event', link: '/events', cta: 'Create Event' }
];

/* ─── Helper ─────────────────────────────────────────────────── */
function getRecommendedPlan(types) {
  if (types.length >= 3) return 'Premium';
  if (types.length >= 2) return 'Pro';
  return 'Basic';
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, activeMandal, setActiveMandal } = useAuth();

  // Initialize step immediately from localStorage to avoid flash
  const [step, setStep] = useState(() => {
    const raw = localStorage.getItem('mandalpro_mandal');
    const mandal = raw ? JSON.parse(raw) : null;
    const cl = mandal?.checklist || {};
    if (!cl.planSelected) {
      // Start from step 1 so user goes: Mandal Info → Event Types → Subscription
      if (!cl.profileComplete) return 1;
      if (!cl.eventTypesSelected) return 2;
      return 3; // Profile & event types done, just need plan
    }
    return 6; // Fully onboarded
  });
  const [direction, setDirection] = useState('forward');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep step in sync if activeMandal updates after mount (e.g. after API calls)
  useEffect(() => {
    if (activeMandal) {
      const cl = activeMandal.checklist || {};
      if (!cl.planSelected) {
        if (!cl.profileComplete) setStep(1);
        else if (!cl.eventTypesSelected) setStep(2);
        else setStep(3);
      }
      // Don't forcibly move to step 6 if user manually navigated
    }
  }, [activeMandal]);

  // ── Step 1 State ──
  const [profile, setProfile] = useState({
    address: '', contactPhone: '', contactEmail: '',
    upiId: '', bankName: '', accountNumber: '', ifsc: '', accountName: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  const logoInputRef = useRef();

  // ── Step 2 State ──
  const [eventTypes, setEventTypes] = useState([]);

  // ── Step 3 State ──
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'

  // ── Step 4 State ──
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pollingOrderId, setPollingOrderId] = useState(null);

  // ── Step 5 State ──
  const [verifyDocs, setVerifyDocs] = useState({ cert: null, bank: null });

  // ── Step 6 State ──
  const [checklist, setChecklist] = useState({ invite: false, receipt: false, donation: false, event: false });

  /* ── Navigation ── */
  const goTo = (n) => {
    setDirection(n > step ? 'forward' : 'back');
    setError('');
    setStep(n);
  };
  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);

  /* ── Logo Upload ── */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setLogoBase64(reader.result); setLogoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setLogoBase64(reader.result); setLogoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  /* ── Step 1 Submit ── */
  const handleProfileSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.patch('/onboarding/profile', {
        logoBase64, address: profile.address,
        contactPhone: profile.contactPhone, contactEmail: profile.contactEmail,
        upiId: profile.upiId,
        bankDetails: { bankName: profile.bankName, accountNumber: profile.accountNumber, ifsc: profile.ifsc, accountName: profile.accountName }
      });
      next();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save profile'); }
    finally { setLoading(false); }
  };

  /* ── Step 2 Submit ── */
  const handleEventTypesSubmit = async () => {
    if (eventTypes.length === 0) { setError('Please select at least one event type'); return; }
    if (eventTypes.length > 3) { setError('You can select a maximum of 3 event types for your Mandal plan'); return; }
    setLoading(true); setError('');
    try {
      await api.patch('/mandal', { eventTypes });
      await api.post('/onboarding/provision');
      setSelectedPlan(getRecommendedPlan(eventTypes));
      if (activeMandal?.checklist?.planSelected) setStep(6);
      else next();
    } catch (e) { setError(e.response?.data?.message || 'Failed to save event types'); }
    finally { setLoading(false); }
  };

  /* ── Step 3 Submit ── */
  const handlePlanSubmit = async () => {
    if (selectedPlan === 'Enterprise') {
      window.open('mailto:contact@quantromind.com?subject=Enterprise Plan Enquiry', '_blank');
    } else {
      next(); // All plans go to payment
    }
  };

  /* ── Step 4 Payment ── */
  const handlePayment = async () => {
    setPaymentLoading(true); setError('');
    try {
      const { data: orderData } = await api.post('/payments/create-order', { plan: selectedPlan });
      await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

      setPollingOrderId(orderData.orderId);
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.keyId, amount: orderData.amount,
          currency: orderData.currency, order_id: orderData.orderId,
          name: 'Apla Mandal', description: `${selectedPlan} Plan Subscription`,
          image: '/logo.png',
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#FF6B00' },
          handler: async (response) => {
            try {
              await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan
              });
              setPaymentDone(true);
              setTimeout(() => next(), 2000);
              resolve();
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
        });
        rzp.open();
      });
    } catch (e) {
      if (e.message !== 'Payment cancelled') setError(e.response?.data?.message || e.message || 'Payment failed');
    } finally { setPaymentLoading(false); }
  };

  /* ── Step 5 ── */
  const handleDocUpload = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setVerifyDocs(prev => ({ ...prev, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleVerificationSubmit = async () => {
    setLoading(true); setError('');
    try {
      const docs = Object.values(verifyDocs).filter(Boolean);
      if (docs.length > 0) {
        await api.post('/onboarding/verification-docs', { docs }).catch(() => {});
      }
      const { data: updatedMandal } = await api.patch('/onboarding/checklist/planSelected').catch(() => ({ data: null }));
      if (updatedMandal) {
        setActiveMandal(updatedMandal);
      } else if (activeMandal) {
        setActiveMandal({
          ...activeMandal,
          checklist: { ...activeMandal.checklist, planSelected: true }
        });
      }
      navigate('/');
    } catch (e) {
      if (activeMandal) {
        setActiveMandal({
          ...activeMandal,
          checklist: { ...activeMandal.checklist, planSelected: true }
        });
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToDashboard = async () => {
    setLoading(true);
    try {
      const { data: updatedMandal } = await api.patch('/onboarding/checklist/planSelected').catch(() => ({ data: null }));
      if (updatedMandal) {
        setActiveMandal(updatedMandal);
      } else if (activeMandal) {
        setActiveMandal({
          ...activeMandal,
          checklist: { ...activeMandal.checklist, planSelected: true }
        });
      }
    } catch {
      if (activeMandal) {
        setActiveMandal({
          ...activeMandal,
          checklist: { ...activeMandal.checklist, planSelected: true }
        });
      }
    } finally {
      setLoading(false);
      navigate('/');
    }
  };

  /* ── Pricing calc ── */
  const planPrice = (plan) => {
    if (!plan.price) return plan.label;
    const p = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
    return p === 0 ? '₹0' : `₹${p}`;
  };
  const planTotal = (plan) => {
    if (!plan.price) return null;
    const p = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
    return Math.round(p * 1.18);
  };

  /* ── Styles ── */
  const css = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      background: '#F8F8F6',
      fontFamily: "'Inter', 'Poppins', sans-serif"
    },
    sidebar: {
      width: 260,
      background: '#17233C',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 24px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto'
    },
    sidebarBrand: {
      fontSize: 20, fontWeight: 800, color: '#FF6B00', marginBottom: 40,
      display: 'flex', alignItems: 'center', gap: 10
    },
    stepItem: (active, done) => ({
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
      opacity: active || done ? 1 : 0.4, cursor: done ? 'pointer' : 'default',
      transition: 'opacity 0.2s'
    }),
    stepDot: (active, done) => ({
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: done ? 14 : 13, fontWeight: 700,
      background: done ? '#10B981' : active ? '#FF6B00' : 'rgba(255,255,255,0.1)',
      color: '#fff', transition: 'all 0.3s ease',
      boxShadow: active ? '0 0 0 4px rgba(255,107,0,0.25)' : 'none'
    }),
    stepMeta: {
      display: 'flex', flexDirection: 'column'
    },
    stepLabel: (active) => ({
      fontSize: 13, fontWeight: active ? 700 : 500,
      color: active ? '#fff' : 'rgba(255,255,255,0.7)'
    }),
    stepDesc: {
      fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2
    },
    connector: {
      width: 2, height: 16, background: 'rgba(255,255,255,0.1)',
      marginLeft: 17, marginBottom: 0
    },
    main: {
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px', overflowY: 'auto'
    },
    card: {
      width: '100%', maxWidth: 620, background: '#fff', borderRadius: 20,
      padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid #F0F0EE'
    },
    stepHeader: {
      marginBottom: 32
    },
    stepBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,107,0,0.08)', color: '#FF6B00',
      fontSize: 12, fontWeight: 700, padding: '4px 12px',
      borderRadius: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5
    },
    h2: {
      fontSize: 26, fontWeight: 800, color: '#17233C', margin: '0 0 8px'
    },
    sub: {
      fontSize: 15, color: '#6b7280', margin: 0
    },
    label: {
      display: 'block', fontSize: 13, fontWeight: 600, color: '#374151',
      marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4
    },
    input: {
      width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10,
      padding: '12px 14px', fontSize: 15, color: '#17233C',
      outline: 'none', boxSizing: 'border-box', background: '#fff',
      transition: 'border-color 0.2s'
    },
    field: { marginBottom: 18 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 },
    btnPrimary: {
      background: '#FF6B00', color: '#fff', border: 'none',
      borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: '0 4px 16px rgba(255,107,0,0.25)'
    },
    btnOutline: {
      background: 'transparent', color: '#6b7280',
      border: '1.5px solid #E5E7EB', borderRadius: 12,
      padding: '14px 24px', fontSize: 15, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.2s'
    },
    errorBox: {
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      color: '#DC2626', borderRadius: 10, padding: '12px 16px',
      fontSize: 14, marginBottom: 20
    },
    sectionTitle: {
      fontSize: 14, fontWeight: 700, color: '#17233C',
      borderBottom: '1px solid #F0F0EE', paddingBottom: 10, marginBottom: 16
    }
  };

  const recommended = getRecommendedPlan(eventTypes);

  return (
    <div style={css.page}>

      {/* ── Left Sidebar (Desktop) ── */}
      <aside style={css.sidebar}>
        <div style={{ ...css.sidebarBrand, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="Apla Mandal Logo"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain', background: '#FFFFFF', padding: 2 }}
          />
          <span>Apla Mandal</span>
        </div>

        {STEPS.map((s, i) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num}>
              <div
                style={css.stepItem(isActive, isDone)}
                onClick={() => isDone && goTo(s.num)}
              >
                <div style={css.stepDot(isActive, isDone)}>
                  {isDone ? '✓' : s.icon}
                </div>
                <div style={css.stepMeta}>
                  <span style={css.stepLabel(isActive)}>{s.label}</span>
                  <span style={css.stepDesc}>{s.desc}</span>
                </div>
              </div>
              {i < STEPS.length - 1 && <div style={css.connector} />}
            </div>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Logged in as<br />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{user?.email}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={css.main}>

        {/* Mobile Step Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, width: '100%', maxWidth: 620 }}>
          {STEPS.map(s => (
            <div key={s.num} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: step >= s.num ? '#FF6B00' : '#E5E7EB',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <div style={css.card}>
          {error && <div style={css.errorBox}>⚠️ {error}</div>}

          {/* ══════════════════════════════════════════════
              STEP 1 — Mandal Profile
          ══════════════════════════════════════════════ */}
          {step === 1 && (
            <div>
              <div style={css.stepHeader}>
                <div style={css.stepBadge}>Step 1 of 6 · Mandal Profile</div>
                <h2 style={css.h2}>Set up your Mandal Profile</h2>
                <p style={css.sub}>Add your logo, contact info, and payment details so donors can trust you.</p>
              </div>

              {/* Logo Upload */}
              <div style={{ marginBottom: 28 }}>
                <label style={css.label}>Mandal Logo</label>
                <div
                  onDrop={handleLogoDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${logoPreview ? '#FF6B00' : '#D1D5DB'}`,
                    borderRadius: 16, padding: 24, textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: logoPreview ? 'rgba(255,107,0,0.04)' : '#FAFAFA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20
                  }}
                >
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FF6B00' }} />
                    : <div style={{ fontSize: 40 }}>🏛</div>
                  }
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#17233C', marginBottom: 4 }}>
                      {logoPreview ? 'Logo uploaded ✓' : 'Drop your logo here'}
                    </div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                      PNG, JPG up to 2MB · Click or drag to upload
                    </div>
                    {logoPreview && (
                      <button onClick={e => { e.stopPropagation(); setLogoPreview(''); setLogoBase64(''); }}
                        style={{ marginTop: 8, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </div>

              <div style={css.field}>
                <label style={css.label}>Address 📍</label>
                <textarea
                  rows={2}
                  placeholder="Mandal office or registered address"
                  value={profile.address}
                  onChange={e => setProfile({ ...profile, address: e.target.value })}
                  style={{ ...css.input, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <div style={css.grid2}>
                <div>
                  <label style={css.label}>Contact Phone</label>
                  <input style={css.input} placeholder="9876543210" value={profile.contactPhone} onChange={e => setProfile({ ...profile, contactPhone: e.target.value })} />
                </div>
                <div>
                  <label style={css.label}>Contact Email</label>
                  <input style={css.input} type="email" placeholder="info@mandal.com" value={profile.contactEmail} onChange={e => setProfile({ ...profile, contactEmail: e.target.value })} />
                </div>
              </div>

              <div style={css.field}>
                <label style={css.label}>UPI ID 💳</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...css.input, paddingRight: 100 }}
                    placeholder="mandal@upi or mandal@okaxis"
                    value={profile.upiId}
                    onChange={e => setProfile({ ...profile, upiId: e.target.value })}
                  />
                  {profile.upiId && (
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                      ✓ UPI Set
                    </span>
                  )}
                </div>
              </div>

              {/* Bank Details Accordion */}
              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
                <button
                  onClick={() => setBankOpen(!bankOpen)}
                  style={{ width: '100%', padding: '14px 18px', background: bankOpen ? '#F8F8F6' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#17233C' }}
                >
                  <span>🏦 Bank Account Details (Optional)</span>
                  <span style={{ transform: bankOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#9CA3AF' }}>▼</span>
                </button>
                {bankOpen && (
                  <div style={{ padding: '20px 18px', borderTop: '1px solid #E5E7EB' }}>
                    <div style={css.grid2}>
                      <div>
                        <label style={css.label}>Account Name</label>
                        <input style={css.input} placeholder="Shri Ganesh Mandal" value={profile.accountName} onChange={e => setProfile({ ...profile, accountName: e.target.value })} />
                      </div>
                      <div>
                        <label style={css.label}>Bank Name</label>
                        <input style={css.input} placeholder="State Bank of India" value={profile.bankName} onChange={e => setProfile({ ...profile, bankName: e.target.value })} />
                      </div>
                      <div>
                        <label style={css.label}>Account Number</label>
                        <input style={css.input} placeholder="1234567890" value={profile.accountNumber} onChange={e => setProfile({ ...profile, accountNumber: e.target.value })} />
                      </div>
                      <div>
                        <label style={css.label}>IFSC Code</label>
                        <input style={css.input} placeholder="SBIN0001234" value={profile.ifsc} onChange={e => setProfile({ ...profile, ifsc: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button style={css.btnPrimary} onClick={handleProfileSubmit} disabled={loading}>
                  {loading ? 'Saving…' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 2 — Event Types
          ══════════════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <div style={css.stepHeader}>
                <div style={css.stepBadge}>Step 2 of 6 · Event Types</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h2 style={css.h2}>What does your Mandal organize?</h2>
                  <span style={{ fontSize: 13, fontWeight: 700, color: eventTypes.length === 3 ? '#FF6B00' : '#6B7280' }}>
                    {eventTypes.length}/3 selected
                  </span>
                </div>
                <p style={css.sub}>Select up to 3 event types included in your Mandal plan. We'll auto-load starter templates, receipts, and roles for each.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {EVENT_TYPES.map(t => {
                  const selected = eventTypes.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (selected) {
                          setEventTypes(prev => prev.filter(x => x !== t.id));
                          setError('');
                        } else {
                          if (eventTypes.length >= 3) {
                            setError('You can select a maximum of 3 event types for your Mandal plan.');
                            return;
                          }
                          setError('');
                          setEventTypes(prev => [...prev, t.id]);
                        }
                      }}
                      style={{
                        padding: '18px 16px', borderRadius: 14,
                        border: `2px solid ${selected ? t.color : '#E5E7EB'}`,
                        background: selected ? `${t.color}08` : '#fff',
                        cursor: 'pointer', transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {selected && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 20, height: 20, borderRadius: '50%',
                          background: t.color, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700
                        }}>✓</div>
                      )}
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#17233C', marginBottom: 4 }}>{t.id}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{t.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Starter Template Preview */}
              {eventTypes.length > 0 && (
                <div style={{ background: '#F8F8F6', borderRadius: 14, padding: 20, marginBottom: 24, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', marginBottom: 12 }}>
                    🎁 We'll prepare your workspace with:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: '🧾', label: `${eventTypes.reduce((a, id) => { const t = EVENT_TYPES.find(x => x.id === id); return a + (t?.templates.receipts || 0); }, 0)} Receipt Templates` },
                      { icon: '📊', label: `${eventTypes.reduce((a, id) => { const t = EVENT_TYPES.find(x => x.id === id); return a + (t?.templates.budgetCategories || 0); }, 0)} Budget Categories` },
                      { icon: '✅', label: `${eventTypes.reduce((a, id) => { const t = EVENT_TYPES.find(x => x.id === id); return a + (t?.templates.checklistItems || 0); }, 0)} Checklist Items` },
                      { icon: '👤', label: `${eventTypes.reduce((a, id) => { const t = EVENT_TYPES.find(x => x.id === id); return a + (t?.templates.roles || 0); }, 0)} Default Roles` }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#17233C' }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <span style={{ fontWeight: 600 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {eventTypes.flatMap(id => EVENT_TYPES.find(x => x.id === id)?.tags || []).slice(0, 8).map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '3px 10px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, color: '#6b7280' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button style={css.btnOutline} onClick={back}>← Back</button>
                <button style={css.btnPrimary} onClick={handleEventTypesSubmit} disabled={loading || eventTypes.length === 0}>
                  {loading ? 'Saving…' : `Continue with ${eventTypes.length || 0} type${eventTypes.length !== 1 ? 's' : ''} →`}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 3 — Plan
          ══════════════════════════════════════════════ */}
          {step === 3 && (
            <div>
              <div style={css.stepHeader}>
                <div style={css.stepBadge}>Step 3 of 6 · Choose Plan</div>
                <h2 style={css.h2}>Choose your subscription</h2>
                <p style={css.sub}>Unlock the full power of Apla Mandal for your community.</p>
              </div>

              {/* Recommendation Banner */}
              {eventTypes.length > 0 && (
                <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#FF6B00', fontSize: 14, marginBottom: 2 }}>Recommended for you</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>You selected {eventTypes.length} event type{eventTypes.length !== 1 ? 's' : ''}. We recommend the <strong>{recommended}</strong> plan for your needs.</div>
                  </div>
                </div>
              )}

              {/* Billing Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 14, color: billing === 'monthly' ? '#17233C' : '#9CA3AF', fontWeight: billing === 'monthly' ? 700 : 500 }}>Monthly</span>
                <div
                  onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                  style={{ width: 44, height: 24, borderRadius: 12, background: billing === 'annual' ? '#FF6B00' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: '0.3s' }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: billing === 'annual' ? 23 : 3, transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontSize: 14, color: billing === 'annual' ? '#17233C' : '#9CA3AF', fontWeight: billing === 'annual' ? 700 : 500 }}>
                  Annual <span style={{ fontSize: 11, background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: 10, marginLeft: 4 }}>Save 20%</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {PLANS.map(plan => {
                  const isSelected = selectedPlan === plan.id;
                  const isRec = plan.id === recommended;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      style={{
                        borderRadius: 16, border: `2px solid ${isSelected ? plan.color : isRec ? `${plan.color}40` : '#E5E7EB'}`,
                        background: isSelected ? '#fff' : '#FAFAFA',
                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                        boxShadow: isSelected ? `0 8px 24px ${plan.color}18` : 'none',
                        overflow: 'hidden'
                      }}
                    >
                      {(plan.badge || isRec) && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          background: plan.color, color: '#fff',
                          fontSize: 11, fontWeight: 700, padding: '4px 14px',
                          borderBottomLeftRadius: 10
                        }}>{plan.badge || '⭐ Recommended'}</div>
                      )}
                      <div style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? 14 : 0 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: plan.color, marginBottom: 2 }}>{plan.id}</div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{plan.tagline}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#17233C' }}>{planPrice(plan)}</div>
                            {plan.price !== null && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{billing === 'annual' ? '/month (billed annually)' : '/month'}</div>}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ borderTop: '1px solid #F0F0EE', paddingTop: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                              {plan.features.map(f => (
                                <div key={f} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                style={{ ...css.btnPrimary, width: '100%', padding: '16px', fontSize: 16 }}
                onClick={handlePlanSubmit}
                disabled={loading}
              >
                {loading ? 'Processing…' : selectedPlan === 'Enterprise' ? 'Contact Sales →' : `Choose ${selectedPlan} →`}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 4 — Payment
          ══════════════════════════════════════════════ */}
          {step === 4 && (
            <div>
              <div style={css.stepHeader}>
                <div style={css.stepBadge}>Step 4 of 6 · Payment</div>
                <h2 style={css.h2}>Complete your payment</h2>
                <p style={css.sub}>Secure payment via Razorpay. Your plan activates immediately after confirmation.</p>
              </div>

              {/* Order Summary */}
              {(() => {
                const plan = PLANS.find(p => p.id === selectedPlan);
                const price = billing === 'annual' ? Math.round((plan?.price || 0) * 0.8) : (plan?.price || 0);
                const gst = Math.round(price * 0.18);
                const total = price + gst;
                return (
                  <div style={{ background: '#F8F8F6', borderRadius: 16, padding: 24, marginBottom: 28, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#17233C', marginBottom: 16 }}>Order Summary</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: '#6b7280' }}>
                      <span>{selectedPlan} Plan ({billing === 'annual' ? 'Annual' : 'Monthly'})</span>
                      <span style={{ fontWeight: 600, color: '#17233C' }}>₹{price}/mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: '#6b7280', paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
                      <span>GST (18%)</span>
                      <span style={{ fontWeight: 600, color: '#17233C' }}>₹{gst}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#17233C' }}>
                      <span>Total</span>
                      <span style={{ color: '#FF6B00' }}>₹{total}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Methods */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
                {[{ icon: '🏦', label: 'UPI' }, { icon: '💳', label: 'Card' }, { icon: '🌐', label: 'Net Banking' }].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280', padding: '8px 14px', background: '#F8F8F6', borderRadius: 10, border: '1px solid #E5E7EB', fontWeight: 600 }}>
                    <span>{m.icon}</span> {m.label}
                  </div>
                ))}
              </div>

              {paymentDone ? (
                <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', borderRadius: 14, padding: 24, border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: 16 }}>Payment Successful!</div>
                  <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Activating your {selectedPlan} plan…</div>
                </div>
              ) : (
                <>
                  <button
                    style={{ ...css.btnPrimary, width: '100%', padding: '16px', fontSize: 16 }}
                    onClick={handlePayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? '⏳ Opening Secure Gateway…' : `Pay Securely 🔒`}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>
                    🔒 256-bit SSL encrypted · Powered by Razorpay
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <button style={css.btnOutline} onClick={back} disabled={paymentLoading}>← Change Plan</button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 5 — Verification
          ══════════════════════════════════════════════ */}
          {step === 5 && (
            <div>
              <div style={css.stepHeader}>
                <div style={css.stepBadge}>Step 5 of 6 · Verification</div>
                <h2 style={css.h2}>Get your Verified Mandal badge ✓</h2>
                <p style={css.sub}>Verified mandals receive a trust badge visible to all donors and community members.</p>
              </div>

              <div style={{ background: 'rgba(255,107,0,0.06)', borderRadius: 14, padding: 16, marginBottom: 24, border: '1px solid rgba(255,107,0,0.15)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>🏅</span>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  <strong>Benefits of verification:</strong> Verified badge on receipts, higher donor trust, priority in search results.
                  We review within <strong>2–3 working days</strong>.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                  { key: 'cert', icon: '📄', title: 'Registration Certificate', desc: 'Trust deed, society reg., or charity certificate' },
                  { key: 'bank', icon: '🏦', title: 'Bank / Org Proof', desc: 'Bank passbook first page or cancelled cheque' }
                ].map(doc => (
                  <label key={doc.key} style={{ cursor: 'pointer' }}>
                    <div style={{
                      border: `2px dashed ${verifyDocs[doc.key] ? '#10B981' : '#D1D5DB'}`,
                      borderRadius: 14, padding: 20, textAlign: 'center',
                      background: verifyDocs[doc.key] ? 'rgba(16,185,129,0.05)' : '#FAFAFA',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{verifyDocs[doc.key] ? '✅' : doc.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#17233C', marginBottom: 4 }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>{doc.desc}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: verifyDocs[doc.key] ? '#10B981' : '#FF6B00' }}>
                        {verifyDocs[doc.key] ? 'Uploaded ✓' : 'Click to upload'}
                      </div>
                    </div>
                    <input type="file" accept="image/*,.pdf" onChange={e => handleDocUpload(doc.key, e.target.files?.[0])} style={{ display: 'none' }} />
                  </label>
                ))}
              </div>

              <button
                style={{ ...css.btnPrimary, width: '100%', padding: '16px', fontSize: 16, marginBottom: 12 }}
                onClick={handleVerificationSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit & Go to Dashboard →'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer' }}
                  onClick={handleSkipToDashboard}
                  disabled={loading}
                >
                  Skip for now & Go to Dashboard →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 6 — Done / Get Started
          ══════════════════════════════════════════════ */}
          {step === 6 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎊</div>
                <div style={{ ...css.stepBadge, justifyContent: 'center', display: 'flex' }}>Setup Complete</div>
                <h2 style={{ ...css.h2, textAlign: 'center' }}>Your Apla Mandal is ready!</h2>
                <p style={{ ...css.sub, textAlign: 'center' }}>Complete these quick steps to get the most out of your workspace.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {CHECKLIST_ITEMS.map((item, i) => {
                  const done = checklist[item.id];
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '18px 20px', borderRadius: 14,
                        background: done ? 'rgba(16,185,129,0.06)' : '#F8F8F6',
                        border: `1.5px solid ${done ? 'rgba(16,185,129,0.3)' : '#E5E7EB'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: done ? '#10B981' : '#fff', border: `2px solid ${done ? '#10B981' : '#E5E7EB'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: done ? 16 : 20, transition: 'all 0.2s'
                      }}>
                        {done ? '✓' : item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#059669' : '#17233C', marginBottom: 2 }}>
                          {i + 1}. {item.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#9CA3AF' }}>{item.desc}</div>
                      </div>
                      {!done && (
                        <a
                          href={item.link}
                          onClick={() => setChecklist(c => ({ ...c, [item.id]: true }))}
                          style={{
                            fontSize: 13, fontWeight: 700, color: '#FF6B00',
                            textDecoration: 'none', padding: '8px 16px',
                            background: 'rgba(255,107,0,0.08)', borderRadius: 8,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.cta} →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#F8F8F6', borderRadius: 14, padding: 16, marginBottom: 24, textAlign: 'center', fontSize: 13, color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                {Object.values(checklist).filter(Boolean).length} of 4 steps complete
                <div style={{ width: '100%', height: 6, borderRadius: 4, background: '#E5E7EB', marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#FF6B00', width: `${(Object.values(checklist).filter(Boolean).length / 4) * 100}%`, transition: '0.4s', borderRadius: 4 }} />
                </div>
              </div>

              <button
                style={{ ...css.btnPrimary, width: '100%', padding: '16px', fontSize: 16 }}
                onClick={() => navigate('/')}
              >
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
