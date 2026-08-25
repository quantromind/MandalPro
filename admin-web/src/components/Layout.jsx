import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/events', label: 'Events', icon: '🎪' },
  { to: '/donations', label: 'Donations', icon: '🙏' },
  { to: '/receipts', label: 'Receipts', icon: '🧾' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/budgets', label: 'Budgets', icon: '📈' },
  { to: '/members', label: 'Team', icon: '👥' },
  { to: '/reports', label: 'Reports', icon: '📑' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
];

const mobileNavLinks = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/events', label: 'Events', icon: '🎪' },
  // middle is + FAB
  { to: '/donations', label: 'Donations', icon: '🙏' },
  { to: '/settings', label: 'Profile', icon: '👤' }
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ── */}
      <aside className="desktop-sidebar">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Mandal<span>Flow</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
          {user?.role === 'superadmin' && (
            <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <NavLink to="/superadmin">
                <span>🛡️</span> Superadmin
              </NavLink>
            </div>
          )}
        </nav>
      </aside>

      <div className="main-area">
        {/* ── Desktop Topbar ── */}
        <header className="topbar">
          <div className="text-h3"></div>
          <div className="topbar-right">
            <button className="btn btn-primary" onClick={() => setShowQuickAdd(true)}>+ New</button>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="content">{children}</div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-nav">
        {mobileNavLinks.map((l, index) => {
          if (index === 2) {
            return (
              <div key="fab" className="nav-item nav-fab-wrapper">
                <button className="nav-fab" onClick={() => setShowQuickAdd(true)}>+</button>
              </div>
            );
          }
          return (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={l.to === '/'}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          );
        })}
        {/* Need to add the 4th item because we injected the FAB */}
        <NavLink to={mobileNavLinks[3].to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span>{mobileNavLinks[3].icon}</span>
          <span>{mobileNavLinks[3].label}</span>
        </NavLink>
      </nav>

      {/* ── Quick Add Bottom Sheet ── */}
      {showQuickAdd && (
        <div className="sheet-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2">What would you like to add?</h2>
            
            <div className="quick-add-grid">
              <div className="quick-add-item" onClick={() => { setShowQuickAdd(false); navigate('/donations'); }}>
                <div className="quick-add-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>🙏</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Donation</div>
              </div>
              <div className="quick-add-item" onClick={() => { setShowQuickAdd(false); navigate('/receipts'); }}>
                <div className="quick-add-icon" style={{ background: 'rgba(255, 107, 0, 0.1)', color: 'var(--primary)' }}>🧾</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Receipt</div>
              </div>
              <div className="quick-add-item" onClick={() => { setShowQuickAdd(false); navigate('/expenses'); }}>
                <div className="quick-add-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>💸</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Expense</div>
              </div>
              <div className="quick-add-item" onClick={() => { setShowQuickAdd(false); navigate('/events'); }}>
                <div className="quick-add-icon" style={{ background: 'rgba(108, 77, 217, 0.1)', color: '#6C4DD9' }}>📅</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Event</div>
              </div>
              <div className="quick-add-item" onClick={() => { setShowQuickAdd(false); navigate('/members'); }}>
                <div className="quick-add-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>👥</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Member</div>
              </div>
              <div className="quick-add-item" onClick={() => setShowQuickAdd(false)}>
                <div className="quick-add-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>📋</div>
                <div className="text-h3" style={{ fontSize: 14 }}>Task</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
