import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const CHECKLIST_ITEMS = [
  { key: 'profileComplete',    label: 'Complete Mandal Profile',    link: '/onboarding',  icon: '🏛' },
  { key: 'eventTypesSelected', label: 'Select Event Types',         link: '/onboarding',  icon: '🎪' },
  { key: 'planSelected',       label: 'Choose a Plan',              link: '/onboarding',  icon: '📋' },
  { key: 'inviteTeam',         label: 'Invite Team Members',        link: '/members',     icon: '👥' },
  { key: 'firstDonation',      label: 'Add First Donation',         link: '/donations',   icon: '💰' },
  { key: 'firstEvent',         label: 'Create First Event',         link: '/events',      icon: '🗓' },
];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [onboardDone, setOnboardDone] = useState(true);
  const [error, setError] = useState('');
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  
  const { user, activeMandal } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    if (isSuperAdmin) return;
    api.get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) return;
    api.get('/mandal')
      .then((res) => {
        const m = res.data;
        setChecklist(m.checklist || {});
        setOnboardDone(m.onboardingComplete || false);
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const markChecklist = async (key) => {
    try {
      const res = await api.patch(`/onboarding/checklist/${key}`);
      setChecklist(res.data.checklist);
      setOnboardDone(res.data.onboardingComplete);
    } catch (e) { /* silent */ }
  };

  const completedCount = checklist ? CHECKLIST_ITEMS.filter(i => checklist[i.key]).length : 0;
  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Layout>
      {/* Mobile Top Header (Since desktop has its own topbar) */}
      <div className="flex-between mb-3" style={{ padding: '0 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)', fontWeight: 700, fontSize: 18 }} onClick={() => setShowSwitcher(true)}>
            {activeMandal?.name || 'MandalFlow'} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>▼</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ganesh Utsav 2026</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 20 }}>🔔</div>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{user?.name?.[0]?.toUpperCase()}</div>
        </div>
      </div>

      <div style={{ padding: '0 8px', marginBottom: 24 }}>
        <h1 className="text-h1" style={{ fontSize: 24 }}>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
      </div>

      {error && <div className="error-text">{error}</div>}

      {/* ── Getting Started Checklist ── */}
      {checklist && !onboardDone && !isSuperAdmin && (
        <div className="card" style={{ padding: 24, border: '1px solid var(--primary)', background: 'rgba(255,107,0,0.02)' }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="text-h3" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>🚀 Getting Started</h3>
              <p className="text-sub">{completedCount} of {CHECKLIST_ITEMS.length} steps complete</p>
            </div>
            <div style={{ width: 100, height: 8, background: 'rgba(255,107,0,0.1)', borderRadius: 999 }}>
              <div style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: 12 }}>
            {CHECKLIST_ITEMS.map(item => {
              const isDone = checklist[item.key];
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: isDone ? 0.6 : 1, padding: '8px 0' }}>
                  <div style={{ fontSize: 20, filter: isDone ? 'grayscale(1)' : 'none' }}>{item.icon}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none' }}>{item.label}</div>
                  {isDone ? (
                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>
                  ) : (
                    <Link to={item.link} className="btn btn-primary btn-sm" onClick={() => markChecklist(item.key)}>Do it →</Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isSuperAdmin ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👑</div>
          <h3 className="text-h2">Welcome, Super Admin</h3>
          <p className="text-sub">You are logged in as the system administrator.</p>
        </div>
      ) : !summary ? (
        <div className="grid grid-2 mt-4">
          <div className="card skeleton" style={{ height: 120 }}></div>
          <div className="card skeleton" style={{ height: 120 }}></div>
        </div>
      ) : (
        <>
          <div className="grid grid-2">
            <div className="card" style={{ padding: 20 }}>
              <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTAL DONATIONS</div>
              <div className="text-h1" style={{ fontSize: 32, margin: '8px 0', color: 'var(--text-main)' }}>{inr(summary.totalCollections)}</div>
              <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>↑ 12% this month</div>
            </div>
            
            <div className="card" style={{ padding: 20 }}>
              <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTAL EXPENSES</div>
              <div className="text-h1" style={{ fontSize: 32, margin: '8px 0', color: 'var(--text-main)' }}>{inr(summary.totalExpenses)}</div>
              <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>↓ 8% this month</div>
            </div>
            
            <div className="card" style={{ padding: 20 }}>
              <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>BALANCE</div>
              <div className="text-h1" style={{ fontSize: 32, margin: '8px 0', color: 'var(--primary)' }}>{inr(summary.balance)}</div>
            </div>
            
            <div className="card" style={{ padding: 20 }}>
              <div className="text-sub" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>TEAM MEMBERS</div>
              <div className="text-h1" style={{ fontSize: 32, margin: '8px 0', color: 'var(--text-main)' }}>42</div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>Upcoming Events</h2>
            <div className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)', padding: '12px 16px', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>27</div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Aug</div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="text-h3" style={{ margin: '0 0 4px' }}>Ganesh Utsav 2026</h3>
                <div className="text-sub" style={{ fontSize: 13, marginBottom: 8 }}>27 Aug – 5 Sep • 10 Days</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--border-light)', borderRadius: 999 }}>
                    <div style={{ width: '82%', height: '100%', background: 'var(--success)', borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>82% prep</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 mb-4">
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>Recent Donations</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {summary.recentDonations.map((d, index) => (
                <div key={d._id} style={{ padding: 16, borderBottom: index < summary.recentDonations.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ background: 'var(--bg)', color: 'var(--text-main)' }}>{d.donorName[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{d.donorName}</div>
                      <div className="text-caption">Today, 10:30 AM • {d.paymentMode?.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>+{inr(d.amount)}</div>
                </div>
              ))}
              {summary.recentDonations.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No recent donations</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Multi-Mandal Switcher ── */}
      {showSwitcher && (
        <div className="sheet-backdrop" onClick={() => setShowSwitcher(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2 mb-3">Your Mandals</h2>
            <p className="text-sub mb-3">One account. Multiple Mandals.</p>
            
            <div className="card" style={{ border: '2px solid var(--primary)', padding: 16, cursor: 'pointer' }} onClick={() => setShowSwitcher(false)}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>🟠</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{activeMandal?.name || 'Shri Ganesh Mandal'}</div>
                    <div className="text-caption">Pro Plan • 3 Events</div>
                  </div>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 700 }}>✓ Active</div>
              </div>
            </div>

            <div className="card" style={{ padding: 16, cursor: 'pointer', background: 'var(--bg)' }}>
              <div className="flex-start">
                <div style={{ fontSize: 24 }}>🔵</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Shivaji Nagar Mandal</div>
                  <div className="text-caption">Free Plan • 1 Event</div>
                </div>
              </div>
            </div>

            <button className="btn btn-outline w-full mb-3" style={{ borderStyle: 'dashed' }}>
              + Add New Mandal
            </button>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowSwitcher(false)}>Manage Mandals</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
