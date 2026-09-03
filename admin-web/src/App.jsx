import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import SuperadminRoute from './components/SuperadminRoute';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SuperadminMandalDetails from './pages/SuperadminMandalDetails';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';
import Approvals from './pages/Approvals';
import Chat from './pages/Chat';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Donations from './pages/Donations';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Events from './pages/Events';
import Members from './pages/Members';
import Sponsors from './pages/Sponsors';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Receipts from './pages/Receipts';
import Reports from './pages/Reports';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/" element={user ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Landing />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/sponsors" element={<ProtectedRoute><Sponsors /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/superadmin" element={<SuperadminRoute><SuperadminDashboard /></SuperadminRoute>} />
      <Route path="/superadmin/mandals/:id" element={<SuperadminRoute><SuperadminMandalDetails /></SuperadminRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
}

export default App;
