import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const [mandal, setMandal] = useState(null);
  const [saved, setSaved] = useState(false);

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
                <div className="text-caption">Active until Dec 2026</div>
              </div>
              <button className="btn btn-primary btn-sm">Upgrade</button>
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
    </Layout>
  );
};

export default Settings;
