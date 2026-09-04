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

  // Non-superadmin users without an active plan selection are redirected to onboarding
  const hasPlan = activeMandal?.checklist?.planSelected === true;
  if (!isSuperAdmin && !hasPlan && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
