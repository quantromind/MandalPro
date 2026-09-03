import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout({ children }) {
  const { user, mandal, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMoreNav, setShowMoreNav] = useState(false);

  const dashboardLink = {
    to: '/',
    labelMr: 'डॅशबोर्ड',
    labelEn: 'Dashboard',
    icon: '📊',
    end: true
  };

  const navSections = [
    {
      id: 'finance',
      titleMr: 'वित्त',
      titleEn: 'Finance',
      items: [
        { to: '/collections', labelMr: 'वर्गणी / जमा', labelEn: 'Collections', icon: '🚩' },
        { to: '/donations', labelMr: 'देणग्या', labelEn: 'Donations', icon: '💰' },
        { to: '/expenses', labelMr: 'खर्च', labelEn: 'Expenses', icon: '💸' },
        { to: '/budgets', labelMr: 'अंदाजपत्रक', labelEn: 'Budgets', icon: '📈' }
      ]
    },
    {
      id: 'operations',
      titleMr: 'कामकाज',
      titleEn: 'Operations',
      items: [
        { to: '/events', labelMr: 'कार्यक्रम', labelEn: 'Events', icon: '🎪' },
        { to: '/inventory', labelMr: 'साहित्य', labelEn: 'Inventory', icon: '📦' },
        { to: '/sponsors', labelMr: 'प्रायोजक', labelEn: 'Sponsors', icon: '🤝' },
        { to: '/members', labelMr: 'कार्यकारिणी', labelEn: 'Members', icon: '👥' }
      ]
    },
    {
      id: 'communication',
      titleMr: 'संवाद',
      titleEn: 'Communication',
      items: [
        { to: '/chat', labelMr: 'समिती संवाद', labelEn: 'Committee Chat', icon: '💬' },
        { to: '/approvals', labelMr: 'मंजुऱ्या', labelEn: 'Approvals', icon: '⏳' }
      ]
    },
    {
      id: 'growth',
      titleMr: 'वाढ व अहवाल',
      titleEn: 'Growth',
      items: [
        { to: '/subscription', labelMr: 'सदस्यता', labelEn: 'Subscription', icon: '💎' },
        { to: '/reports', labelMr: 'अहवाल', labelEn: 'Reports', icon: '📑' }
      ]
    },
    {
      id: 'account',
      titleMr: 'खाते',
      titleEn: 'Account',
      items: [
        { to: '/profile', labelMr: 'मंडळ प्रोफाइल', labelEn: 'Mandal Profile', icon: '🏛️' },
        { to: '/settings', labelMr: 'सेटिंग्ज', labelEn: 'Settings', icon: '⚙️' }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'mr' ? 'en' : 'mr');
  };

  const handleNavigate = (path) => {
    setShowMoreNav(false);
    setShowQuickAdd(false);
    navigate(path);
  };

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ── */}
      <aside className="desktop-sidebar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="Apla Mandal Logo"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', background: '#FFFFFF', padding: 2, flexShrink: 0 }}
          />
          <div className="brand-text">
            Apla<span>Mandal</span>
            <span className="brand-sub">{mandal?.name || 'MandalPro'}</span>
          </div>
        </div>

        <nav>
          {/* Main Dashboard Link */}
          <NavLink to={dashboardLink.to} end={dashboardLink.end}>
            <span>{dashboardLink.icon}</span> {language === 'mr' ? dashboardLink.labelMr : dashboardLink.labelEn}
          </NavLink>

          {/* Grouped Nav Sections */}
          {navSections.map((section) => (
            <div key={section.id} className="nav-group-wrapper">
              <div className="sidebar-section-title">
                {language === 'mr' ? section.titleMr : section.titleEn}
              </div>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to}>
                  <span>{item.icon}</span> {language === 'mr' ? item.labelMr : item.labelEn}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Superadmin Section */}
          {user?.role === 'superadmin' && (
            <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="sidebar-section-title">
                {language === 'mr' ? 'सुपरअ‍ॅडमिन' : 'Superadmin'}
              </div>
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
          <div className="topbar-left">
            <span className="topbar-mandal-badge">
              🚩 {mandal?.name || 'श्री गणेश मित्र मंडळ'}
            </span>
          </div>

          <div className="topbar-right">
            {/* Language Switch Button */}
            <button
              className="btn-lang-toggle"
              onClick={toggleLanguage}
              title="Switch Language / भाषा बदला"
            >
              <span className="lang-icon">🌐</span>
              <span className="lang-text">{language === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            <button className="btn btn-primary btn-quick-add" onClick={() => setShowQuickAdd(true)}>
              + New
            </button>

            <div className="avatar-chip" onClick={() => navigate('/profile')} title="My Profile">
              <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'M'}</div>
              <div className="avatar-info-desktop">
                <span className="avatar-name">{user?.name || 'Member'}</span>
                <span className="avatar-role">{user?.role || 'volunteer'}</span>
              </div>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title={t('common.logout')} style={{ fontSize: 16 }}>
              🚪
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="content">{children}</div>
      </div>

      {/* Floating Chat Shortcut Button */}
      {location.pathname !== '/chat' && (
        <button
          className="floating-chat-btn"
          onClick={() => navigate('/chat')}
          title="Open Committee Live Chat"
        >
          <span>💬</span>
          <span className="floating-chat-label">{language === 'mr' ? 'संवाद' : 'Chat'}</span>
        </button>
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-nav">
        {/* 1. Home / Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <span>🏠</span>
          <span>{language === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}</span>
        </NavLink>

        {/* 2. Collections */}
        <NavLink
          to="/collections"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span>🚩</span>
          <span>{language === 'mr' ? 'वर्गणी' : 'Collections'}</span>
        </NavLink>

        {/* 3. Floating Quick Action Center Button */}
        <div className="nav-item nav-fab-wrapper">
          <button
            className="nav-fab"
            onClick={() => setShowQuickAdd(true)}
            aria-label="Quick Add"
          >
            +
          </button>
        </div>

        {/* 4. Chat */}
        <NavLink
          to="/chat"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span>💬</span>
          <span>{language === 'mr' ? 'संवाद' : 'Chat'}</span>
        </NavLink>

        {/* 5. More Menu Button */}
        <button
          className={`nav-item ${showMoreNav ? 'active' : ''}`}
          onClick={() => setShowMoreNav(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="More Menu"
        >
          <span style={{ fontSize: 20 }}>☰</span>
          <span>{language === 'mr' ? 'अधिक' : 'More'}</span>
        </button>
      </nav>

      {/* ── Mobile More Drawer / Sheet ── */}
      {showMoreNav && (
        <div className="sheet-backdrop" onClick={() => setShowMoreNav(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="sheet-handle"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 18, margin: 0 }}>
                  {language === 'mr' ? 'सर्व विभाग' : 'All Sections'}
                </h2>
                <span className="text-muted" style={{ fontSize: 12.5 }}>
                  {mandal?.name || 'MandalPro'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowMoreNav(false)}
                style={{ fontSize: 18, padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* All Categorized Nav Sections */}
            {navSections.map((section) => (
              <div key={section.id} className="more-nav-section">
                <div className="more-nav-title">
                  {language === 'mr' ? section.titleMr : section.titleEn}
                </div>
                <div className="more-nav-grid">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <div
                        key={item.to}
                        className={`more-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleNavigate(item.to)}
                      >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <span>{language === 'mr' ? item.labelMr : item.labelEn}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Superadmin Link in More Sheet */}
            {user?.role === 'superadmin' && (
              <div className="more-nav-section">
                <div className="more-nav-title">
                  {language === 'mr' ? 'सुपरअ‍ॅडमिन' : 'Superadmin'}
                </div>
                <div className="more-nav-grid">
                  <div
                    className={`more-nav-item ${location.pathname.startsWith('/superadmin') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/superadmin')}
                  >
                    <span style={{ fontSize: 18 }}>🛡️</span>
                    <span>Superadmin Portal</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sheet Footer Controls */}
            <div style={{
              display: 'flex',
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border-light)'
            }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                onClick={toggleLanguage}
              >
                🌐 {language === 'mr' ? 'English' : 'मराठी'}
              </button>

              <button
                className="btn btn-danger"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                onClick={handleLogout}
              >
                🚪 {language === 'mr' ? 'लॉगआउट' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Bottom Sheet ── */}
      {showQuickAdd && (
        <div className="sheet-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <h2 className="text-h2" style={{ fontSize: 17, marginBottom: 4 }}>
              {language === 'mr' ? '⚡ तुम्हाला काय जोडायचे?' : '⚡ What would you like to add?'}
            </h2>
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
              {language === 'mr' ? 'त्वरित कृती निवडा' : 'Select a quick action'}
            </p>
            
            <div className="quick-add-grid">
              <div className="quick-add-item" onClick={() => handleNavigate('/collections')}>
                <div className="quick-add-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#F97316' }}>🚩</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('nav.collection')}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/collections?tab=receipts')}>
                <div className="quick-add-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>🧾</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('nav.receipts')}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/donations')}>
                <div className="quick-add-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>💰</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{language === 'mr' ? 'देणगी नोंद' : 'Donation'}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/expenses')}>
                <div className="quick-add-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>💸</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('nav.expenses')}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/chat')}>
                <div className="quick-add-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>💬</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('nav.chat')}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/events')}>
                <div className="quick-add-icon" style={{ background: 'rgba(108, 77, 217, 0.1)', color: '#6C4DD9' }}>🎪</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('nav.events')}</div>
              </div>
              <div className="quick-add-item" onClick={() => handleNavigate('/members')}>
                <div className="quick-add-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>👥</div>
                <div className="text-h3" style={{ fontSize: 12.5 }}>{t('profile.addMember')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
