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
  const [saved, setSaved] = useState(false);

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

  const handleSave = async (e) => {
    e.preventDefault();
    const { data } = await api.patch('/mandal', {
      name: mandal.name, address: mandal.address, contactPhone: mandal.contactPhone,
      contactEmail: mandal.contactEmail, upiId: mandal.upiId, receiptPrefix: mandal.receiptPrefix
    });
    setMandal(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
        <h1 className="text-h1" style={{ fontSize: 24 }}>Settings</h1>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16 }}>Mandal Information</h2>
          {saved && <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>✓ Settings saved successfully</div>}
          
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Mandal Name</label>
              <input value={mandal.name || ''} onChange={(e) => setMandal({ ...mandal, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Address</label>
              <textarea rows={2} value={mandal.address || ''} onChange={(e) => setMandal({ ...mandal, address: e.target.value })} />
            </div>
            
            <div className="grid-2">
              <div className="field">
                <label>Contact Phone</label>
                <input value={mandal.contactPhone || ''} onChange={(e) => setMandal({ ...mandal, contactPhone: e.target.value })} />
              </div>
              <div className="field">
                <label>Contact Email</label>
                <input type="email" value={mandal.contactEmail || ''} onChange={(e) => setMandal({ ...mandal, contactEmail: e.target.value })} />
              </div>
            </div>
            
            <h3 className="text-h3" style={{ fontSize: 15, marginTop: 24, marginBottom: 12 }}>Financials</h3>
            
            <div className="grid-2">
              <div className="field">
                <label>UPI ID</label>
                <input value={mandal.upiId || ''} onChange={(e) => setMandal({ ...mandal, upiId: e.target.value })} />
              </div>
              <div className="field">
                <label>Receipt Prefix</label>
                <input value={mandal.receiptPrefix || ''} onChange={(e) => setMandal({ ...mandal, receiptPrefix: e.target.value })} placeholder="e.g. GU26" />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>Save Changes</button>
          </form>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16 }}>Subscription Plan</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,107,0,0.05)', borderRadius: 8, border: '1px solid var(--primary)' }}>
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
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 12 }}>Legal &amp; Compliance</h2>
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

          <div className="card border-danger">
            <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16, color: 'var(--danger)' }}>Danger Zone</h2>
            <p className="text-sub mb-3">Irreversible and destructive actions. Permanently purge your Mandal workspace, donations, expenses, and records.</p>
            <button
              className="btn btn-outline"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={handleOpenDeleteModal}
            >
              Delete Workspace Permanently
            </button>
          </div>
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
