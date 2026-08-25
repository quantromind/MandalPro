import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'stock', quantity: 1, lowStockThreshold: 0 });

  const load = () => api.get('/inventory').then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/inventory', { ...form, quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) });
    setShowForm(false);
    setForm({ name: '', type: 'stock', quantity: 1, lowStockThreshold: 0 });
    load();
  };

  const returnItem = async (id) => { await api.patch(`/inventory/${id}/return`); load(); };

  return (
    <Layout>
      <div className="section-header">
        <h2>Inventory & Assets</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Item</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Qty</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{it.type}</td>
                <td>{it.quantity}</td>
                <td>
                  {it.quantity <= it.lowStockThreshold && it.type === 'stock' && <span className="badge badge-danger" style={{ marginRight: 6 }}>Low stock</span>}
                  <span className="badge badge-muted">{it.status}</span>
                </td>
                <td>{it.status === 'Issued' && <button className="btn btn-outline btn-sm" onClick={() => returnItem(it._id)}>Mark Returned</button>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} style={{ color: '#6b7280' }}>No items yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Inventory / Asset</h3>
            <form onSubmit={handleCreate}>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="stock">Stock</option>
                <option value="asset">Fixed Asset</option>
              </select>
              <label>Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <label>Low Stock Threshold</label>
              <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
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

export default Inventory;
