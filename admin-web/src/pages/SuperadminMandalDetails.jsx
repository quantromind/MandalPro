import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const SuperadminMandalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandal, setMandal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchMandal();
  }, [id]);

  const fetchMandal = async () => {
    try {
      const { data } = await api.get(`/superadmin/mandals/${id}`);
      setMandal(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        plan: data.plan || 'Basic',
        planStatus: data.planStatus || 'Active',
        verified: data.verified || false,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mandal details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/superadmin/mandals/${id}`, formData);
      alert('Mandal updated successfully');
      fetchMandal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update mandal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this mandal? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/superadmin/mandals/${id}`);
      alert('Mandal deleted');
      navigate('/superadmin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete mandal');
    }
  };

  if (loading) return <Layout><div className="page-header"><h2>Loading...</h2></div></Layout>;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigate('/superadmin')}>&larr; Back</button>
            <h2 className="text-h2">Edit Mandal: {mandal?.name}</h2>
          </div>
          <p className="text-sub">Manage subscription and profile details</p>
        </div>
        <button className="btn btn-primary" onClick={handleDelete} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
          Delete Mandal
        </button>
      </div>

      {error && <div className="error-text" style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 20 }}>{error}</div>}

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-h3" style={{ marginBottom: 20 }}>Profile Information</h3>
          <form onSubmit={handleUpdate}>
            <div className="field">
              <label>Mandal Name</label>
              <input type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="field">
              <label>Address</label>
              <textarea className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Contact Phone</label>
                <input type="text" className="input" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
              </div>
              <div className="field">
                <label>Contact Email</label>
                <input type="email" className="input" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
              </div>
            </div>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.verified} onChange={e => setFormData({...formData, verified: e.target.checked})} />
                Document Verified (Kyc)
              </label>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 className="text-h3" style={{ marginBottom: 20 }}>Subscription Management</h3>
          <form onSubmit={handleUpdate}>
            <div className="field">
              <label>Plan Tier</label>
              <select className="input" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                <option value="Basic">Basic (₹199)</option>
                <option value="Pro">Pro (₹499)</option>
                <option value="Premium">Premium (₹999)</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div className="field">
              <label>Plan Status</label>
              <select className="input" value={formData.planStatus} onChange={e => setFormData({...formData, planStatus: e.target.value})}>
                <option value="Active">Active</option>
                <option value="GracePeriod">Grace Period</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <p className="text-caption" style={{ marginBottom: 4 }}><strong>Owner:</strong> {mandal?.createdBy?.name} ({mandal?.createdBy?.email})</p>
              <p className="text-caption" style={{ marginBottom: 4 }}><strong>Members:</strong> {mandal?.memberCount}</p>
              <p className="text-caption" style={{ marginBottom: 4 }}><strong>Joined:</strong> {new Date(mandal?.createdAt).toLocaleDateString()}</p>
              <p className="text-caption"><strong>Last Renewal:</strong> {mandal?.planRenewsAt ? new Date(mandal.planRenewsAt).toLocaleDateString() : 'N/A'}</p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }} disabled={saving}>
              {saving ? 'Updating...' : 'Update Subscription'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SuperadminMandalDetails;
