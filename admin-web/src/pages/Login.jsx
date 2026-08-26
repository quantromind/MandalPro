import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      const isSuperAdmin = result.user.role === 'superadmin';
      const hasPlan = result.mandal?.checklist?.planSelected === true;

      if (!isSuperAdmin && !hasPlan) {
        // No subscription yet — always send to the Plan selection step
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Apla Mandal Logo" style={{ width: 40, height: 40, marginRight: 12, borderRadius: 10 }} />
          Apla<span>Mandal</span>
        </div>
        
        <h1 className="text-h1" style={{ marginBottom: 12 }}>Manage your Mandal.<br/>Smarter. Together.</h1>
        <p className="text-sub" style={{ marginBottom: 32, fontSize: 15 }}>
          Everything you need to organize festivals, donations, events and your team.
        </p>

        {error && <div className="error-text" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 20 }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@mandal.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: 16 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Continue with Email'}
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '12px' }}
            onClick={(e) => {
              e.preventDefault();
              setEmail('quantromind@gmail.com');
              setPassword('Nakshatra@#12345');
              setTimeout(() => {
                document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }, 100);
            }}
          >
            🚀 Quick Admin Login
          </button>
        </div>

        <p style={{ textAlign: 'center', margin: '24px 0 16px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create Mandal</Link>
        </p>

        <div className="auth-footer">
          By continuing, you agree to our <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> &amp; <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
      
      {/* Decorative community illustration placeholder */}
      <div style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)', opacity: 0.1, pointerEvents: 'none' }}>
        <svg width="400" height="200" viewBox="0 0 400 200" fill="none">
          <path d="M0,200 L400,200 L400,100 Q300,50 200,100 Q100,150 0,100 Z" fill="#FF6B00"/>
          <circle cx="200" cy="80" r="40" fill="#FF6B00"/>
          <circle cx="100" cy="120" r="30" fill="#FF6B00"/>
          <circle cx="300" cy="120" r="30" fill="#FF6B00"/>
        </svg>
      </div>
    </div>
  );
};

export default Login;
