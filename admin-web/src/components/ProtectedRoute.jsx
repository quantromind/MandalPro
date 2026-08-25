import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, activeMandal } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  // Non-superadmin users without an active plan are always redirected to onboarding
  const isSuperAdmin = user.role === 'superadmin';
  const hasPlan = activeMandal?.checklist?.planSelected === true && activeMandal?.planStatus !== 'Expired';
  const isOnboarding = location.pathname === '/onboarding';

  if (!isSuperAdmin && !hasPlan && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
