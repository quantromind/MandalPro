import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const SuperadminDashboard = () => {
  const [mandals, setMandals] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('mandals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Search & Filters for Mandals
  const [mandalSearch, setMandalSearch] = useState('');
  const [mandalPlanFilter, setMandalPlanFilter] = useState('all');
  const [mandalStatusFilter, setMandalStatusFilter] = useState('all');

  // Search & Filters for Users
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    role: 'volunteer',
    status: 'active',
    mandalId: '',
    newPassword: ''
  });
  const [savingUser, setSavingUser] = useState(false);
  const [modalError, setModalError] = useState('');

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
      case 'Premium': return 'var(--accent, #FF6B00)';
      case 'Pro': return 'var(--primary, #2563EB)';
      case 'Enterprise': return '#10B981';
      case 'Basic': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' };
      case 'president': return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'treasurer': return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'secretary': return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'volunteer': return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
      default: return { bg: '#F8FAFC', text: '#64748B', border: '#CBD5E1' };
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name || '',
      mobile: u.mobile || '',
      role: u.role || 'volunteer',
      status: u.status || 'active',
      mandalId: u.mandalId?._id || u.mandalId || '',
      newPassword: ''
    });
    setModalError('');
  };

  // Save User Changes
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setModalError('');
    try {
      const payload = {
        name: editFormData.name,
        mobile: editFormData.mobile,
        role: editFormData.role,
        status: editFormData.status,
        mandalId: editFormData.mandalId || null
      };
      if (editFormData.newPassword && editFormData.newPassword.trim().length >= 6) {
        payload.password = editFormData.newPassword.trim();
      }

      const res = await api.put(`/superadmin/users/${editingUser._id}`, payload);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === editingUser._id ? res.data : u));
      setEditingUser(null);
      setSuccessMsg(`User "${res.data.name}" updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  // Quick Toggle Status (Active / Disabled)
  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'active' ? 'disabled' : 'active';
    const confirmMsg = nextStatus === 'disabled' 
      ? `Disable user "${u.name}"? They will not be able to log in.` 
      : `Activate user "${u.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/superadmin/users/${u._id}`, { status: nextStatus });
      setUsers(prev => prev.map(item => item._id === u._id ? res.data : item));
      setSuccessMsg(`User "${u.name}" is now ${nextStatus}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Delete User
  const handleDeleteUser = async (u) => {
    if (u.role === 'superadmin' || u.email === 'quantromind@gmail.com') {
      alert('Primary superadmin cannot be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${u.name}" (${u.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/superadmin/users/${u._id}`);
      setUsers(prev => prev.filter(item => item._id !== u._id));
      setSuccessMsg(`User "${u.name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Filtered Mandals
  const filteredMandals = useMemo(() => {
    return mandals.filter(m => {
      const q = mandalSearch.toLowerCase();
      const matchSearch = !q || 
        m.name?.toLowerCase().includes(q) || 
        m.createdBy?.name?.toLowerCase().includes(q) || 
        m.createdBy?.email?.toLowerCase().includes(q);
      
      const matchPlan = mandalPlanFilter === 'all' || m.plan === mandalPlanFilter;
      const matchStatus = mandalStatusFilter === 'all' || m.planStatus === mandalStatusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [mandals, mandalSearch, mandalPlanFilter, mandalStatusFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = userSearch.toLowerCase();
      const matchSearch = !q || 
        u.name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) || 
        u.mobile?.toLowerCase().includes(q) ||
        u.mandalId?.name?.toLowerCase().includes(q);
      
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  // Metric Stats
  const totalMandalsCount = mandals.length;
  const activeMandalsCount = mandals.filter(m => m.planStatus === 'Active').length;
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'active').length;
  const paidPlansCount = mandals.filter(m => ['Basic', 'Pro', 'Premium', 'Enterprise'].includes(m.plan)).length;

  if (loading) return <Layout><div className="page-header"><h2>Loading Superadmin Console...</h2></div></Layout>;

  return (
    <Layout>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🛡️</span> Superadmin Dashboard
          </h2>
          <p className="text-sub">Control center to manage all platform users, mandals, subscriptions & access</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#DC2626', borderRadius: 8, marginBottom: 20, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', borderRadius: 8, marginBottom: 20, fontWeight: 500 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #FF6B00' }}>
          <div className="text-caption" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL MANDALS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
            {totalMandalsCount}
          </div>
          <div className="text-caption" style={{ color: '#10B981', marginTop: 4 }}>
            🟢 {activeMandalsCount} Active Mandals
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563EB' }}>
          <div className="text-caption" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL USERS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
            {totalUsersCount}
          </div>
          <div className="text-caption" style={{ color: '#2563EB', marginTop: 4 }}>
            👥 {activeUsersCount} Active Accounts
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #10B981' }}>
          <div className="text-caption" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>SUBSCRIPTIONS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
            {paidPlansCount}
          </div>
          <div className="text-caption" style={{ color: '#8B5CF6', marginTop: 4 }}>
            💎 Paid Subscription Plans
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', background: 'var(--bg-card)' }}>
          <button 
            onClick={() => setActiveTab('mandals')}
            style={{ 
              padding: '16px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'mandals' ? '3px solid var(--primary, #FF6B00)' : '3px solid transparent', 
              color: activeTab === 'mandals' ? 'var(--primary, #FF6B00)' : 'var(--text-muted)', 
              fontWeight: 700, 
              cursor: 'pointer', 
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>🚩</span> Registered Mandals ({mandals.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              padding: '16px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'users' ? '3px solid var(--primary, #FF6B00)' : '3px solid transparent', 
              color: activeTab === 'users' ? 'var(--primary, #FF6B00)' : 'var(--text-muted)', 
              fontWeight: 700, 
              cursor: 'pointer', 
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>👥</span> All Users ({users.length})
          </button>
        </div>

        {/* ──────────────── TAB 1: MANDALS ──────────────── */}
        {activeTab === 'mandals' && (
          <div>
            {/* Filter Bar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="🔍 Search mandal name or owner..." 
                value={mandalSearch} 
                onChange={(e) => setMandalSearch(e.target.value)}
                style={{ flex: '1 1 220px', minWidth: 200, padding: '8px 12px', fontSize: 14 }}
              />
              <select 
                className="input" 
                value={mandalPlanFilter} 
                onChange={(e) => setMandalPlanFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 14 }}
              >
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
                <option value="None">None</option>
              </select>
              <select 
                className="input" 
                value={mandalStatusFilter} 
                onChange={(e) => setMandalStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 14 }}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="GracePeriod">Grace Period</option>
                <option value="Expired">Expired</option>
                <option value="Inactive">Inactive</option>
              </select>
              {(mandalSearch || mandalPlanFilter !== 'all' || mandalStatusFilter !== 'all') && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setMandalSearch(''); setMandalPlanFilter('all'); setMandalStatusFilter('all'); }}
                  style={{ fontSize: 12 }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="table-responsive">
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
                  {filteredMandals.map(mandal => (
                    <tr key={mandal._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{mandal.name}</div>
                        <div className="text-caption">{mandal.eventTypes?.length || 0} event types</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{mandal.createdBy?.name || 'Unknown'}</div>
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
                          background: mandal.planStatus === 'Active' ? '#10b9811A' : '#ef44441A',
                          padding: '4px 8px',
                          borderRadius: 6,
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
                          style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600 }}
                          onClick={() => navigate(`/superadmin/mandals/${mandal._id}`)}
                        >
                          ⚙️ Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMandals.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        No mandals found matching the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ──────────────── TAB 2: USERS ──────────────── */}
        {activeTab === 'users' && (
          <div>
            {/* User Search & Filter Bar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="🔍 Search name, email, phone, mandal..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ flex: '1 1 240px', minWidth: 220, padding: '8px 12px', fontSize: 14 }}
              />
              <select 
                className="input" 
                value={userRoleFilter} 
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140, padding: '8px 12px', fontSize: 14 }}
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="president">President</option>
                <option value="treasurer">Treasurer</option>
                <option value="secretary">Secretary</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <select 
                className="input" 
                value={userStatusFilter} 
                onChange={(e) => setUserStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 14 }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="invited">Invited</option>
              </select>
              {(userSearch || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setUserSearch(''); setUserRoleFilter('all'); setUserStatusFilter('all'); }}
                  style={{ fontSize: 12 }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Primary Mandal</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Manage User</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const roleStyle = getRoleColor(u.role);
                    const isPrimarySuperAdmin = u.email === 'quantromind@gmail.com';

                    return (
                      <tr key={u._id}>
                        <td>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.name}
                            {isPrimarySuperAdmin && <span title="Primary System Superadmin">👑</span>}
                          </div>
                          <div className="text-caption">{u.email} {u.mobile ? `· ${u.mobile}` : ''}</div>
                        </td>
                        <td>
                          <span style={{ 
                            background: roleStyle.bg, 
                            color: roleStyle.text,
                            border: `1px solid ${roleStyle.border}`,
                            padding: '4px 10px', 
                            borderRadius: 6, 
                            fontSize: 12, 
                            fontWeight: 700,
                            textTransform: 'capitalize'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.mandalId ? (
                            <>
                              <div style={{ fontWeight: 600 }}>{u.mandalId.name}</div>
                              <div className="text-caption">{u.mandalId.plan || 'Free'} plan</div>
                            </>
                          ) : (
                            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>None / Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span style={{ 
                            color: u.status === 'active' ? '#10b981' : (u.status === 'invited' ? '#f59e0b' : '#ef4444'),
                            background: u.status === 'active' ? '#10b98118' : (u.status === 'invited' ? '#f59e0b18' : '#ef444418'),
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 12, 
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td className="text-caption">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button 
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                              onClick={() => handleOpenEditUser(u)}
                              title="Edit user details, role, status & password"
                            >
                              ✏️ Edit
                            </button>

                            {!isPrimarySuperAdmin && (
                              <button 
                                className="btn btn-outline"
                                style={{ 
                                  padding: '6px 10px', 
                                  fontSize: 12, 
                                  fontWeight: 600,
                                  color: u.status === 'active' ? '#D97706' : '#10B981',
                                  borderColor: u.status === 'active' ? '#FDE68A' : '#A7F3D0'
                                }}
                                onClick={() => handleToggleStatus(u)}
                                title={u.status === 'active' ? 'Disable this account' : 'Activate this account'}
                              >
                                {u.status === 'active' ? 'Disable' : 'Activate'}
                              </button>
                            )}

                            {!isPrimarySuperAdmin && u.role !== 'superadmin' && (
                              <button 
                                className="btn btn-outline"
                                style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: '#FECACA' }}
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user permanently"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        No users found matching the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── EDIT USER MODAL ──────────────── */}
      {editingUser && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setEditingUser(null)}
        >
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontSize: 18 }}>Manage User Account</h3>
                <p className="text-caption" style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
                  {editingUser.email}
                </p>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setEditingUser(null)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="field" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="input" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Mobile Number
                </label>
                <input 
                  type="text" 
                  className="input" 
                  value={editFormData.mobile} 
                  onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })} 
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="field">
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Role
                  </label>
                  <select 
                    className="input" 
                    value={editFormData.role} 
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                    disabled={editingUser.email === 'quantromind@gmail.com'}
                  >
                    <option value="president">President</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="secretary">Secretary</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Status
                  </label>
                  <select 
                    className="input" 
                    value={editFormData.status} 
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    disabled={editingUser.email === 'quantromind@gmail.com'}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="invited">Invited</option>
                  </select>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Assigned Primary Mandal
                </label>
                <select 
                  className="input" 
                  value={editFormData.mandalId} 
                  onChange={e => setEditFormData({ ...editFormData, mandalId: e.target.value })}
                >
                  <option value="">None / Unassigned</option>
                  {mandals.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.plan} plan)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Reset Password (Optional)
                </label>
                <input 
                  type="password" 
                  className="input" 
                  value={editFormData.newPassword} 
                  onChange={e => setEditFormData({ ...editFormData, newPassword: e.target.value })} 
                  placeholder="Enter new password (min 6 characters) to reset"
                  autoComplete="new-password"
                />
                <span className="text-caption" style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)' }}>
                  Leave empty if you do not want to change the user's password.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingUser(null)}
                  disabled={savingUser}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingUser}
                  style={{ background: 'var(--primary, #FF6B00)', borderColor: 'var(--primary, #FF6B00)' }}
                >
                  {savingUser ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SuperadminDashboard;
