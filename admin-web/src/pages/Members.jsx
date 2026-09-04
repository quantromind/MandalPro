import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const ROLES = [
  { id: 'volunteer', label: 'Volunteer / Collector' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'secretary', label: 'Secretary' }
];

const ROLE_DEFAULTS = {
  volunteer: { canCollect: true, canManageExpenses: false, canAddMembers: false, canChat: true, canViewReports: false },
  treasurer: { canCollect: true, canManageExpenses: true, canAddMembers: false, canChat: true, canViewReports: true },
  secretary: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true },
  president: { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true }
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'volunteer',
    permissions: ROLE_DEFAULTS.volunteer
  });
  const [error, setError] = useState('');

  const load = () => api.get('/members').then((res) => setMembers(res.data));
  useEffect(() => { load(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/members', form);
      setShowForm(false);
      setForm({ name: '', email: '', mobile: '', role: 'volunteer', permissions: ROLE_DEFAULTS.volunteer });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this Mandal?`)) return;
    try {
      await api.delete(`/members/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'president': return 'badge-success';
      case 'treasurer': return 'badge-warning';
      case 'secretary': return 'badge-primary';
      default: return 'badge-muted';
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="text-h1" style={{ fontSize: 24, margin: 0 }}>Team Members & Collectors</h1>
            <span className="badge badge-success" style={{ fontSize: 11 }}>✨ Unlimited Members Supported</span>
          </div>
          <div className="text-sub" style={{ marginTop: 4 }}>Added members log in on the mobile app for free via Email OTP</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Member</button>
      </div>

      <div className="grid">
        {members.map((m) => {
          const perms = m.permissions || ROLE_DEFAULTS[m.role] || ROLE_DEFAULTS.volunteer;
          return (
            <div key={m._id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--primary)' }}>{m.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{m.name}</div>
                  <div className="text-caption">{m.email} {m.mobile ? `• 📞 ${m.mobile}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <span className={`badge ${getRoleBadgeColor(m.role)}`} style={{ textTransform: 'capitalize', display: 'inline-block' }}>{m.role}</span>
                    <div className="text-caption" style={{ color: m.status === 'active' ? 'var(--success)' : 'var(--text-muted)', marginTop: 2 }}>{m.status}</div>
                  </div>
                  {m.role !== 'president' && (
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }} onClick={() => handleRemove(m._id, m.name)}>Remove</button>
                  )}
                </div>
              </div>

              {/* Permissions tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                {perms.canCollect && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>🪙 Receipts</span>}
                {perms.canManageExpenses && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>💸 Expenses</span>}
                {perms.canAddMembers && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#047857' }}>👥 Add Members</span>}
                {perms.canChat && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#F5F3FF', color: '#6D28D9' }}>💬 Chat</span>}
                {perms.canViewReports && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#FFF1F2', color: '#BE123C' }}>📊 Reports</span>}
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No members found. Tap "+ Add Member" to add team collectors.
          </div>
        )}
      </div>

      {showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 4 }}>Add Team Member</h2>
            <span className="badge badge-success" style={{ marginBottom: 12, display: 'inline-block' }}>✨ Unlimited Members Supported</span>
            <p className="text-sub mb-3">Members can sign in to the mobile app for free using a one-time password (OTP) sent to their email.</p>
            {error && <div className="error-text">{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="field">
                <label>Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email Address (Used for OTP Login)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label>Mobile Number (Optional)</label>
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile number" />
              </div>
              <div className="field">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setForm({
                      ...form,
                      role: r,
                      permissions: ROLE_DEFAULTS[r] || ROLE_DEFAULTS.volunteer
                    });
                  }}
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>

              {/* Permission toggles */}
              <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>Member Permissions (परवानग्या)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    className={`permission-card ${form.permissions.canCollect ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, permissions: { ...form.permissions, canCollect: !form.permissions.canCollect } })}
                  >
                    <div className="permission-card-left">
                      <div className="permission-card-icon">🪙</div>
                      <div>
                        <div className="permission-card-title">Collect Donations & Receipts</div>
                        <div className="permission-card-desc">Can accept collections and generate official receipts</div>
                      </div>
                    </div>
                    <div className={`switch-toggle ${form.permissions.canCollect ? 'checked' : ''}`}>
                      <div className="switch-toggle-thumb"></div>
                    </div>
                  </div>

                  <div
                    className={`permission-card ${form.permissions.canManageExpenses ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, permissions: { ...form.permissions, canManageExpenses: !form.permissions.canManageExpenses } })}
                  >
                    <div className="permission-card-left">
                      <div className="permission-card-icon">💸</div>
                      <div>
                        <div className="permission-card-title">Record & Manage Expenses</div>
                        <div className="permission-card-desc">Can add expense vouchers and submit bill requests</div>
                      </div>
                    </div>
                    <div className={`switch-toggle ${form.permissions.canManageExpenses ? 'checked' : ''}`}>
                      <div className="switch-toggle-thumb"></div>
                    </div>
                  </div>

                  <div
                    className={`permission-card ${form.permissions.canAddMembers ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, permissions: { ...form.permissions, canAddMembers: !form.permissions.canAddMembers } })}
                  >
                    <div className="permission-card-left">
                      <div className="permission-card-icon">👥</div>
                      <div>
                        <div className="permission-card-title">Add & Invite Members</div>
                        <div className="permission-card-desc">Permission to add more team members to the Mandal</div>
                      </div>
                    </div>
                    <div className={`switch-toggle ${form.permissions.canAddMembers ? 'checked' : ''}`}>
                      <div className="switch-toggle-thumb"></div>
                    </div>
                  </div>

                  <div
                    className={`permission-card ${form.permissions.canChat ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, permissions: { ...form.permissions, canChat: !form.permissions.canChat } })}
                  >
                    <div className="permission-card-left">
                      <div className="permission-card-icon">💬</div>
                      <div>
                        <div className="permission-card-title">Committee Chat Access</div>
                        <div className="permission-card-desc">Can discuss and send messages in committee group chat</div>
                      </div>
                    </div>
                    <div className={`switch-toggle ${form.permissions.canChat ? 'checked' : ''}`}>
                      <div className="switch-toggle-thumb"></div>
                    </div>
                  </div>

                  <div
                    className={`permission-card ${form.permissions.canViewReports ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, permissions: { ...form.permissions, canViewReports: !form.permissions.canViewReports } })}
                  >
                    <div className="permission-card-left">
                      <div className="permission-card-icon">📊</div>
                      <div>
                        <div className="permission-card-title">View Financial Reports</div>
                        <div className="permission-card-desc">Access to financial summaries and balance reports</div>
                      </div>
                    </div>
                    <div className={`switch-toggle ${form.permissions.canViewReports ? 'checked' : ''}`}>
                      <div className="switch-toggle-thumb"></div>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full" type="submit" style={{ padding: 14, fontSize: 16, marginTop: 12 }}>Add Member</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Members;
