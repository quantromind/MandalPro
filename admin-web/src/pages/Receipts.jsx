import { useState } from 'react';
import Layout from '../components/Layout';

// Mock data since we haven't built the receipts API fully
const MOCK_RECEIPTS = [
  { id: 'RCP-1029', donor: 'Ramesh Sharma', amount: 5100, date: '2026-08-24T10:30:00Z', status: 'Generated' },
  { id: 'RCP-1028', donor: 'Suresh Patil', amount: 11000, date: '2026-08-23T14:15:00Z', status: 'Generated' },
  { id: 'RCP-1027', donor: 'Anil Desai', amount: 2100, date: '2026-08-22T09:45:00Z', status: 'Cancelled' },
  { id: 'RCP-1026', donor: 'Priya Kulkarni', amount: 501, date: '2026-08-21T18:20:00Z', status: 'Pending' },
];

const Receipts = () => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const filtered = MOCK_RECEIPTS.filter(r => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const matchesSearch = r.donor.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Generated': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-muted';
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-h1" style={{ fontSize: 24, marginBottom: 4 }}>Receipts</h1>
          <div className="text-sub">Manage and download donation receipts</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input 
          type="text" 
          placeholder="Search by Donor Name or Receipt #" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
        {['All', 'Generated', 'Pending', 'Cancelled'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: 999, whiteSpace: 'nowrap' }} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid">
        {filtered.map(r => (
          <div key={r.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="avatar" style={{ width: 48, height: 48, fontSize: 18, background: 'rgba(255,107,0,0.1)', color: 'var(--primary)' }}>🧾</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.donor}</div>
                <div className="text-caption" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.id}</span> •
                  <span>{new Date(r.date).toLocaleDateString()}</span> •
                  <span className={`badge ${getStatusColor(r.status)}`} style={{ padding: '2px 6px', fontSize: 10 }}>{r.status}</span>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{inr(r.amount)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>View</button>
                <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>↓</button>
                <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>Share</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No receipts found.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Receipts;
