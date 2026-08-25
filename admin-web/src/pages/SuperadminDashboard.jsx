import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const SuperadminDashboard = () => {
  const [mandals, setMandals] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('mandals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mandalsRes, usersRes] = await Promise.all([
        api.get('/superadmin/mandals'),
        api.get('/superadmin/users')
      ]);
      setMandals(mandalsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Premium': return 'var(--accent)';
      case 'Pro': return 'var(--primary)';
      case 'Enterprise': return '#10B981';
      default: return '#64748B';
    }
  };

  if (loading) return <Layout><div className="page-header"><h2>Loading...</h2></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="text-h2">Superadmin Dashboard</h2>
          <p className="text-sub">Manage all registered Mandals on the platform</p>
        </div>
      </div>

      {error && <div className="error-text" style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 20 }}>{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          <button 
            onClick={() => setActiveTab('mandals')}
            style={{ padding: '16px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'mandals' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'mandals' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
          >
            Registered Mandals ({mandals.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ padding: '16px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
          >
            All Users ({users.length})
          </button>
        </div>
        
        <div className="table-responsive">
          {activeTab === 'mandals' ? (
          <table className="table">
            <thead>
              <tr>
                <th>Mandal Name</th>
                <th>Owner</th>
                <th>Members</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandals.map(mandal => (
                <tr key={mandal._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{mandal.name}</div>
                    <div className="text-caption">{mandal.eventTypes?.length || 0} event types</div>
                  </td>
                  <td>
                    <div>{mandal.createdBy?.name || 'Unknown'}</div>
                    <div className="text-caption">{mandal.createdBy?.email}</div>
                  </td>
                  <td>{mandal.memberCount}</td>
                  <td>
                    <span style={{ 
                      color: getPlanColor(mandal.plan), 
                      background: `${getPlanColor(mandal.plan)}1A`, 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 600 
                    }}>
                      {mandal.plan}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: mandal.planStatus === 'Active' ? '#10b981' : '#ef4444',
                      fontSize: 12, fontWeight: 600
                    }}>
                      {mandal.planStatus}
                    </span>
                  </td>
                  <td className="text-caption">
                    {new Date(mandal.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => navigate(`/superadmin/mandals/${mandal._id}`)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {mandals.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    No mandals registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Primary Mandal</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div className="text-caption">{u.email} {u.mobile ? `· ${u.mobile}` : ''}</div>
                  </td>
                  <td>
                    <span style={{ 
                      background: 'var(--bg-card)', 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      fontSize: 12, 
                      fontWeight: 600,
                      border: '1px solid var(--border)'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.mandalId ? (
                      <>
                        <div style={{ fontWeight: 600 }}>{u.mandalId.name}</div>
                        <div className="text-caption">{u.mandalId.plan} plan</div>
                      </>
                    ) : (
                      <span className="text-caption">None</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                      color: u.status === 'active' ? '#10b981' : (u.status === 'invited' ? '#f59e0b' : '#ef4444'),
                      fontSize: 12, fontWeight: 600
                    }}>
                      {u.status}
                    </span>
                  </td>
                  <td className="text-caption">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SuperadminDashboard;
