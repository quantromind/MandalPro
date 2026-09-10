import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) => {
  if (totalItems === 0) return null;
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      }
    }
    const withDots = [];
    pages.forEach((p, idx) => {
      if (idx > 0 && p - pages[idx - 1] > 1) {
        withDots.push('...');
      }
      withDots.push(p);
    });
    return withDots;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderTop: '1px solid var(--border, #E2E8F0)',
      background: '#FAFAFA',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: 13,
      color: 'var(--text-muted, #64748B)'
    }}>
      <div>
        Showing <strong style={{ color: 'var(--text-main, #0F172A)' }}>{startItem}</strong> to <strong style={{ color: 'var(--text-main, #0F172A)' }}>{endItem}</strong> of <strong style={{ color: 'var(--text-main, #0F172A)' }}>{totalItems}</strong> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '4px 10px', fontSize: 12, opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &larr; Prev
        </button>

        {getPageNumbers().map((item, idx) => item === '...' ? (
          <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted, #64748B)' }}>...</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            style={{
              minWidth: 32,
              height: 32,
              borderRadius: 6,
              border: item === currentPage ? '1px solid var(--primary, #FF6B00)' : '1px solid var(--border, #E2E8F0)',
              background: item === currentPage ? 'var(--primary, #FF6B00)' : '#FFFFFF',
              color: item === currentPage ? '#FFFFFF' : 'var(--text-main, #0F172A)',
              fontWeight: item === currentPage ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: '4px 10px', fontSize: 12, opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next &rarr;
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border, #E2E8F0)',
            fontSize: 12,
            background: '#FFFFFF',
            color: 'var(--text-main, #0F172A)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value={20}>20 per page</option>
          <option value={30}>30 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );
};

const SuperadminDashboard = () => {
  const [mandals, setMandals] = useState(() => {
    try {
      const cached = sessionStorage.getItem('sa_mandals_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [users, setUsers] = useState(() => {
    try {
      const cached = sessionStorage.getItem('sa_users_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('mandals');
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('sa_mandals_cache');
    } catch {
      return true;
    }
  });
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
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [userViewMode, setUserViewMode] = useState('presidents'); // 'presidents' | 'all' | 'superadmins' | 'unassigned'
  const [expandedPresidents, setExpandedPresidents] = useState({});
  const [expandAll, setExpandAll] = useState(false);

  // Plans Management State
  const [plans, setPlans] = useState(() => {
    try {
      const cached = sessionStorage.getItem('sa_plans_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [editingPlan, setEditingPlan] = useState(null); // 'new' | plan object | null
  const [planFormData, setPlanFormData] = useState({
    name: '',
    nameMr: '',
    code: '',
    price: '',
    period: '/month',
    periodMr: '/महिना',
    tier: 1,
    memberLimit: 15,
    tagline: '',
    taglineMr: '',
    badge: '',
    badgeMr: '',
    color: '#0284C7',
    popular: false,
    features: '',
    featuresMr: '',
    isActive: true
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [planModalError, setPlanModalError] = useState('');

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
  const [showUserPassword, setShowUserPassword] = useState(false);

  useEffect(() => {
    const hasCache = mandals.length > 0 && users.length > 0;
    fetchData(hasCache);
  }, []);

  useEffect(() => {
    if (mandals.length > 0) {
      try { sessionStorage.setItem('sa_mandals_cache', JSON.stringify(mandals)); } catch {}
    }
  }, [mandals]);

  useEffect(() => {
    if (users.length > 0) {
      try { sessionStorage.setItem('sa_users_cache', JSON.stringify(users)); } catch {}
    }
  }, [users]);

  useEffect(() => {
    if (plans.length > 0) {
      try { sessionStorage.setItem('sa_plans_cache', JSON.stringify(plans)); } catch {}
    }
  }, [plans]);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [mandalsRes, usersRes, plansRes] = await Promise.all([
        api.get('/superadmin/mandals'),
        api.get('/superadmin/users'),
        api.get('/superadmin/plans')
      ]);
      setMandals(mandalsRes.data);
      setUsers(usersRes.data);
      setPlans(plansRes.data);
      try {
        sessionStorage.setItem('sa_mandals_cache', JSON.stringify(mandalsRes.data));
        sessionStorage.setItem('sa_users_cache', JSON.stringify(usersRes.data));
        sessionStorage.setItem('sa_plans_cache', JSON.stringify(plansRes.data));
      } catch {}
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
    setShowUserPassword(false);
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
      if (editFormData.newPassword && editFormData.newPassword.trim().length > 0) {
        if (editFormData.newPassword.trim().length < 6) {
          setModalError('Password must be at least 6 characters long');
          setSavingUser(false);
          return;
        }
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

  // Plan Management Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan('new');
    setPlanFormData({
      name: '',
      nameMr: '',
      code: '',
      price: '',
      period: '/month',
      periodMr: '/महिना',
      tier: plans.length + 1,
      memberLimit: 20,
      tagline: '',
      taglineMr: '',
      badge: '',
      badgeMr: '',
      color: '#0284C7',
      popular: false,
      features: '',
      featuresMr: '',
      isActive: true
    });
    setPlanModalError('');
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name || '',
      nameMr: plan.nameMr || '',
      code: plan.code || '',
      price: plan.price !== undefined ? String(plan.price) : '',
      period: plan.period || '/month',
      periodMr: plan.periodMr || '/महिना',
      tier: plan.tier || 1,
      memberLimit: plan.memberLimit || 15,
      tagline: plan.tagline || '',
      taglineMr: plan.taglineMr || '',
      badge: plan.badge || '',
      badgeMr: plan.badgeMr || '',
      color: plan.color || '#0284C7',
      popular: Boolean(plan.popular),
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      featuresMr: Array.isArray(plan.featuresMr) ? plan.featuresMr.join('\n') : '',
      isActive: plan.isActive !== undefined ? Boolean(plan.isActive) : true
    });
    setPlanModalError('');
  };

  const handleTogglePlanStatus = async (plan) => {
    const nextStatus = !plan.isActive;
    try {
      const res = await api.patch(`/superadmin/plans/${plan._id}/status`, { isActive: nextStatus });
      setPlans(prev => prev.map(p => p._id === plan._id ? res.data : p));
      setSuccessMsg(`Plan "${plan.name}" has been ${nextStatus ? 'Activated 🟢' : 'Deactivated 🔴'}.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle plan status');
      setTimeout(() => setError(''), 3500);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planFormData.name.trim() || !planFormData.code.trim() || planFormData.price === '') {
      setPlanModalError('Name, Code, and Price are required.');
      return;
    }
    setSavingPlan(true);
    setPlanModalError('');

    const payload = {
      name: planFormData.name.trim(),
      nameMr: planFormData.nameMr.trim(),
      code: planFormData.code.trim(),
      price: Number(planFormData.price),
      period: planFormData.period,
      periodMr: planFormData.periodMr,
      tier: Number(planFormData.tier || 1),
      memberLimit: Number(planFormData.memberLimit || 15),
      tagline: planFormData.tagline.trim(),
      taglineMr: planFormData.taglineMr.trim(),
      badge: planFormData.badge.trim(),
      badgeMr: planFormData.badgeMr.trim(),
      color: planFormData.color,
      popular: Boolean(planFormData.popular),
      features: planFormData.features ? planFormData.features.split('\n').map(s => s.trim()).filter(Boolean) : [],
      featuresMr: planFormData.featuresMr ? planFormData.featuresMr.split('\n').map(s => s.trim()).filter(Boolean) : [],
      isActive: Boolean(planFormData.isActive)
    };

    try {
      if (editingPlan && editingPlan !== 'new') {
        const res = await api.put(`/superadmin/plans/${editingPlan._id}`, payload);
        setPlans(prev => prev.map(p => p._id === editingPlan._id ? res.data : p));
        setSuccessMsg(`Plan "${res.data.name}" updated successfully.`);
      } else {
        const res = await api.post('/superadmin/plans', payload);
        setPlans(prev => [...prev, res.data]);
        setSuccessMsg(`New plan "${res.data.name}" created successfully.`);
      }
      setEditingPlan(null);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setPlanModalError(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate plan "${plan.name}"?`)) return;
    try {
      const res = await api.delete(`/superadmin/plans/${plan._id}`);
      setPlans(prev => prev.filter(p => p._id !== plan._id));
      setSuccessMsg(res.data.message || 'Plan deleted.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan');
      setTimeout(() => setError(''), 3500);
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

  // Process Presidents and Members hierarchy
  const { presidentsData, superadminsList, unassignedUsersList, totalPresidentsCount, totalMembersCount } = useMemo(() => {
    const superadmins = [];
    const unassigned = [];
    const presidentsMap = new Map();
    const membersByMandal = {};

    // 1. Group users
    users.forEach(u => {
      if (u.role === 'superadmin' || u.email === 'quantromind@gmail.com') {
        superadmins.push(u);
        return;
      }

      const mandalId = u.mandalId?._id || u.mandalId;

      if (u.role === 'president') {
        presidentsMap.set(String(u._id), u);
      } else if (mandalId) {
        const mKey = String(mandalId);
        if (!membersByMandal[mKey]) {
          membersByMandal[mKey] = [];
        }
        membersByMandal[mKey].push(u);
      } else {
        unassigned.push(u);
      }
    });

    // Quick lookup maps to avoid O(N^2) searches
    const usersMap = new Map();
    users.forEach(u => usersMap.set(String(u._id), u));

    const mandalsMap = new Map();
    const mandalsByCreator = new Map();
    mandals.forEach(m => {
      mandalsMap.set(String(m._id), m);
      if (m.createdBy?._id) {
        mandalsByCreator.set(String(m.createdBy._id), m);
      }
    });

    // 2. Mandals createdBy users who should also be treated as Presidents if not already
    mandals.forEach(m => {
      if (m.createdBy?._id) {
        const creatorId = String(m.createdBy._id);
        const creator = usersMap.get(creatorId);
        if (creator && creator.role !== 'superadmin' && !presidentsMap.has(creatorId)) {
          presidentsMap.set(creatorId, creator);
          const mKey = String(m._id);
          if (membersByMandal[mKey]) {
            membersByMandal[mKey] = membersByMandal[mKey].filter(u => String(u._id) !== creatorId);
          }
        }
      }
    });

    // 3. Assemble structured president objects with their mandal and members
    const structuredPresidents = Array.from(presidentsMap.values()).map(pres => {
      const presMandalId = pres.mandalId?._id || pres.mandalId;
      const presId = String(pres._id);
      
      const matchedMandal = (presMandalId ? mandalsMap.get(String(presMandalId)) : null)
        || mandalsByCreator.get(presId)
        || (typeof pres.mandalId === 'object' && pres.mandalId ? pres.mandalId : null);
      
      const effectiveMandalId = matchedMandal?._id ? String(matchedMandal._id) : (presMandalId ? String(presMandalId) : null);
      
      const members = effectiveMandalId && membersByMandal[effectiveMandalId]
        ? membersByMandal[effectiveMandalId].filter(m => String(m._id) !== presId)
        : [];

      return {
        president: pres,
        mandal: matchedMandal,
        members: members
      };
    });

    // Calculate total committee members
    let totalMembers = 0;
    Object.values(membersByMandal).forEach(list => {
      totalMembers += list.length;
    });

    return {
      presidentsData: structuredPresidents,
      superadminsList: superadmins,
      unassignedUsersList: unassigned,
      totalPresidentsCount: structuredPresidents.length,
      totalMembersCount: totalMembers
    };
  }, [users, mandals]);

  // Filtered Presidents (searches President, Mandal, and nested Members!)
  const filteredPresidents = useMemo(() => {
    return presidentsData.filter(item => {
      const q = userSearch.toLowerCase().trim();
      const pres = item.president;
      const mandal = item.mandal;
      const members = item.members;

      // Status filter
      if (userStatusFilter !== 'all' && pres.status !== userStatusFilter) {
        return false;
      }

      // Plan filter
      if (userPlanFilter !== 'all') {
        const plan = mandal?.plan || 'None';
        if (plan !== userPlanFilter) return false;
      }

      // Search match
      if (!q) return true;

      const presNameMatch = pres.name?.toLowerCase().includes(q);
      const presEmailMatch = pres.email?.toLowerCase().includes(q);
      const presPhoneMatch = pres.mobile?.toLowerCase().includes(q);
      const mandalNameMatch = mandal?.name?.toLowerCase().includes(q);

      const memberMatch = members.some(m => 
        m.name?.toLowerCase().includes(q) || 
        m.email?.toLowerCase().includes(q) || 
        m.mobile?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );

      return presNameMatch || presEmailMatch || presPhoneMatch || mandalNameMatch || memberMatch;
    });
  }, [presidentsData, userSearch, userStatusFilter, userPlanFilter]);

  // Filtered Users (Flat list for fallback search)
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

  const toggleExpandPresident = (id) => {
    setExpandedPresidents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleExpandAll = () => {
    const nextState = !expandAll;
    setExpandAll(nextState);
    const newExpanded = {};
    if (nextState) {
      filteredPresidents.forEach(p => {
        newExpanded[p.president._id] = true;
      });
    }
    setExpandedPresidents(newExpanded);
  };

  // Metric Stats
  // Pagination states (Default 20 per page, selectable 20, 30, 50)
  const [mandalPage, setMandalPage] = useState(1);
  const [mandalPageSize, setMandalPageSize] = useState(20);

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(20);

  // Reset mandalPage when search, filters, or pageSize change
  useEffect(() => {
    setMandalPage(1);
  }, [mandalSearch, mandalPlanFilter, mandalStatusFilter, mandalPageSize]);

  // Reset userPage when search, filters, view mode, or pageSize change
  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter, userPlanFilter, userViewMode, userPageSize]);

  // Paginated Mandals
  const totalMandalPages = Math.ceil(filteredMandals.length / mandalPageSize) || 1;
  const paginatedMandals = useMemo(() => {
    const start = (mandalPage - 1) * mandalPageSize;
    return filteredMandals.slice(start, start + mandalPageSize);
  }, [filteredMandals, mandalPage, mandalPageSize]);

  // Paginated Presidents
  const totalPresidentPages = Math.ceil(filteredPresidents.length / userPageSize) || 1;
  const paginatedPresidents = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredPresidents.slice(start, start + userPageSize);
  }, [filteredPresidents, userPage, userPageSize]);

  // Paginated Users (Flat list)
  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const totalMandalsCount = mandals.length;
  const activeMandalsCount = mandals.filter(m => m.planStatus === 'Active').length;
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'active').length;
  const paidPlansCount = mandals.filter(m => ['Basic', 'Pro', 'Premium', 'Enterprise'].includes(m.plan)).length;

  if (loading && mandals.length === 0) {
    return (
      <Layout>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🛡️</span> Superadmin Dashboard
          </h2>
          <p className="text-sub">Loading dashboard data...</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: '20px', height: 95, background: '#F8FAFC', border: '1px solid var(--border)' }}>
              <div style={{ width: '45%', height: 14, background: '#E2E8F0', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: '30%', height: 26, background: '#CBD5E1', borderRadius: 6 }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 24, minHeight: 320, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 140, height: 38, background: '#E2E8F0', borderRadius: 8 }} />
            <div style={{ width: 140, height: 38, background: '#F1F5F9', borderRadius: 8 }} />
            <div style={{ width: 140, height: 38, background: '#F1F5F9', borderRadius: 8 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: '100%', height: 48, background: '#F8FAFC', borderRadius: 6, border: '1px solid #F1F5F9' }} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

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
          <div className="text-caption" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>PRESIDENTS & USERS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
            👑 {totalPresidentsCount} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalUsersCount} Total</span>
          </div>
          <div className="text-caption" style={{ color: '#2563EB', marginTop: 4 }}>
            👥 {totalMembersCount} Mandal Members ({activeUsersCount} Active)
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
            <span>👑</span> Presidents & Members ({presidentsData.length} Presidents)
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            style={{ 
              padding: '16px 20px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'plans' ? '3px solid var(--primary, #FF6B00)' : '3px solid transparent', 
              color: activeTab === 'plans' ? 'var(--primary, #FF6B00)' : 'var(--text-muted)', 
              fontWeight: 700, 
              cursor: 'pointer', 
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>💎</span> Subscription Plans ({plans.length})
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
                  {paginatedMandals.map(mandal => (
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

            <PaginationControls
              currentPage={mandalPage}
              totalPages={totalMandalPages}
              totalItems={filteredMandals.length}
              pageSize={mandalPageSize}
              onPageChange={setMandalPage}
              onPageSizeChange={setMandalPageSize}
            />
          </div>
        )}

        {/* ──────────────── TAB 2: PRESIDENTS & MEMBERS HIERARCHY ──────────────── */}
        {activeTab === 'users' && (
          <div>
            {/* Sub-view switcher bar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#FAFAFA' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setUserViewMode('presidents')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: userViewMode === 'presidents' ? '2px solid #2563EB' : '1px solid var(--border)',
                    background: userViewMode === 'presidents' ? '#EFF6FF' : '#FFFFFF',
                    color: userViewMode === 'presidents' ? '#1D4ED8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>👑</span>
                  <span>Presidents & Hierarchy (अध्यक्ष व सदस्य रचना) ({filteredPresidents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserViewMode('all')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: userViewMode === 'all' ? '2px solid #FF6B00' : '1px solid var(--border)',
                    background: userViewMode === 'all' ? '#FFF7ED' : '#FFFFFF',
                    color: userViewMode === 'all' ? '#C2410C' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>👥</span>
                  <span>All Users Table (सर्व वापरकर्ते) ({filteredUsers.length})</span>
                </button>

                {superadminsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUserViewMode('superadmins')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      border: userViewMode === 'superadmins' ? '2px solid #7C3AED' : '1px solid var(--border)',
                      background: userViewMode === 'superadmins' ? '#F3E8FF' : '#FFFFFF',
                      color: userViewMode === 'superadmins' ? '#7C3AED' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>🛡️</span>
                    <span>Superadmins ({superadminsList.length})</span>
                  </button>
                )}

                {unassignedUsersList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUserViewMode('unassigned')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      border: userViewMode === 'unassigned' ? '2px solid #F59E0B' : '1px solid var(--border)',
                      background: userViewMode === 'unassigned' ? '#FEF3C7' : '#FFFFFF',
                      color: userViewMode === 'unassigned' ? '#B45309' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>⚠️</span>
                    <span>Unassigned ({unassignedUsersList.length})</span>
                  </button>
                )}
              </div>

              {userViewMode === 'presidents' && filteredPresidents.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{expandAll ? '📁' : '📂'}</span>
                  <span>{expandAll ? 'Collapse All Members' : 'Expand All Members'}</span>
                </button>
              )}
            </div>

            {/* Filter Search Bar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="🔍 Search President name, Member name, Mandal, Phone, Email..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ flex: '1 1 260px', minWidth: 240, padding: '8px 12px', fontSize: 14 }}
              />

              {userViewMode === 'presidents' && (
                <select 
                  className="input" 
                  value={userPlanFilter} 
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 14 }}
                >
                  <option value="all">All Plans</option>
                  <option value="Basic">Basic Plan</option>
                  <option value="Pro">Pro Plan</option>
                  <option value="Premium">Premium Plan</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="None">Free / None</option>
                </select>
              )}

              {userViewMode === 'all' && (
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
              )}

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

              {(userSearch || userRoleFilter !== 'all' || userStatusFilter !== 'all' || userPlanFilter !== 'all') && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setUserSearch(''); setUserRoleFilter('all'); setUserStatusFilter('all'); setUserPlanFilter('all'); }}
                  style={{ fontSize: 12 }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* ─── MODE 1: PRESIDENTS & MEMBERS HIERARCHY (PRIMARY) ─── */}
            {userViewMode === 'presidents' && (
              <div style={{ padding: 20 }}>
                {filteredPresidents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {paginatedPresidents.map(item => {
                      const isExpanded = expandedPresidents[item.president._id] || expandAll;
                      const isPrimarySuperAdmin = item.president.email === 'quantromind@gmail.com';
                      const mandalObj = item.mandal;
                      const planName = mandalObj?.plan || (item.president.mandalId?.plan || 'Free');

                      return (
                        <div
                          key={item.president._id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 14,
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s ease',
                            borderLeft: '5px solid #2563EB'
                          }}
                        >
                          {/* Card Header / President Main Row */}
                          <div
                            style={{
                              padding: '16px 20px',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 16,
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                              borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none'
                            }}
                          >
                            {/* Left: President Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, flex: '1 1 260px' }}>
                              <div
                                style={{
                                  width: 46,
                                  height: 46,
                                  borderRadius: 12,
                                  background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: 18,
                                  boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
                                  position: 'relative',
                                  flexShrink: 0
                                }}
                              >
                                {item.president.name ? item.president.name.charAt(0).toUpperCase() : 'P'}
                                <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 13 }} title="Mandal President">👑</span>
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
                                    {item.president.name}
                                  </span>
                                  {isPrimarySuperAdmin && <span title="Primary System Superadmin">👑</span>}
                                  <span
                                    style={{
                                      background: '#EFF6FF',
                                      color: '#1D4ED8',
                                      border: '1px solid #BFDBFE',
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 700
                                    }}
                                  >
                                    👑 अध्यक्ष (President)
                                  </span>
                                  <span
                                    style={{
                                      color: item.president.status === 'active' ? '#10B981' : '#EF4444',
                                      background: item.president.status === 'active' ? '#10B98115' : '#EF444415',
                                      padding: '2px 7px',
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textTransform: 'capitalize'
                                    }}
                                  >
                                    {item.president.status}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 12.5, color: '#64748B' }}>
                                  <span>📧 {item.president.email}</span>
                                  {item.president.mobile && (
                                    <span style={{ fontWeight: 600, color: '#334155' }}>📱 {item.president.mobile}</span>
                                  )}
                                  <span>📅 {new Date(item.president.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Center: Mandal & Plan Badge */}
                            <div style={{ minWidth: 220, flex: '1 1 220px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14 }}>🚩</span>
                                <strong style={{ fontSize: 14, color: '#1E293B' }}>
                                  {mandalObj?.name || (item.president.mandalId?.name || 'Mandal Unassigned')}
                                </strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                <span
                                  style={{
                                    color: getPlanColor(planName),
                                    background: `${getPlanColor(planName)}18`,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 700
                                  }}
                                >
                                  💎 {planName} Plan
                                </span>
                                <span style={{ fontSize: 11.5, color: (mandalObj?.planStatus === 'Active' || item.president.mandalId?.planStatus === 'Active') ? '#10B981' : '#64748B', fontWeight: 600 }}>
                                  {(mandalObj?.planStatus === 'Active' || item.president.mandalId?.planStatus === 'Active') ? '🟢 Active' : (mandalObj?.planStatus || '')}
                                </span>
                              </div>
                            </div>

                            {/* Right: Member Count & Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              {/* Expand / Collapse Button */}
                              <button
                                type="button"
                                onClick={() => toggleExpandPresident(item.president._id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  border: '1px solid #CBD5E1',
                                  background: isExpanded ? '#EFF6FF' : '#FFFFFF',
                                  color: isExpanded ? '#1D4ED8' : '#334155',
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="View committee members and volunteers under this President's mandal"
                              >
                                <span>👥</span>
                                <span>{item.members.length} सदस्य (Members)</span>
                                <span style={{ fontSize: 10, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                                  ▼
                                </span>
                              </button>

                              {/* Edit President */}
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenEditUser(item.president)}
                                style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                                title="Edit President details, password or status"
                              >
                                ✏️ Edit
                              </button>

                              {/* Disable/Activate */}
                              {!isPrimarySuperAdmin && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: item.president.status === 'active' ? '#D97706' : '#10B981',
                                    borderColor: item.president.status === 'active' ? '#FDE68A' : '#A7F3D0'
                                  }}
                                  onClick={() => handleToggleStatus(item.president)}
                                  title={item.president.status === 'active' ? 'Disable President' : 'Activate President'}
                                >
                                  {item.president.status === 'active' ? 'Disable' : 'Activate'}
                                </button>
                              )}

                              {/* Delete */}
                              {!isPrimarySuperAdmin && item.president.role !== 'superadmin' && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: '#FECACA' }}
                                  onClick={() => handleDeleteUser(item.president)}
                                  title="Delete President permanently"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Members Section (Accordion) */}
                          {isExpanded && (
                            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 15 }}>🏛️</span>
                                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#334155' }}>
                                    {mandalObj?.name || 'Mandal'} — कार्यकारिणी सदस्य व स्वयंसेवक (Committee Members & Volunteers)
                                  </h4>
                                  <span style={{ background: '#E2E8F0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999 }}>
                                    {item.members.length}
                                  </span>
                                </div>
                              </div>

                              {item.members.length > 0 ? (
                                <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                  <table className="table" style={{ margin: 0, fontSize: 13 }}>
                                    <thead style={{ background: '#F1F5F9' }}>
                                      <tr>
                                        <th style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>सदस्य नाव (Member)</th>
                                        <th style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>पद (Role)</th>
                                        <th style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>स्थिती (Status)</th>
                                        <th style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>सामील (Joined)</th>
                                        <th style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#475569' }}>कृती (Actions)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.members.map(member => {
                                        const roleInfo = getRoleColor(member.role);
                                        return (
                                          <tr key={member._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td>
                                              <div style={{ fontWeight: 600, color: '#0F172A' }}>{member.name}</div>
                                              <div className="text-caption" style={{ color: '#64748B' }}>
                                                {member.email} {member.mobile ? `· 📱 ${member.mobile}` : ''}
                                              </div>
                                            </td>
                                            <td>
                                              <span
                                                style={{
                                                  background: roleInfo.bg,
                                                  color: roleInfo.text,
                                                  border: `1px solid ${roleInfo.border}`,
                                                  padding: '3px 8px',
                                                  borderRadius: 6,
                                                  fontSize: 11.5,
                                                  fontWeight: 700,
                                                  textTransform: 'capitalize'
                                                }}
                                              >
                                                {roleInfo.label || member.role}
                                              </span>
                                            </td>
                                            <td>
                                              <span
                                                style={{
                                                  color: member.status === 'active' ? '#10B981' : (member.status === 'invited' ? '#F59E0B' : '#EF4444'),
                                                  background: member.status === 'active' ? '#10B98118' : (member.status === 'invited' ? '#F59E0B18' : '#EF444418'),
                                                  padding: '3px 8px',
                                                  borderRadius: 6,
                                                  fontSize: 11.5,
                                                  fontWeight: 600,
                                                  textTransform: 'capitalize'
                                                }}
                                              >
                                                {member.status}
                                              </span>
                                            </td>
                                            <td className="text-caption" style={{ color: '#64748B' }}>
                                              {new Date(member.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <button
                                                  className="btn btn-outline btn-sm"
                                                  style={{ padding: '4px 8px', fontSize: 11.5 }}
                                                  onClick={() => handleOpenEditUser(member)}
                                                  title="Edit member details"
                                                >
                                                  ✏️ Edit
                                                </button>
                                                <button
                                                  className="btn btn-outline btn-sm"
                                                  style={{
                                                    padding: '4px 8px',
                                                    fontSize: 11.5,
                                                    color: member.status === 'active' ? '#D97706' : '#10B981',
                                                    borderColor: member.status === 'active' ? '#FDE68A' : '#A7F3D0'
                                                  }}
                                                  onClick={() => handleToggleStatus(member)}
                                                  title={member.status === 'active' ? 'Disable member' : 'Activate member'}
                                                >
                                                  {member.status === 'active' ? 'Disable' : 'Activate'}
                                                </button>
                                                <button
                                                  className="btn btn-outline btn-sm"
                                                  style={{ padding: '4px 8px', fontSize: 11.5, color: '#EF4444', borderColor: '#FECACA' }}
                                                  onClick={() => handleDeleteUser(member)}
                                                  title="Delete member"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ padding: '16px 20px', background: '#FFFFFF', borderRadius: 10, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span>ℹ️</span>
                                  <span>या मंडळाखाली अजून अतिरिक्त कार्यकारिणी सदस्य जोडलेले नाहीत. अध्यक्ष ॲपवरून किंवा वेब पोर्टलवरून सदस्यांना आमंत्रित करू शकतात.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 48, background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👑</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>No President users matching filter criteria.</div>
                    <div className="text-caption" style={{ marginTop: 4 }}>Try clearing search or filter selections.</div>
                  </div>
                )}

                <PaginationControls
                  currentPage={userPage}
                  totalPages={totalPresidentPages}
                  totalItems={filteredPresidents.length}
                  pageSize={userPageSize}
                  onPageChange={setUserPage}
                  onPageSizeChange={setUserPageSize}
                />
              </div>
            )}

            {/* ─── MODE 2: FLAT USER LIST TABLE ─── */}
            {userViewMode === 'all' && (
              <div>
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
                      {paginatedUsers.map(u => {
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
                                {roleStyle.label || u.role}
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

                <PaginationControls
                  currentPage={userPage}
                  totalPages={totalUserPages}
                  totalItems={filteredUsers.length}
                  pageSize={userPageSize}
                  onPageChange={setUserPage}
                  onPageSizeChange={setUserPageSize}
                />
              </div>
            )}

            {/* ─── MODE 3: SUPERADMINS ─── */}
            {userViewMode === 'superadmins' && (
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {superadminsList.map(sa => {
                    const isPrimary = sa.email === 'quantromind@gmail.com';
                    return (
                      <div
                        key={sa._id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #DDD6FE',
                          borderRadius: 14,
                          padding: 18,
                          borderLeft: '5px solid #7C3AED',
                          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {sa.name}
                              {isPrimary && <span title="Primary System Superadmin">👑</span>}
                            </div>
                            <div className="text-caption" style={{ color: '#64748B', marginTop: 2 }}>{sa.email}</div>
                            {sa.mobile && <div className="text-caption" style={{ color: '#475569' }}>📱 {sa.mobile}</div>}
                          </div>
                          <span style={{ background: '#F3E8FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 800 }}>
                            🛡️ Superadmin
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9', marginTop: 10 }}>
                          <span className="text-caption" style={{ color: '#94A3B8' }}>Joined: {new Date(sa.createdAt).toLocaleDateString()}</span>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditUser(sa)}
                            style={{ fontSize: 12 }}
                          >
                            ✏️ Edit Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── MODE 4: UNASSIGNED USERS ─── */}
            {userViewMode === 'unassigned' && (
              <div style={{ padding: 20 }}>
                {unassignedUsersList.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {unassignedUsersList.map(u => (
                      <div
                        key={u._id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #FEF3C7',
                          borderRadius: 14,
                          padding: 18,
                          borderLeft: '5px solid #F59E0B'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                            <div className="text-caption" style={{ color: '#64748B' }}>{u.email}</div>
                            {u.mobile && <div className="text-caption">📱 {u.mobile}</div>}
                          </div>
                          <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            ⚠️ Unassigned
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenEditUser(u)}
                            style={{ fontSize: 12, background: '#2563EB', borderColor: '#2563EB' }}
                          >
                            🏢 Assign Mandal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 36, color: '#64748B' }}>
                    No unassigned users. All users belong to a registered Mandal.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB 3: PLANS ──────────────── */}
        {activeTab === 'plans' && (
          <div style={{ padding: 20 }}>
            {/* Header & Create Plan Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontSize: 18 }}>Subscription Plans Management</h3>
                <p className="text-sub" style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Create, configure pricing, manage features, and activate or deactivate plans for all mandals.
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleOpenCreatePlan}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FF6B00', borderColor: '#FF6B00', fontWeight: 700 }}
              >
                <span>➕</span> Create New Plan
              </button>
            </div>

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {plans.map((p) => {
                return (
                  <div
                    key={p._id || p.code}
                    className="card"
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      border: p.isActive ? (p.popular ? '2px solid #F59E0B' : '1px solid var(--border)') : '1px dashed #CBD5E1',
                      background: p.isActive ? '#FFFFFF' : '#F8FAFC',
                      opacity: p.isActive ? 1 : 0.75,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top Bar with Tier & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6 }}>
                          TIER {p.tier || 1}
                        </span>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {p.popular && (
                            <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 999, fontWeight: 800 }}>
                              POPULAR
                            </span>
                          )}
                          {p.isActive ? (
                            <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: 999, fontWeight: 800 }}>
                              🟢 ACTIVE
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: 999, fontWeight: 800 }}>
                              🔴 DEACTIVATED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plan Title & Code */}
                      <h3 style={{ fontSize: 19, fontWeight: 800, color: p.color || '#0F172A', margin: '0 0 2px' }}>
                        {p.name}
                      </h3>
                      {p.nameMr && (
                        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 6 }}>
                          {p.nameMr}
                        </div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 10 }}>
                        Code: <code style={{ color: '#0F172A', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{p.code}</code>
                      </div>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>₹{p.price}</span>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{p.period || '/month'}</span>
                      </div>

                      {/* Tagline & Member Limit */}
                      <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 12, lineHeight: 1.4 }}>
                        {p.tagline || 'No tagline provided'}
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
                        <span>👥</span> {p.memberLimit || 15} Committee Members Limit
                      </div>

                      {/* Features List Snippet */}
                      {Array.isArray(p.features) && p.features.length > 0 && (
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                          {p.features.slice(0, 4).map((f, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: p.color || '#10B981', fontWeight: 800 }}>✓</span> {f}
                            </div>
                          ))}
                          {p.features.length > 4 && (
                            <div style={{ fontSize: 11, color: '#94A3B8', paddingLeft: 14 }}>
                              +{p.features.length - 4} more features
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Toolbar */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTogglePlanStatus(p)}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          borderColor: p.isActive ? '#FCD34D' : '#86EFAC',
                          color: p.isActive ? '#B45309' : '#15803D',
                          background: p.isActive ? '#FFFBEB' : '#F0FDF4'
                        }}
                        title={p.isActive ? 'Deactivate this plan so users cannot select it' : 'Activate this plan for all mandals'}
                      >
                        {p.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                      </button>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEditPlan(p)}
                          style={{ fontSize: 12 }}
                          title="Edit plan configuration"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeletePlan(p)}
                          style={{ fontSize: 12, color: '#DC2626', borderColor: '#FECACA' }}
                          title="Delete or soft-deactivate plan"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showUserPassword ? "text" : "password"} 
                    className="input" 
                    value={editFormData.newPassword} 
                    onChange={e => setEditFormData({ ...editFormData, newPassword: e.target.value })} 
                    placeholder="Enter new password (min 6 characters) to reset"
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: 'var(--text-muted)'
                    }}
                    title={showUserPassword ? "Hide password" : "Show password"}
                  >
                    {showUserPassword ? '👁️' : '🙈'}
                  </button>
                </div>
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

      {/* ──────────────── CREATE / EDIT PLAN MODAL ──────────────── */}
      {editingPlan && (
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
          onClick={() => !savingPlan && setEditingPlan(null)}
        >
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 className="text-h3" style={{ margin: 0, fontSize: 18 }}>
                  {editingPlan === 'new' ? '✨ Create Subscription Plan' : `✏️ Edit Plan: ${editingPlan.name}`}
                </h3>
                <p className="text-caption" style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                  Configure pricing, member allowances, localization and tier order
                </p>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => !savingPlan && setEditingPlan(null)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {planModalError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                ⚠️ {planModalError}
              </div>
            )}

            <form onSubmit={handleSavePlan}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Plan Name (English) *
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. Platinum Elite" 
                    value={planFormData.name} 
                    onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Plan Name (Marathi)
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="उदा. प्लॅटिनम एलिट योजना" 
                    value={planFormData.nameMr} 
                    onChange={e => setPlanFormData({ ...planFormData, nameMr: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Code (Unique Identifier) *
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. Platinum" 
                    value={planFormData.code} 
                    onChange={e => setPlanFormData({ ...planFormData, code: e.target.value.replace(/\s+/g, '') })} 
                    disabled={editingPlan !== 'new'}
                    required 
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Price in INR (₹) *
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    className="input" 
                    placeholder="e.g. 499" 
                    value={planFormData.price} 
                    onChange={e => setPlanFormData({ ...planFormData, price: e.target.value })} 
                    required 
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Tier Rank (Higher = Better) *
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    className="input" 
                    placeholder="e.g. 3" 
                    value={planFormData.tier} 
                    onChange={e => setPlanFormData({ ...planFormData, tier: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Member Limit
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    className="input" 
                    placeholder="e.g. 50" 
                    value={planFormData.memberLimit} 
                    onChange={e => setPlanFormData({ ...planFormData, memberLimit: e.target.value })} 
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Color Accent (Hex)
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={planFormData.color || '#0284C7'} 
                      onChange={e => setPlanFormData({ ...planFormData, color: e.target.value })}
                      style={{ width: 38, height: 38, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="input" 
                      value={planFormData.color} 
                      onChange={e => setPlanFormData({ ...planFormData, color: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Badge (English)
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. ⚡ BEST VALUE" 
                    value={planFormData.badge} 
                    onChange={e => setPlanFormData({ ...planFormData, badge: e.target.value })} 
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Badge (Marathi)
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="उदा. 🔥 सर्वाधिक पसंती" 
                    value={planFormData.badgeMr} 
                    onChange={e => setPlanFormData({ ...planFormData, badgeMr: e.target.value })} 
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Tagline (English)
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Complete solution for premium festival trusts" 
                  value={planFormData.tagline} 
                  onChange={e => setPlanFormData({ ...planFormData, tagline: e.target.value })} 
                />
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Features (One feature per line)
                </label>
                <textarea 
                  className="input" 
                  rows={4}
                  placeholder="Unlimited WhatsApp receipts&#10;Up to 50 committee members&#10;Priority 24/7 Call Support" 
                  value={planFormData.features} 
                  onChange={e => setPlanFormData({ ...planFormData, features: e.target.value })} 
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 18, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={planFormData.isActive} 
                    onChange={e => setPlanFormData({ ...planFormData, isActive: e.target.checked })} 
                  />
                  <span>Active for New Subscriptions</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={planFormData.popular} 
                    onChange={e => setPlanFormData({ ...planFormData, popular: e.target.checked })} 
                  />
                  <span>Mark as Most Popular Badge</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingPlan(null)}
                  disabled={savingPlan}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingPlan}
                  style={{ background: 'var(--primary, #FF6B00)', borderColor: 'var(--primary, #FF6B00)' }}
                >
                  {savingPlan ? 'Saving Plan...' : (editingPlan === 'new' ? 'Create Plan →' : 'Save Plan Changes')}
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
