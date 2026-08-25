import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const Sponsors = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'sponsor', name: '', contact: '', packageOrContract: '', totalAmount: '' });

  const load = () => api.get('/sponsors').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/sponsors', { ...form, totalAmount: Number(form.totalAmount) });
    setShowForm(false);
    setForm({ type: 'sponsor', name: '', contact: '', packageOrContract: '', totalAmount: '' });
    load();
  };

  const recordPayment = async (id) => {
    const amount = prompt('Payment amount received (₹):');
    if (!amount) return;
    await api.patch(`/sponsors/${id}/payment`, { amount: Number(amount) });
    load();
  };

  return (
    <Layout>
      <div className="section-header">
        <h2>Sponsors & Vendors</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Sponsor/Vendor</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Package/Contract</th><th>Due</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => {
              const due = s.totalAmount - s.amountPaid;
              return (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{s.type}</td>
                  <td>{s.packageOrContract}</td>
                  <td>
                    {inr(due)} {due > 0 && <span className="badge badge-warning">Pending</span>}
                  </td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => recordPayment(s._id)}>Record Payment</button></td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={5} style={{ color: '#6b7280' }}>None yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Sponsor / Vendor</h3>
            <form onSubmit={handleCreate}>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="sponsor">Sponsor</option>
                <option value="vendor">Vendor</option>
              </select>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label>Contact</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              <label>Package / Contract</label>
              <input value={form.packageOrContract} onChange={(e) => setForm({ ...form, packageOrContract: e.target.value })} />
              <label>Total Amount (₹)</label>
              <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
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

export default Sponsors;
