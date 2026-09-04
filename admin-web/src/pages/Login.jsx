import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function Login() {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMr = language === 'mr';

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      setError(isMr ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा' : 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { email: email.trim().toLowerCase(), purpose: 'login' });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || (isMr ? 'OTP पाठवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.' : 'Failed to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLogin = async (e) => {
    e?.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError(isMr ? 'कृपया ६ अंकी OTP प्रविष्ट करा' : 'Please enter 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login-otp', {
        email: email.trim().toLowerCase(),
        code: otp.trim()
      });
      localStorage.setItem('mandalpro_token', data.token);
      localStorage.setItem('mandalpro_user', JSON.stringify(data.user));
      if (data.mandal) localStorage.setItem('mandalpro_mandal', JSON.stringify(data.mandal));

      if (data.user?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || (isMr ? 'अवैध OTP. कृपया पुन्हा तपासा.' : 'Invalid OTP. Please check again.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError(isMr ? 'ईमेल आणि पासवर्ड आवश्यक आहे' : 'Email and password required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res?.user?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || (isMr ? 'लॉगिन अयशस्वी. ईमेल किंवा पासवर्ड तपासा.' : 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{
      background: '#0B1120',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '24px'
    }}>
      {/* Top Floating Controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 24,
        right: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20
      }}>
        {/* Back to Home / Landing */}
        <Link
          to="/"
          style={{
            color: '#CBD5E1',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
        >
          <span>←</span>
          <span>{isMr ? 'मुख्यपृष्ठ (Home)' : 'Back to Home'}</span>
        </Link>

        {/* Language Toggle */}
        <button
          className="btn-lang-toggle"
          onClick={() => setLanguage(language === 'mr' ? 'en' : 'mr')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#FFFFFF',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span>🌐</span> {isMr ? 'English' : 'मराठी'}
        </button>
      </div>

      {/* Main Auth Card */}
      <div className="auth-card" style={{
        maxWidth: 460,
        width: '100%',
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '36px 32px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        marginTop: 40
      }}>
        {/* Logo & Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="Apla Mandal Logo"
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                objectFit: 'contain',
                boxShadow: '0 6px 16px rgba(249, 115, 22, 0.25)',
                background: '#FFFFFF',
                padding: 2
              }}
            />
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#172554', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Apla<span style={{ color: '#F97316' }}>Mandal</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                Apla Mandal Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Headline & Description */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172554', margin: '0 0 6px' }}>
            {isMr ? 'मंडळात लॉगिन करा' : 'Sign in to Your Mandal'}
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            {isMr ? 'वर्गणी, डिजिटल पावत्या, खर्च व समिती संवाद व्यवस्थापन' : 'Manage collections, receipts, expenses & committee chat'}
          </p>
        </div>

        {/* Segmented Auth Mode Tabs */}
        <div className="tab-pill-group" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`tab-pill ${authMode === 'otp' ? 'active' : ''}`}
            onClick={() => { setAuthMode('otp'); setError(''); }}
          >
            📱 {isMr ? 'OTP द्वारे लॉगिन' : 'OTP Sign In'}
          </button>
          <button
            type="button"
            className={`tab-pill ${authMode === 'password' ? 'active' : ''}`}
            onClick={() => { setAuthMode('password'); setError(''); }}
          >
            🔑 {isMr ? 'पासवर्ड' : 'Password'}
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 600,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── OTP Sign In Flow ── */}
        {authMode === 'otp' ? (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="field" style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {t('auth.emailLabel')} (ईमेल पत्ता)
                  </label>
                  <input
                    type="email"
                    placeholder="president@yourmandal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14.5,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12, marginTop: 6 }}
                  disabled={loading}
                >
                  {loading ? t('common.loading') : (isMr ? 'OTP पाठवा →' : 'Send OTP →')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpLogin}>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.08)',
                  padding: '14px',
                  borderRadius: 12,
                  marginBottom: 18,
                  border: '1px dashed #FDBA74'
                }}>
                  <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                    {isMr ? `६ अंकी कोड पाठवला: ${email}` : `6-digit code sent to: ${email}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F97316',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: 4,
                      textDecoration: 'underline'
                    }}
                  >
                    {isMr ? 'ईमेल बदला (Change email)' : 'Change email'}
                  </button>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {isMr ? 'OTP कोड प्रविष्ट करा (Enter OTP)' : 'Enter 6-digit OTP'}
                  </label>
                  <input
                    type="text"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 20,
                      letterSpacing: 8,
                      fontWeight: 800,
                      textAlign: 'center',
                      outline: 'none'
                    }}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12, marginTop: 6 }}
                  disabled={loading}
                >
                  {loading ? t('common.loading') : (isMr ? '✓ पडताळणी करून लॉगिन करा' : '✓ Verify & Sign In')}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── Password Sign In Flow ── */
          <form onSubmit={handlePasswordLogin}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                {t('auth.emailLabel')} (ईमेल पत्ता)
              </label>
              <input
                type="email"
                placeholder="president@yourmandal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14.5,
                  outline: 'none'
                }}
              />
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                {isMr ? 'पासवर्ड (Password)' : 'Password'}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14.5,
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12, marginTop: 6 }}
              disabled={loading}
            >
              {loading ? t('common.loading') : (isMr ? 'लॉगिन करा →' : 'Sign In →')}
            </button>
          </form>
        )}

        {/* Register Callout */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid #E2E8F0',
          fontSize: 14,
          color: '#64748B'
        }}>
          {isMr ? 'नवीन मंडळ आहे?' : "Don't have an account yet?"}{' '}
          <Link to="/register" style={{ color: '#F97316', fontWeight: 800, textDecoration: 'none' }}>
            {isMr ? 'मोफत नोंदणी करा →' : 'Register Mandal Free →'}
          </Link>
        </div>

        {/* Footer Legal Links */}
        <div style={{ marginTop: 18, fontSize: 12, textAlign: 'center', color: '#94A3B8' }}>
          By continuing, you agree to our{' '}
          <Link to="/terms-and-conditions" style={{ color: '#64748B', textDecoration: 'underline' }}>Terms</Link>
          {' '}&amp;{' '}
          <Link to="/privacy-policy" style={{ color: '#64748B', textDecoration: 'underline' }}>Privacy Policy</Link>
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#94A3B8' }}>
            Powered by{' '}
            <a
              href="https://quantromind.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#F97316', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Quantromind Pvt Ltd
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
