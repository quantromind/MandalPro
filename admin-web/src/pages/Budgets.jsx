import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const riskColor = { 'on-track': '#15803d', 'at-risk': '#b45309', over: '#b91c1c' };

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', allocatedAmount: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/budgets').then((res) => setBudgets(res.data));
  useEffect(() => { load(); }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/budgets', { ...form, allocatedAmount: Number(form.allocatedAmount) });
      setShowForm(false);
      setForm({ category: '', allocatedAmount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    }
  };

  return (
    <Layout>
      <div className="section-header">
        <h2>Budgets & Forecast</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Set Category Budget</button>
      </div>

      <div className="grid grid-2">
        {budgets.map((b) => (
          <div className="card" key={b._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{b.category}</strong>
              <span className="badge" style={{ background: `${riskColor[b.risk]}22`, color: riskColor[b.risk] }}>{b.risk}</span>
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>
              {inr(b.spent)} spent of {inr(b.allocatedAmount)} allocated
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(b.pctUsed * 100, 100)}%`, background: riskColor[b.risk] }} />
            </div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Remaining: {inr(b.remaining)}</div>
          </div>
        ))}
        {budgets.length === 0 && <p style={{ color: '#6b7280' }}>No budgets set yet.</p>}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Set Category Budget</h3>
            {error && <div className="error-text">{error}</div>}
            <form onSubmit={handleCreate}>
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              <label>Allocated Amount (₹)</label>
              <input type="number" value={form.allocatedAmount} onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Budgets;
