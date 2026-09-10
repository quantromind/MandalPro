import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ProtectedRoute = ({ children }) => {
  const { user, activeMandal, logout } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const isSuperAdmin = user.role === 'superadmin';

  // Superadmin should only see the superadmin console (unless viewing profile)
  if (isSuperAdmin) {
    if (location.pathname === '/profile') {
      return children;
    }
    return <Navigate to="/superadmin" replace />;
  }

  const isExpired = activeMandal?.planStatus === 'Expired' || activeMandal?.planStatus === 'expired';
  const isSubscription = location.pathname === '/subscription';
  const isOnboarding = location.pathname === '/onboarding';

  // Expired plan handling: show clear fallback UI directing to /subscription (allow /subscription through)
  if (!isSuperAdmin && isExpired) {
    if (isSubscription) {
      return children;
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #F8F7F4)',
        padding: '24px'
      }}>
        <div className="card" style={{
          maxWidth: 520,
          width: '100%',
          padding: '36px 32px',
          textAlign: 'center',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(23, 37, 84, 0.08)',
          border: '1px solid var(--border, #E2E8F0)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger, #EF4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            margin: '0 auto 20px'
          }}>
            ⏳
          </div>

          <span className="badge badge-danger" style={{ marginBottom: 12, display: 'inline-block' }}>
            {language === 'mr' ? 'सदस्यता समाप्त' : 'Subscription Expired'}
          </span>

          <h1 className="text-h2" style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 12px', color: 'var(--text-main, #172554)' }}>
            {language === 'mr' ? 'मंडळाची सदस्यता योजना संपली आहे' : 'Your Mandal Plan Has Expired'}
          </h1>

          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 28 }}>
            {language === 'mr'
              ? `"${activeMandal?.name || 'मंडळ'}" ची सदस्यता योजना समाप्त झाली आहे. वर्गणी जमा, देणगी पावत्या, अहवाल व इतर सेवा पूर्ववत चालू ठेवण्यासाठी कृपया योजना त्वरित नूतनीकरण करा.`
              : `The subscription plan for "${activeMandal?.name || 'your Mandal'}" has expired. Please renew your plan to restore full access to collections, receipts, and reports.`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px 20px', fontSize: 15 }}
              onClick={() => navigate('/subscription')}
            >
              💎 {language === 'mr' ? 'सदस्यता नूतनीकरण करा (Go to Subscription)' : 'Renew Subscription Plan →'}
            </button>

            <button
              className="btn btn-outline"
              style={{ width: '100%', padding: '12px 20px', fontSize: 14 }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              🚪 {language === 'mr' ? 'लॉगआउट करा (Log Out)' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only President without a selected plan is directed to onboarding; non-presidents never go to onboarding
  const hasPlan = activeMandal?.checklist?.planSelected === true;
  if (user.role === 'president' && !hasPlan && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (user.role !== 'president' && isOnboarding) {
    return <Navigate to="/" replace />;
  }

  // ── Granular Route Permissions Check ──
  const isPresident = user.role === 'president' || isSuperAdmin;
  const perms = isPresident
    ? { canCollect: true, canManageExpenses: true, canAddMembers: true, canChat: true, canViewReports: true }
    : {
        canCollect: user?.permissions?.canCollect ?? ['treasurer', 'secretary', 'volunteer'].includes(user?.role),
        canManageExpenses: user?.permissions?.canManageExpenses ?? ['treasurer', 'secretary'].includes(user?.role),
        canAddMembers: user?.permissions?.canAddMembers ?? ['secretary'].includes(user?.role),
        canChat: user?.permissions?.canChat ?? true,
        canViewReports: user?.permissions?.canViewReports ?? ['treasurer', 'secretary'].includes(user?.role)
      };

  let isAllowed = true;
  let reasonMsg = '';
  const path = location.pathname;

  if (['/collections', '/donations', '/receipts'].some((p) => path.startsWith(p)) && !perms.canCollect) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'तुम्हाला देणगी संकलन किंवा डिजिटल पावत्या पाहण्याची परवानगी नाही.'
      : 'You do not have permission to collect donations or access receipts.';
  } else if (['/expenses', '/budgets'].some((p) => path.startsWith(p)) && !perms.canManageExpenses) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'तुम्हाला मंडळ खर्च नोंदवण्याची किंवा अंदाजपत्रक व्यवस्थापनाची परवानगी नाही.'
      : 'You do not have permission to record or manage expenses and budgets.';
  } else if (path.startsWith('/chat') && !perms.canChat) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'तुम्हाला कमिटी चॅट वापरण्याची परवानगी नाही.'
      : 'You do not have permission to access the committee chat.';
  } else if (path.startsWith('/reports') && !perms.canViewReports) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'तुम्हाला आर्थिक ताळेबंद व अहवाल पाहण्याची परवानगी नाही.'
      : 'You do not have permission to view financial reports.';
  } else if (path.startsWith('/members') && !perms.canAddMembers) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'तुम्हाला नवीन सदस्य जोडण्याची किंवा व्यवस्थापित करण्याची परवानगी नाही.'
      : 'You do not have permission to add or manage committee members.';
  } else if ((path.startsWith('/subscription') || path.startsWith('/settings')) && !isPresident) {
    isAllowed = false;
    reasonMsg = language === 'mr'
      ? 'हा विभाग केवळ मंडळ अध्यक्ष (President) यांच्यासाठी उपलब्ध आहे.'
      : 'This section is only accessible to the Mandal President.';
  }

  if (!isAllowed) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #F8F7F4)',
        padding: '24px'
      }}>
        <div className="card" style={{
          maxWidth: 480,
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(23, 37, 84, 0.08)',
          border: '1px solid var(--border, #E2E8F0)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger, #EF4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 16px'
          }}>
            🔒
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 10px', color: 'var(--text-main, #172554)' }}>
            {language === 'mr' ? 'मर्यादित प्रवेश (Access Restricted)' : 'Access Restricted'}
          </h2>
          <p style={{ color: 'var(--text-muted, #64748B)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {reasonMsg}
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 18px', fontSize: 14.5 }}
            onClick={() => navigate('/')}
          >
            📊 {language === 'mr' ? 'डॅशबोर्डवर परत जा' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
