import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Register = () => {
  const [account, setAccount] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [mandalName, setMandalName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isExistingUser, setIsExistingUser] = useState(false);

  const checkEmailExists = async (emailToCheck) => {
    const trimmed = (emailToCheck || '').trim();
    if (!trimmed || !trimmed.includes('@') || trimmed.length < 5) return false;
    try {
      const res = await api.post('/auth/check-email', { email: trimmed });
      if (res.data?.exists) {
        setIsExistingUser(true);
        setError('This email is already registered with Apla Mandal. Please log in instead.');
        return true;
      }
      return false;
    } catch (e) {
      if (e.response?.status === 409 || e.response?.data?.message?.toLowerCase().includes('already registered')) {
        setIsExistingUser(true);
        setError('This email is already registered with Apla Mandal. Please log in instead.');
        return true;
      }
      return false;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!account.email) { setError('Enter a valid email address'); return; }
    setLoading(true); setError(''); setIsExistingUser(false);

    // ① Check if user already exists BEFORE sending OTP
    const alreadyExists = await checkEmailExists(account.email);
    if (alreadyExists) {
      setLoading(false);
      return; // Error message already set by checkEmailExists
    }

    // ② Email is free — send OTP
    try {
      await api.post('/auth/send-otp', { email: account.email.trim(), purpose: 'register' });
      setOtpSent(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send OTP';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setError('This email is already registered with Apla Mandal. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email: account.email, code: otp });
      setOtpVerified(true);
    } catch (e) { setError(e.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!account.name || !account.email || !account.password || !mandalName) { setError('All fields are required'); return; }
    if (!otpVerified) { setError('Please verify your email address first'); return; }
    if (account.password !== account.confirmPassword) { setError('Passwords do not match'); return; }
    if (account.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError(''); setIsExistingUser(false);
    try {
      await register({ name: account.name, email: account.email, password: account.password, mobile: account.mobile, mandalName, eventTypes: [] });
      navigate('/onboarding');
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      setError(msg);
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Apla Mandal Logo" style={{ width: 40, height: 40, marginRight: 12, borderRadius: 10 }} />
          Apla<span>Mandal</span>
        </div>
        
        <h1 className="text-h1" style={{ marginBottom: 12 }}>Create your account</h1>
        <p className="text-sub" style={{ marginBottom: 32 }}>Set up your Apla Mandal workspace</p>

        {error && (
          <div style={{ padding: '14px 16px', background: isExistingUser ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)', border: isExistingUser ? '1px solid #FCA5A5' : 'none', borderRadius: 8, marginBottom: 20 }}>
            <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>{error}</div>
            {isExistingUser && (
              <div style={{ marginTop: 8 }}>
                <Link to="/login" className="btn btn-primary btn-sm" style={{ display: 'inline-block', textDecoration: 'none', padding: '6px 14px', fontSize: 13 }}>
                  Go to Login →
                </Link>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleAccountSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Your Name</label>
              <input placeholder="Ramesh Sharma" value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Mandal Name</label>
              <input placeholder="Shri Ganesh Mandal" value={mandalName} onChange={e => setMandalName(e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label>Email Address</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="email"
                placeholder="president@mandal.com"
                value={account.email}
                onBlur={() => checkEmailExists(account.email)}
                onChange={e => {
                  setAccount({ ...account, email: e.target.value });
                  if (isExistingUser) {
                    setIsExistingUser(false);
                    setError('');
                  }
                }}
                disabled={otpVerified}
                required
                style={{ flex: 1 }}
              />
              {!otpVerified && (
                <button type="button" className="btn btn-secondary" onClick={handleSendOtp} disabled={loading || otpSent} style={{ whiteSpace: 'nowrap' }}>
                  {otpSent ? 'Sent ✓' : 'Send OTP'}
                </button>
              )}
              {otpVerified && <div style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontWeight: 600, padding: '0 12px' }}>✓ Verified</div>}
            </div>
          </div>

          {otpSent && !otpVerified && (
            <div className="field">
              <label>Enter Email OTP</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={handleVerifyOtp} disabled={loading}>Verify</button>
              </div>
            </div>
          )}

          <div className="field">
            <label>Mobile Number (Optional)</label>
            <input
              placeholder="9876543210"
              value={account.mobile}
              onChange={e => setAccount({ ...account, mobile: e.target.value })}
              maxLength={10}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Min 8 characters" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} required />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input type="password" placeholder="Re-enter password" value={account.confirmPassword} onChange={e => setAccount({ ...account, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <button className="btn btn-primary w-full" style={{ padding: '16px', fontSize: 16, marginTop: 12 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '24px 0 0', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
