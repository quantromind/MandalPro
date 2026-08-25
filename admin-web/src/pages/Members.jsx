import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const ROLES = [
  { id: 'volunteer', label: 'Volunteer / Collector' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'secretary', label: 'Secretary' }
];

const Members = () => {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', role: 'volunteer' });
  const [error, setError] = useState('');

  const load = () => api.get('/members').then((res) => setMembers(res.data));
  useEffect(() => { load(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/members', form);
      setShowForm(false);
      setForm({ name: '', email: '', mobile: '', role: 'volunteer' });
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
          <h1 className="text-h1" style={{ fontSize: 24, marginBottom: 4 }}>Team Members & Collectors</h1>
          <div className="text-sub">Added members log in on the mobile app for free via Email OTP</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Member</button>
      </div>

      <div className="grid">
        {members.map((m) => (
          <div key={m._id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
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
        ))}
        {members.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No members found. Tap "+ Add Member" to add team collectors.
          </div>
        )}
      </div>

      {showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 8 }}>Add Team Member</h2>
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
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <button className="btn btn-primary w-full" type="submit" style={{ padding: 16, fontSize: 16, marginTop: 12 }}>Add Member</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Members;
