import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const statusColor = { Issued: 'badge-success', Draft: 'badge-muted', Cancelled: 'badge-danger', Reversed: 'badge-warning' };

const Donations = () => {
  const [donations, setDonations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorName: '', donorMobile: '', amount: '', purpose: '', paymentMode: 'upi' });
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filter, setFilter] = useState('All');

  const load = () => api.get('/donations').then((res) => setDonations(res.data));
  useEffect(() => { load(); }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/donations', { ...form, amount: Number(form.amount), idempotencyKey: `web-${Date.now()}` });
      setShowForm(false);
      setForm({ donorName: '', donorMobile: '', amount: '', purpose: '', paymentMode: 'upi' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create receipt');
    }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/donations/${cancelTarget}/cancel`, { reason: cancelReason });
      setCancelTarget(null);
      setCancelReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const total = donations.filter(d => d.status === 'Issued').reduce((acc, d) => acc + d.amount, 0);

  return (
    <Layout>
      <div className="flex-between mb-2">
        <h1 className="text-h1" style={{ fontSize: 24 }}>Donations</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Donation</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Total Collected</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)' }}>{inr(total)}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
        {['All', 'Today', 'This Week', 'This Month'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: 999, whiteSpace: 'nowrap' }} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid">
        {donations.map((d) => (
          <div key={d._id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{d.donorName[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{d.donorName}</div>
                <div className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span> •
                  {d.donorMobile && <span>📱 {d.donorMobile} •</span>}
                  <span style={{ textTransform: 'uppercase' }}>{d.paymentMode}</span> •
                  <span className={`badge ${statusColor[d.status] || 'badge-muted'}`}>{d.status === 'Issued' ? 'Receipt Generated ✓' : d.status}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{inr(d.amount)}</div>
              {d.status === 'Issued' && (
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12, marginTop: 4, color: 'var(--danger)' }} onClick={() => setCancelTarget(d._id)}>Reverse</button>
              )}
            </div>
          </div>
        ))}
        {donations.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No donations found.
          </div>
        )}
      </div>

      {showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 24 }}>New Donation</h2>
            {error && <div className="error-text">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Donor Name</label>
                <input value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Mobile Number (Optional)</label>
                  <input value={form.donorMobile} onChange={(e) => setForm({ ...form, donorMobile: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Payment Mode</label>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Netbanking</option>
                </select>
              </div>
              <div className="field">
                <label>Purpose / Note (Optional)</label>
                <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <button className="btn btn-primary w-full" type="submit" style={{ padding: 16, fontSize: 16, marginTop: 12 }}>Record Donation & Generate Receipt</button>
            </form>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="sheet-backdrop" onClick={() => setCancelTarget(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 16 }}>Reverse Donation</h2>
            <p className="text-sub mb-3">Please provide a reason for reversing this receipt. This action is irreversible and logged for audit purposes.</p>
            <div className="field">
              <label>Reason</label>
              <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required />
            </div>
            <button className="btn btn-danger w-full" onClick={handleCancel} disabled={!cancelReason} style={{ padding: 16, fontSize: 16 }}>Confirm Reversal</button>
            <button className="btn btn-ghost w-full mt-2" onClick={() => setCancelTarget(null)}>Cancel</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Donations;
