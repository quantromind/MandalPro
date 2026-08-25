import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const Settings = () => {
  const [mandal, setMandal] = useState(null);
  const [saved, setSaved] = useState(false);

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
            <p className="text-sub mb-3">Irreversible and destructive actions.</p>
            <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>Delete Workspace</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
