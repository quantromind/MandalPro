import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  Draft: 'badge-muted', Submitted: 'badge-warning', Approved: 'badge-success',
  Rejected: 'badge-danger', Paid: 'badge-success', Reconciled: 'badge-success'
};

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', vendor: '', description: '' });
  const [error, setError] = useState('');
  
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => api.get('/expenses').then((res) => setExpenses(res.data));
  useEffect(() => { load(); }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const canApprove = user?.role === 'president' || user?.role === 'treasurer';

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setShowForm(false);
      setForm({ category: '', amount: '', vendor: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const act = async (id, action, body = {}) => {
    try {
      await api.patch(`/expenses/${id}/${action}`, body);
      if (action === 'reject') {
        setRejectTarget(null);
        setRejectReason('');
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  // Mock Budget Stats (Since we're combining budget & expenses visually)
  const totalBudget = 300000;
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - spent;
  
  // Group by category
  const categories = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const categoryArray = Object.entries(categories).map(([name, amount]) => ({
    name: name || 'Other',
    amount,
    percent: Math.min(100, Math.round((amount / totalBudget) * 100))
  })).sort((a,b) => b.amount - a.amount);

  return (
    <Layout>
      <div className="flex-between mb-3">
        <h1 className="text-h1" style={{ fontSize: 24 }}>Budget & Expenses</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Expense</button>
      </div>
      {error && <div className="error-text">{error}</div>}

      {/* ── Financial Dashboard ── */}
      <div className="grid grid-3 mb-4">
        <div className="card" style={{ padding: 20 }}>
          <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Total Budget</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{inr(totalBudget)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Spent</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)', marginTop: 8 }}>{inr(spent)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Remaining</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)', marginTop: 8 }}>{inr(remaining)}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 16 }}>Category Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categoryArray.map(c => (
              <div key={c.name}>
                <div className="flex-between mb-1">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{inr(c.amount)}</span>
                </div>
                <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 999 }}>
                  <div style={{ width: `${c.percent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
                </div>
              </div>
            ))}
            {categoryArray.length === 0 && <div className="text-sub text-center py-4">No expenses recorded yet.</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-light)' }}>
            <h2 className="text-h2" style={{ fontSize: 18, margin: 0 }}>Recent Expenses</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {expenses.map((ex, index) => (
              <div key={ex._id} style={{ padding: 16, borderBottom: index < expenses.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{ex.vendor || ex.category}</div>
                  <div className="text-caption">
                    {ex.category} • <span className={`badge ${statusColor[ex.status] || 'badge-muted'}`} style={{ padding: '2px 6px', fontSize: 10 }}>{ex.status}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 16 }}>-{inr(ex.amount)}</div>
                  {ex.status === 'Submitted' && canApprove && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => act(ex._id, 'approve')}>Approve</button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setRejectTarget(ex._id)}>Reject</button>
                    </div>
                  )}
                  {ex.status === 'Approved' && (
                    <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: 11, marginTop: 8, background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 8 }} onClick={() => act(ex._id, 'pay')}>Mark Paid</button>
                  )}
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No recent expenses</div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="sheet-backdrop" onClick={() => setShowForm(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 24 }}>New Expense</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select Category</option>
                  <option value="Decoration">Decoration</option>
                  <option value="Food">Food & Prasad</option>
                  <option value="Sound">Sound System</option>
                  <option value="Venue">Venue / Mandap</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div className="field">
                <label>Vendor / Payee Name</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} required />
              </div>
              <div className="field">
                <label>Amount (₹)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Description / Notes</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <button className="btn btn-primary w-full" type="submit" style={{ padding: 16, fontSize: 16, marginTop: 12 }}>Submit Expense</button>
            </form>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="sheet-backdrop" onClick={() => setRejectTarget(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ marginBottom: 16 }}>Reject Expense</h2>
            <div className="field">
              <label>Reason for rejection</label>
              <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
            </div>
            <button className="btn btn-danger w-full" onClick={() => act(rejectTarget, 'reject', { reason: rejectReason })} disabled={!rejectReason} style={{ padding: 16, fontSize: 16 }}>Confirm Rejection</button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Expenses;
