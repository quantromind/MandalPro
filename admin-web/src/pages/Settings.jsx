import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { id: 'Basic', name: 'Basic', price: '₹199/mo', color: '#64748B', desc: '1 Mandal, Up to 5 events/year, Basic receipts, Up to 10 members' },
  { id: 'Pro', name: 'Pro (Most Popular)', price: '₹499/mo', color: '#FF6B00', desc: '1 Mandal, Unlimited events, Custom receipt branding, Up to 25 members, Verified badge' },
  { id: 'Premium', name: 'Premium (Best Value)', price: '₹999/mo', color: '#6C4DD9', desc: '3 Mandals, Unlimited events, Full branding, Unlimited members, Analytics export' },
  { id: 'Enterprise', name: 'Enterprise', price: 'Custom', color: '#10B981', desc: 'Unlimited Mandals, White-label, Dedicated API & 24/7 SLA Support' }
];

const Settings = () => {
  const { user, logout } = useAuth();
  const [mandal, setMandal] = useState(null);
  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState('Pro');
  const [upgrading, setUpgrading] = useState(false);

  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState('warning'); // 'warning' | 'otp'
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { api.get('/mandal').then((res) => setMandal(res.data)); }, []);

  const handleOpenDeleteModal = () => {
    setDeleteStep('warning');
    setDeleteOtp('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleSendDeleteOtp = async () => {
    setSendingDeleteOtp(true);
    setDeleteError('');
    try {
      await api.post('/auth/delete-account/send-otp');
      setDeleteStep('otp');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingDeleteOtp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOtp || deleteOtp.trim().length !== 6) {
      setDeleteError('Please enter the 6-digit verification code.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await api.post('/auth/delete-account', { code: deleteOtp.trim() });
      setShowDeleteModal(false);
      alert('Your account and workspace data have been permanently deleted.');
      logout();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Deletion failed. Please verify your OTP code.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.patch('/onboarding/plan', { plan: targetPlan });
      setMandal((prev) => ({ ...prev, plan: targetPlan, planStatus: 'Active' }));
      setShowUpgradeModal(false);
      alert(`Subscription plan updated to ${targetPlan}! 🎉`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscription plan.');
    } finally {
      setUpgrading(false);
    }
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
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setTargetPlan(mandal.plan === 'Basic' ? 'Pro' : mandal.plan === 'Pro' ? 'Premium' : 'Pro');
                setShowUpgradeModal(true);
              }}
            >
              ⭐ Upgrade Plan
            </button>
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
        <div className="modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="flex-between mb-3">
              <h2 className="text-h2" style={{ fontSize: 20 }}>💎 Upgrade Subscription Plan</h2>
              <button className="btn-icon" onClick={() => setShowUpgradeModal(false)}>✕</button>
            </div>
            <p className="text-sub mb-3">
              Select the plan that fits your Mandal needs. Current plan: <strong>{mandal.plan}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {PLANS.map((p) => {
                const isCurrent = mandal.plan === p.id;
                const isSelected = targetPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setTargetPlan(p.id)}
                    style={{
                      padding: '16px',
                      borderRadius: 12,
                      border: `2px solid ${isSelected ? p.color : '#E5E7EB'}`,
                      background: isSelected ? `${p.color}0D` : '#fff',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {isCurrent && (
                      <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        CURRENT
                      </span>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#17233C', marginBottom: 6 }}>{p.price}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleUpgrade}
                disabled={upgrading || targetPlan === mandal.plan}
              >
                {upgrading ? 'Upgrading…' : `Confirm & Activate ${targetPlan} Plan →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;
