import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { initiatePlanUpgrade } from '../utils/razorpay';

const FALLBACK_PLANS = [
  { code: 'Silver', name: 'Silver Pro Plan', price: 199, tier: 1, color: '#0284C7', tagline: 'Ideal for local & community mandals', features: ['1 Mandal Management', 'Up to 15 Committee Members', 'Instant WhatsApp Receipts', 'Basic Financial Summary Report'] },
  { code: 'Gold', name: 'Gold Pro Membership', price: 299, tier: 2, color: '#D97706', tagline: 'Complete financial & festival management for active mandals', features: ['2 Mandals Management', 'Up to 25 Committee Members', 'Branded WhatsApp Receipts', 'CA Audit-Ready Reports', '24/7 Priority Support'] }
];

const Settings = () => {
  const { user, logout, refreshMandal } = useAuth();
  const [mandal, setMandal] = useState(null);
  const [availablePlans, setAvailablePlans] = useState(FALLBACK_PLANS);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState('Gold');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState('warning'); // 'warning' | 'otp'
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    api.get('/mandal').then((res) => {
      setMandal(res.data);
    });

    api.get('/plans').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAvailablePlans(res.data);
      }
    }).catch(() => {
      // Use fallback plans if endpoint is unreachable
    });
  }, []);

  const handleOpenUpgradeModal = () => {
    setUpgradeError('');
    setUpgradeSuccess('');

    // Default target plan to the first available higher plan
    const currentTier = getCurrentPlanTier();
    const higherPlan = availablePlans.find((p) => (p.tier || 1) > currentTier);
    if (higherPlan) {
      setTargetPlan(higherPlan.code);
    } else {
      setTargetPlan(availablePlans[0]?.code || 'Gold');
    }

    setShowUpgradeModal(true);
  };

  const getCurrentPlanTier = () => {
    if (!mandal || mandal.planStatus !== 'Active' || !mandal.plan || mandal.plan === 'None') {
      return 0;
    }
    const current = availablePlans.find(
      (p) => p.code.toLowerCase() === mandal.plan.toLowerCase()
    );
    return current?.tier || 1;
  };

  const handleUpgrade = async () => {
    setUpgradeError('');
    setUpgradeSuccess('');
    setUpgrading(true);

    const planObj = availablePlans.find((p) => p.code === targetPlan);
    const currentTier = getCurrentPlanTier();
    const targetTier = planObj?.tier || 1;

    if (mandal?.planStatus === 'Active' && targetTier <= currentTier) {
      setUpgradeError('Downgrading or switching to the same plan is not permitted.');
      setUpgrading(false);
      return;
    }

    await initiatePlanUpgrade({
      planCode: targetPlan,
      user,
      onSuccess: (verifyRes) => {
        setUpgrading(false);
        setMandal((prev) => ({
          ...prev,
          plan: verifyRes.plan || targetPlan,
          planStatus: 'Active',
          planRenewsAt: verifyRes.planRenewsAt
        }));
        if (refreshMandal) refreshMandal();
        setUpgradeSuccess(`Plan successfully upgraded to ${verifyRes.planName || targetPlan}! 🎉`);
        setTimeout(() => {
          setShowUpgradeModal(false);
        }, 1500);
      },
      onError: (err) => {
        setUpgrading(false);
        setUpgradeError(err.message || 'Payment failed. Plan was not upgraded.');
      },
      onCancel: (cancelMsg) => {
        setUpgrading(false);
        setUpgradeError(cancelMsg || 'Payment cancelled. Plan was not upgraded.');
      }
    });
  };

  if (!mandal) return <Layout><div className="flex-center" style={{ height: '50vh' }}><p>Loading…</p></div></Layout>;

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-h1" style={{ fontSize: 24, margin: 0 }}>⚙️ Settings</h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            Subscription plan, legal compliance &amp; workspace management
          </p>
        </div>
      </div>

      {/* Quick link banner to Mandal Profile */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#FFF',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28 }}>🏛️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
              Mandal Information &amp; Branding
            </div>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
              Mandal name, address, contact phone, email, logo, and payment credentials are managed in Mandal Profile.
            </div>
          </div>
        </div>
        <Link 
          to="/profile" 
          className="btn btn-primary btn-sm" 
          style={{ textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 600, padding: '8px 16px' }}
        >
          Open Mandal Profile →
        </Link>
      </div>

      <div className="grid grid-2">
        {/* Subscription Plan */}
        <div className="card">
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16 }}>💎 Subscription Plan</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,107,0,0.05)', borderRadius: 8, border: '1px solid var(--primary)', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>{mandal.plan} Plan</div>
              <div className="text-caption">Status: <strong style={{ color: mandal.planStatus === 'Active' ? 'var(--success)' : 'var(--danger)' }}>{mandal.planStatus || 'Active'}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/subscription"
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                💎 Manage Subscription
              </Link>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleOpenUpgradeModal}
              >
                ⭐ Upgrade Subscription Plan
              </button>
            </div>
          </div>
          <p className="text-sub" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Upgrade your plan for unlimited members, advanced analytics, and custom branding for your receipts.
          </p>
        </div>

        {/* Legal & Compliance */}
        <div className="card">
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 12 }}>📜 Legal &amp; Compliance</h2>
          <p className="text-sub mb-3" style={{ fontSize: 13 }}>
            Apla Mandal platform policies, terms of service, and regulatory disclosures.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link 
              to="/privacy-policy" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, color: 'var(--text-main)', fontSize: 14, fontWeight: 500 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🛡️</span> Privacy Policy
              </span>
              <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>View ↗</span>
            </Link>
            <Link 
              to="/terms-and-conditions" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, color: 'var(--text-main)', fontSize: 14, fontWeight: 500 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📜</span> Terms &amp; Conditions
              </span>
              <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>View ↗</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger" style={{ marginTop: 20 }}>
        <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 12, color: 'var(--danger)' }}>⚠️ Danger Zone</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p className="text-sub" style={{ margin: 0, maxWidth: 600 }}>
            Irreversible and destructive actions. Permanently purge your Mandal workspace, donations, expenses, and records.
          </p>
          <button
            className="btn btn-outline"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', whiteSpace: 'nowrap' }}
            onClick={handleOpenDeleteModal}
          >
            Delete Workspace Permanently
          </button>
        </div>
      </div>

      {/* ── Delete Workspace / Account Modal ── */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="flex-between mb-3">
              <h2 className="text-h2" style={{ color: 'var(--danger)', fontSize: 20 }}>⚠️ Delete Workspace Permanently</h2>
              <button className="btn-icon" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            {deleteError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                {deleteError}
              </div>
            )}

            {deleteStep === 'warning' ? (
              <div>
                <p className="text-sub mb-3" style={{ lineHeight: 1.5 }}>
                  This will permanently delete <strong>{mandal.name}</strong> and all associated donations, events, expenses, receipts, and user accounts from the database.
                </p>
                <div style={{ padding: 12, background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: 6, marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#991B1B' }}>
                    To confirm this action, we will send a 6-digit OTP verification code to your email: <strong>{user?.email}</strong>
                  </p>
                </div>

                <div className="flex-end gap-2">
                  <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleSendDeleteOtp} disabled={sendingDeleteOtp}>
                    {sendingDeleteOtp ? 'Sending OTP…' : 'Send Verification OTP →'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sub mb-3">
                  Enter the 6-digit code sent to <strong>{user?.email}</strong>:
                </p>
                <div className="field mb-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 700, color: 'var(--danger)' }}
                    autoFocus
                  />
                </div>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
                    onClick={handleSendDeleteOtp}
                    disabled={sendingDeleteOtp}
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>

                <div className="flex-end gap-2">
                  <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={handleConfirmDelete}
                    disabled={deleting || deleteOtp.length < 6}
                  >
                    {deleting ? 'Deleting Data…' : 'Confirm Permanent Deletion'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Upgrade Plan Modal ── */}
      {showUpgradeModal && (
        <div className="modal-backdrop" onClick={() => !upgrading && setShowUpgradeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="flex-between mb-3">
              <h2 className="text-h2" style={{ fontSize: 20 }}>💎 Upgrade Subscription Plan</h2>
              <button className="btn-icon" onClick={() => !upgrading && setShowUpgradeModal(false)}>✕</button>
            </div>
            <p className="text-sub mb-3">
              Select a higher plan to upgrade your mandal capabilities. Current plan: <strong>{mandal.plan} ({mandal.planStatus})</strong>
            </p>

            {upgradeError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16
              }}>
                ⚠️ {upgradeError}
              </div>
            )}

            {upgradeSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                fontWeight: 600
              }}>
                ✅ {upgradeSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 20 }}>
              {availablePlans.map((p) => {
                const currentTier = getCurrentPlanTier();
                const isCurrent = mandal.plan?.toLowerCase() === p.code?.toLowerCase();
                const currentPrice = (availablePlans.find(ap => ap.code.toLowerCase() === mandal.plan?.toLowerCase())?.price || 0);
                const isDowngrade = mandal.planStatus === 'Active' && !isCurrent && (p.tier < currentTier || p.price < currentPrice);
                const isSelected = targetPlan === p.code;

                return (
                  <div
                    key={p.code}
                    onClick={() => {
                      if (!isCurrent && !isDowngrade && !upgrading) {
                        setTargetPlan(p.code);
                        setUpgradeError('');
                      }
                    }}
                    style={{
                      padding: '18px 16px',
                      borderRadius: 14,
                      border: `2px solid ${isSelected ? (p.color || '#FF6B00') : '#E2E8F0'}`,
                      background: isSelected ? `${p.color || '#FF6B00'}0D` : '#fff',
                      cursor: (isCurrent || isDowngrade || upgrading) ? 'not-allowed' : 'pointer',
                      opacity: (isCurrent || isDowngrade) ? 0.7 : 1,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: p.color || '#0F172A' }}>{p.name}</span>
                        {isCurrent ? (
                          <span style={{ fontSize: 10, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                            CURRENT ACTIVE
                          </span>
                        ) : isDowngrade ? (
                          <span style={{ fontSize: 10, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 10, fontWeight: 700, border: '1px solid #CBD5E1' }}>
                            DOWNGRADE NOT PERMITTED
                          </span>
                        ) : p.badge ? (
                          <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            {p.badge}
                          </span>
                        ) : null}
                      </div>

                      <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
                        ₹{p.price}<span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{p.period || '/month'}</span>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4, marginBottom: 12 }}>
                        {p.tagline || `${p.memberLimit || 15} Members supported`}
                      </div>

                      {Array.isArray(p.features) && p.features.length > 0 && (
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {p.features.slice(0, 3).map((f, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: p.color || '#10B981', fontWeight: 800 }}>✓</span> {f}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 14 }}>
                      {isCurrent ? (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', textAlign: 'center' }}>
                          ✓ Your Active Plan
                        </div>
                      ) : isDowngrade ? (
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textAlign: 'center' }}>
                          Downgrade not allowed
                        </div>
                      ) : isSelected ? (
                        <div style={{ fontSize: 12, fontWeight: 800, color: p.color || '#FF6B00', textAlign: 'center' }}>
                          ● Selected for Upgrade
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                          Click to select
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const selectedPlanObj = availablePlans.find((p) => p.code === targetPlan);
              const currentTier = getCurrentPlanTier();
              const isCurrent = mandal.plan?.toLowerCase() === targetPlan?.toLowerCase();
              const currentPrice = (availablePlans.find(ap => ap.code.toLowerCase() === mandal.plan?.toLowerCase())?.price || 0);
              const isDowngrade = mandal.planStatus === 'Active' && selectedPlanObj && (selectedPlanObj.tier < currentTier || selectedPlanObj.price < currentPrice);

              return (
                <div className="flex-end gap-2">
                  <button className="btn btn-outline" onClick={() => setShowUpgradeModal(false)} disabled={upgrading}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpgrade}
                    disabled={upgrading || isCurrent || isDowngrade || !selectedPlanObj}
                    style={{ minWidth: 200 }}
                  >
                    {upgrading
                      ? 'Opening Gateway…'
                      : isCurrent
                      ? 'Already On This Plan'
                      : isDowngrade
                      ? 'Downgrade Not Permitted'
                      : `Upgrade with Payment (₹${selectedPlanObj?.price || 0}) →`}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
