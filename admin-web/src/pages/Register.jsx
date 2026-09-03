import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const EVENT_TYPES = [
  { id: 'Ganesh Utsav', icon: '🐘', labelMr: 'गणेशोत्सव', labelEn: 'Ganesh Utsav' },
  { id: 'Navratri', icon: '🪔', labelMr: 'नवरात्रोत्सव', labelEn: 'Navratri' },
  { id: 'Jayanti', icon: '🚩', labelMr: 'शिवजयंती / उत्सव', labelEn: 'Shiv Jayanti / Utsav' },
  { id: 'Diwali', icon: '✨', labelMr: 'दिवाळी महोत्सव', labelEn: 'Diwali' },
  { id: 'Wedding/Hall', icon: '💒', labelMr: 'संस्था / हॉल', labelEn: 'Trust / Hall' },
  { id: 'Custom', icon: '⚙️', labelMr: 'इतर उत्सव', labelEn: 'Custom Festival' }
];

export default function Register() {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email & Details, 2: Festivals
  const [account, setAccount] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [mandalName, setMandalName] = useState('');
  const [eventTypes, setEventTypes] = useState(['Ganesh Utsav']);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const checkEmailExists = async (emailToCheck) => {
    const trimmed = (emailToCheck || '').trim().toLowerCase();
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
    e?.preventDefault();
    if (!account.email || !account.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setIsExistingUser(false);

    const alreadyExists = await checkEmailExists(account.email);
    if (alreadyExists) {
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/send-otp', { email: account.email.trim().toLowerCase(), purpose: 'register' });
      setOtpSent(true);
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to send OTP';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setError('This email is already registered with Apla Mandal. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', {
        email: account.email.trim().toLowerCase(),
        code: otp.trim(),
        purpose: 'register'
      });
      setOtpVerified(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (id) => {
    if (eventTypes.includes(id)) {
      if (eventTypes.length === 1) return;
      setEventTypes(eventTypes.filter(e => e !== id));
    } else {
      if (eventTypes.length >= 3) return;
      setEventTypes([...eventTypes, id]);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!account.name.trim()) { setError('Your name is required'); return; }
    if (!mandalName.trim()) { setError('Mandal name is required'); return; }
    if (!account.email.trim()) { setError('Email address is required'); return; }
    if (!otpVerified) { setError('Please verify your email address via OTP first'); return; }
    if (!account.password) { setError('Password is required'); return; }
    if (account.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (account.password !== account.confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    setIsExistingUser(false);

    try {
      const payload = {
        name: account.name.trim(),
        email: account.email.trim().toLowerCase(),
        password: account.password,
        mobile: account.mobile ? account.mobile.trim().replace(/[^0-9]/g, '') : '',
        mandalName: mandalName.trim(),
        eventTypes: eventTypes.length > 0 ? eventTypes : ['Ganesh Utsav']
      };

      await register(payload);
      navigate('/');
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Registration failed';
      setError(msg);
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <img
            src="/logo.png"
            alt="Apla Mandal Logo"
            style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12, objectFit: 'contain', boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}
          />
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Apla<span style={{ color: 'var(--primary)' }}>Mandal</span>
          </div>
        </div>

        <h1 className="text-h1" style={{ marginBottom: 6 }}>Create your account</h1>
        <p className="text-sub" style={{ marginBottom: 24 }}>Set up your Apla Mandal workspace</p>

        {error && (
          <div style={{ padding: '14px 16px', background: isExistingUser ? '#FEF2F2' : 'rgba(239, 68, 68, 0.1)', border: isExistingUser ? '1px solid #FCA5A5' : '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, marginBottom: 20 }}>
            <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>{error}</div>
            {isExistingUser && (
              <div style={{ marginTop: 10 }}>
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
              <label>Your Name *</label>
              <input
                placeholder="e.g. Ramesh Sharma"
                value={account.name}
                onChange={e => setAccount({ ...account, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Mandal Name *</label>
              <input
                placeholder="e.g. Shree Ganesh Mandal"
                value={mandalName}
                onChange={e => setMandalName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Email Address *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                placeholder="president@yourmandal.com"
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSendOtp}
                  disabled={loading || otpSent}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {otpSent ? 'Sent ✓' : 'Send OTP'}
                </button>
              )}
              {otpVerified && (
                <div style={{ display: 'flex', alignItems: 'center', color: '#10B981', fontWeight: 700, padding: '0 8px', fontSize: 13.5 }}>
                  ✓ Verified
                </div>
              )}
            </div>
          </div>

          {otpSent && !otpVerified && (
            <div className="field" style={{ background: 'rgba(249, 115, 22, 0.05)', padding: 14, borderRadius: 12, border: '1px dashed #FDBA74' }}>
              <label style={{ color: 'var(--primary)', fontWeight: 700 }}>Enter 6-Digit Email OTP</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <input
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ flex: 1, letterSpacing: 4, fontWeight: 700, fontSize: 16 }}
                />
                <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label>Mobile Number (Optional)</label>
            <input
              placeholder="10-digit mobile number"
              value={account.mobile}
              onChange={e => setAccount({ ...account, mobile: e.target.value })}
              maxLength={10}
            />
          </div>

          {/* Festival Selection */}
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Festivals Managed (Max 3)</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{eventTypes.length}/3</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
              {EVENT_TYPES.map(ev => {
                const selected = eventTypes.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvent(ev.id)}
                    style={{
                      border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selected ? 'rgba(249, 115, 22, 0.08)' : '#FFFFFF',
                      borderRadius: 10,
                      padding: '8px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{ev.icon}</div>
                    <div style={{ marginTop: 2 }}>{language === 'mr' ? ev.labelMr : ev.labelEn}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Password *</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={account.password}
                onChange={e => setAccount({ ...account, password: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Confirm Password *</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={account.confirmPassword}
                onChange={e => setAccount({ ...account, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ padding: '15px', fontSize: 16, marginTop: 16 }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '24px 0 0', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>

        <div className="auth-footer" style={{ marginTop: 24 }}>
          By creating an account, you agree to our <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
