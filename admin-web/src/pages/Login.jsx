import { useState, useEffect } from 'react';
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

  // ── Forgot Password Flow State ──
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'password' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMr = language === 'mr';

  // ── OTP Resend Countdown Timer ──
  useEffect(() => {
    let interval = null;
    if (isForgotPassword && forgotStep === 'otp' && forgotCountdown > 0) {
      interval = setInterval(() => {
        setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isForgotPassword, forgotStep, forgotCountdown]);

  // ── Handlers for Standard Login ──
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

  // ── Handlers for Forgot Password Flow ──
  const handleStartForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotStep('email');
    setForgotEmail(email || '');
    setForgotOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccessMessage('');
  };

  const handleBackToSignIn = () => {
    setIsForgotPassword(false);
    setForgotStep('email');
    setAuthMode('password');
    if (forgotEmail) {
      setEmail(forgotEmail);
    }
    setPassword('');
    setForgotError('');
    setError('');
  };

  const handleForgotSendOtp = async (e) => {
    e?.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError(isMr ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा' : 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    setForgotError('');
    setForgotSuccessMessage('');

    try {
      try {
        await api.post('/auth/forgot-password/send-otp', {
          email: forgotEmail.trim().toLowerCase()
        });
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          // Fallback to /auth/send-otp if dedicated sub-route is not yet deployed on server
          await api.post('/auth/send-otp', {
            email: forgotEmail.trim().toLowerCase(),
            purpose: 'forgot-password'
          });
        } else {
          throw postErr;
        }
      }
      setForgotStep('otp');
      setForgotCountdown(60);
      setForgotOtp('');
      setForgotSuccessMessage(isMr ? 'पडताळणी कोड तुमच्या ईमेलवर पाठवला आहे.' : 'Verification code sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || (isMr ? 'OTP पाठवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.' : 'Failed to send OTP. Please try again.');
      setForgotError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    if (forgotCountdown > 0 || resendLoading) return;
    setResendLoading(true);
    setForgotError('');
    setForgotSuccessMessage('');

    try {
      try {
        await api.post('/auth/forgot-password/send-otp', {
          email: forgotEmail.trim().toLowerCase()
        });
      } catch (postErr) {
        if (postErr.response?.status === 404) {
          await api.post('/auth/send-otp', {
            email: forgotEmail.trim().toLowerCase(),
            purpose: 'forgot-password'
          });
        } else {
          throw postErr;
        }
      }
      setForgotCountdown(60);
      setForgotSuccessMessage(isMr ? 'नवीन पडताळणी कोड पाठवला आहे.' : 'A new verification code has been sent.');
    } catch (err) {
      const msg = err.response?.data?.message || (isMr ? 'OTP पुन्हा पाठवण्यात अयशस्वी.' : 'Failed to resend OTP.');
      setForgotError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length < 6) {
      setForgotError(isMr ? 'कृपया ६ अंकी OTP प्रविष्ट करा' : 'Please enter 6-digit OTP');
      return;
    }
    setLoading(true);
    setForgotError('');
    setForgotSuccessMessage('');

    try {
      let resetTokenVal = '';
      try {
        const { data } = await api.post('/auth/forgot-password/verify-otp', {
          email: forgotEmail.trim().toLowerCase(),
          code: forgotOtp.trim()
        });
        resetTokenVal = data.resetToken;
      } catch (verifyErr) {
        if (verifyErr.response?.status === 404) {
          // Fallback to /auth/verify-otp if sub-route is 404
          const { data } = await api.post('/auth/verify-otp', {
            email: forgotEmail.trim().toLowerCase(),
            code: forgotOtp.trim()
          });
          resetTokenVal = data.resetToken || 'verified_otp_session';
        } else {
          throw verifyErr;
        }
      }
      setResetToken(resetTokenVal);
      setForgotStep('password');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || (isMr ? 'अवैध OTP कोड. कृपया तपासा.' : 'Invalid OTP code. Please check again.');
      setForgotError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 8) {
      setForgotError(isMr ? 'पासवर्ड किमान ८ अक्षरांचा असावा' : 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError(isMr ? 'दोन्ही पासवर्ड जुळत नाहीत' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    setForgotError('');

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword
      });
      setForgotStep('success');
    } catch (err) {
      const msg = err.response?.data?.message || (isMr ? 'पासवर्ड रीसेट अयशस्वी. कृपया पुन्हा प्रयत्न करा.' : 'Failed to reset password. Please try again.');
      setForgotError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Password Strength Evaluation ──
  const hasMinLength = newPassword.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  let strengthScore = 0;
  if (newPassword.length > 0) {
    if (hasMinLength) strengthScore += 1;
    if (hasLetter) strengthScore += 1;
    if (hasNumberOrSymbol) strengthScore += 1;
  }

  const isPasswordFormValid = hasMinLength && hasNumberOrSymbol && hasLetter && passwordsMatch;

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

        {/* ═════════════════════════════════════════════════════════════════
            VIEW A: STANDARD LOGIN (OTP SIGN IN & PASSWORD SIGN IN)
            ═════════════════════════════════════════════════════════════════ */}
        {!isForgotPassword ? (
          <>
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
                <div className="field" style={{ marginBottom: 16 }}>
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

                {/* Small Professional Forgot Password Link */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={handleStartForgotPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F97316',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'none',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {isMr ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                  </button>
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
          </>
        ) : (
          /* ═════════════════════════════════════════════════════════════════
             VIEW B: FORGOT PASSWORD MULTI-STEP FLOW
             ═════════════════════════════════════════════════════════════════ */
          <div>
            {/* Step 1: Registered Email */}
            {forgotStep === 'email' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#EA580C',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 10
                  }}>
                    🔐 {isMr ? 'टप्पा १ / ३: ईमेल' : 'Step 1 of 3: Email'}
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172554', margin: '0 0 6px' }}>
                    {isMr ? 'पासवर्ड रीसेट करा' : 'Reset Your Password'}
                  </h1>
                  <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    {isMr
                      ? 'पडताळणी कोड मिळवण्यासाठी तुमचा नोंदणीकृत ईमेल पत्ता प्रविष्ट करा.'
                      : 'Enter your registered email address to receive an OTP verification code.'}
                  </p>
                </div>

                {forgotError && (
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
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSendOtp}>
                  <div className="field" style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      {t('auth.emailLabel')} (ईमेल पत्ता)
                    </label>
                    <input
                      type="email"
                      placeholder="president@yourmandal.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
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
                    style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : (isMr ? 'OTP पाठवा →' : 'Send OTP →')}
                  </button>
                </form>

                {/* Back to Sign In button */}
                <div style={{ textAlign: 'center', marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <span>←</span>
                    <span>{isMr ? 'लॉगिनकडे परत जा' : 'Back to Sign In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {forgotStep === 'otp' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#EA580C',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 10
                  }}>
                    📨 {isMr ? 'टप्पा २ / ३: पडताळणी' : 'Step 2 of 3: OTP Verification'}
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172554', margin: '0 0 6px' }}>
                    {isMr ? 'OTP पडताळणी करा' : 'Verify OTP Code'}
                  </h1>
                  <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    {isMr ? 'तुमच्या ईमेलवर पाठवलेला ६ अंकी OTP प्रविष्ट करा' : 'Enter the OTP sent to your email'}
                  </p>
                </div>

                {/* Sent to email chip */}
                <div style={{
                  background: 'rgba(249, 115, 22, 0.08)',
                  padding: '12px 14px',
                  borderRadius: 12,
                  marginBottom: 18,
                  border: '1px dashed #FDBA74',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {forgotEmail}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForgotStep('email'); setForgotError(''); setForgotSuccessMessage(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F97316',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      padding: 0,
                      whiteSpace: 'nowrap',
                      marginLeft: 10,
                      textDecoration: 'underline'
                    }}
                  >
                    {isMr ? 'ईमेल बदला' : 'Change'}
                  </button>
                </div>

                {forgotSuccessMessage && (
                  <div style={{
                    padding: '10px 14px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>✓</span>
                    <span>{forgotSuccessMessage}</span>
                  </div>
                )}

                {forgotError && (
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
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotVerifyOtp}>
                  <div className="field" style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      {isMr ? 'OTP कोड प्रविष्ट करा' : 'Enter 6-digit OTP'}
                    </label>
                    <input
                      type="text"
                      placeholder="••••••"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
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
                    style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                    disabled={loading || forgotOtp.length < 6}
                  >
                    {loading ? t('common.loading') : (isMr ? 'OTP पडताळणी करा →' : 'Verify OTP →')}
                  </button>
                </form>

                {/* Resend OTP with Professional Countdown */}
                <div style={{
                  marginTop: 18,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13
                }}>
                  {forgotCountdown > 0 ? (
                    <span style={{ color: '#64748B', fontWeight: 600 }}>
                      ⏱️ {isMr ? `${forgotCountdown} सेकंदात पुन्हा पाठवा` : `Resend OTP in ${forgotCountdown}s`}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotResendOtp}
                      disabled={resendLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F97316',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: resendLoading ? 'not-allowed' : 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {resendLoading ? (isMr ? 'पाठवत आहे...' : 'Sending...') : (isMr ? 'पुन्हा OTP पाठवा' : 'Resend OTP')}
                    </button>
                  )}
                </div>

                {/* Back to Sign In */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <span>←</span>
                    <span>{isMr ? 'लॉगिनकडे परत जा' : 'Back to Sign In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Create New Password */}
            {forgotStep === 'password' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: '#EA580C',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 10
                  }}>
                    🛡️ {isMr ? 'टप्पा ३ / ३: नवीन पासवर्ड' : 'Step 3 of 3: New Password'}
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172554', margin: '0 0 6px' }}>
                    {isMr ? 'नवीन पासवर्ड तयार करा' : 'Create New Password'}
                  </h1>
                  <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    {isMr ? 'तुमच्या खात्यासाठी किमान ८ अक्षरांचा मजबूत पासवर्ड सेट करा' : 'Set a strong password with at least 8 characters'}
                  </p>
                </div>

                {forgotError && (
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
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  {/* New Password field with visibility toggle */}
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      {isMr ? 'नवीन पासवर्ड' : 'New Password'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '12px 42px 12px 16px',
                          borderRadius: 12,
                          border: '1.5px solid #CBD5E1',
                          fontSize: 14.5,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748B',
                          fontSize: 16,
                          padding: 4
                        }}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Bar & Indicators */}
                  {newPassword.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 4, height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{
                          flex: 1,
                          background: strengthScore >= 1 ? (strengthScore === 1 ? '#EF4444' : strengthScore === 2 ? '#F59E0B' : '#10B981') : '#E2E8F0',
                          transition: 'background 0.3s'
                        }} />
                        <div style={{
                          flex: 1,
                          background: strengthScore >= 2 ? (strengthScore === 2 ? '#F59E0B' : '#10B981') : '#E2E8F0',
                          transition: 'background 0.3s'
                        }} />
                        <div style={{
                          flex: 1,
                          background: strengthScore >= 3 ? '#10B981' : '#E2E8F0',
                          transition: 'background 0.3s'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B' }}>
                        <span>
                          {strengthScore === 1 && <span style={{ color: '#EF4444', fontWeight: 700 }}>{isMr ? 'कमकुवत (Weak)' : 'Weak'}</span>}
                          {strengthScore === 2 && <span style={{ color: '#F59E0B', fontWeight: 700 }}>{isMr ? 'मध्यम (Medium)' : 'Medium'}</span>}
                          {strengthScore === 3 && <span style={{ color: '#10B981', fontWeight: 700 }}>{isMr ? 'मजबूत (Strong) ✓' : 'Strong ✓'}</span>}
                        </span>
                        <span>{isMr ? 'किमान ८ अक्षरे व १ अंक/चिन्ह' : 'Min 8 chars & 1 number/symbol'}</span>
                      </div>
                    </div>
                  )}

                  {/* Confirm New Password field with visibility toggle */}
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      {isMr ? 'नवीन पासवर्डची पुष्टी करा' : 'Confirm New Password'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 42px 12px 16px',
                          borderRadius: 12,
                          border: `1.5px solid ${confirmPassword ? (passwordsMatch ? '#10B981' : '#EF4444') : '#CBD5E1'}`,
                          fontSize: 14.5,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748B',
                          fontSize: 16,
                          padding: 4
                        }}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>

                    {/* Match confirmation text */}
                    {confirmPassword.length > 0 && (
                      <div style={{
                        marginTop: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: passwordsMatch ? '#059669' : '#DC2626'
                      }}>
                        {passwordsMatch
                          ? (isMr ? '✓ पासवर्ड जुळतात' : '✓ Passwords match')
                          : (isMr ? '⚠️ दोन्ही पासवर्ड जुळत नाहीत' : '⚠️ Passwords do not match')}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: 15,
                      borderRadius: 12,
                      marginTop: 10,
                      opacity: !isPasswordFormValid ? 0.6 : 1,
                      cursor: !isPasswordFormValid ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || !isPasswordFormValid}
                  >
                    {loading ? t('common.loading') : (isMr ? 'पासवर्ड रीसेट करा →' : 'Reset Password →')}
                  </button>
                </form>

                {/* Back to Sign In */}
                <div style={{ textAlign: 'center', marginTop: 18 }}>
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <span>←</span>
                    <span>{isMr ? 'लॉगिनकडे परत जा' : 'Back to Sign In'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Password Reset Success */}
            {forgotStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 18px',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)'
                }}>
                  ✓
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172554', margin: '0 0 8px' }}>
                  {isMr ? 'पासवर्ड यशस्वीरित्या बदलला!' : 'Password Reset Successfully!'}
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
                  {isMr
                    ? 'तुमचा पासवर्ड अपडेट करण्यात आला आहे. आता तुम्ही तुमच्या नवीन पासवर्डने सुरक्षितपणे लॉगिन करू शकता.'
                    : 'Your password has been changed. You can now sign in to your account with your new password.'}
                </p>

                <button
                  type="button"
                  onClick={handleBackToSignIn}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                >
                  {isMr ? 'साइन इनकडे परत जा →' : 'Back to Sign In →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Legal Links */}
        <div style={{ marginTop: 24, fontSize: 12, textAlign: 'center', color: '#94A3B8' }}>
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
