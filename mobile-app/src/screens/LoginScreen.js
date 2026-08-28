import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Keyboard
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';

export default function LoginScreen({ navigation, route }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState(route?.params?.prefillEmail || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [noAccount, setNoAccount] = useState(false); // true when email is not registered
  const { loginWithOtp } = useAuth();
  const { t } = useLanguage();
  const inputRefs = useRef([]);

  React.useEffect(() => {
    if (route?.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
      setError('');
    }
  }, [route?.params?.prefillEmail]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setError('');
    setNoAccount(false);
    Keyboard.dismiss();
    setLoading(true);

    try {
      await client.post('/auth/send-otp', { email: trimmedEmail });
      setStep('otp');
      startResendTimer();
    } catch (err) {
      if (err.response?.data?.code === 'USER_NOT_FOUND' || err.response?.status === 404) {
        // Email not registered — show inline prompt to Create Account
        setNoAccount(true);
        setError('');
      } else {
        setError(err.response?.data?.message || t('auth.failedToSendOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError(t('auth.enterSixDigitOtp')); return; }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    const trimmedEmail = (email || '').trim().toLowerCase();
    try {
      await loginWithOtp(trimmedEmail, code);
      // Navigation is seamlessly handled by RootNavigator with fade animation
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalidOtp'));
      setLoading(false);
    }
  };

  // ── OTP box input handler ─────────────────────────────────────
  const handleOtpChange = (text, index) => {
    const digits = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);
    if (digits && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
          <Text style={styles.title}>{t('nav.appTitle')}</Text>
          <Text style={styles.subtitle}>Mandal Management & Collector App</Text>
        </View>

        <View style={styles.formCard}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 'email' ? (
            <>
              <Text style={styles.stepTitle}>{t('auth.loginTitle')}</Text>
              <Text style={styles.stepLabel}>{t('auth.loginSubtitle')}</Text>

              {/* No Account Banner */}
              {noAccount && (
                <View style={styles.noAccountBanner}>
                  <Text style={styles.noAccountTitle}>{t('auth.accountNotFound')}</Text>
                  <Text style={styles.noAccountText}>
                    {t('auth.accountNotFoundDesc')}
                  </Text>
                  <TouchableOpacity
                    style={styles.createAccountBtn}
                    onPress={() => navigation.navigate('Register', { prefillEmail: email.trim() })}
                  >
                    <Text style={styles.createAccountBtnText}>{t('auth.createAccount')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (noAccount) setNoAccount(false);
                  if (error) setError('');
                }}
                autoFocus
              />
              <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading} activeOpacity={0.88}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>{t('auth.otpVerification')}</Text>
              <Text style={styles.stepLabel}>
                {t('auth.otpSubtitle', { email: '' })}{'\n'}
                <Text style={{ color: '#F97316', fontWeight: '800' }}>{email}</Text>
              </Text>

              {/* OTP Boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => inputRefs.current[i] = r}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={t => handleOtpChange(t, i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtp}
                disabled={loading || otp.join('').length < 6}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>{t('auth.verifyOtp')}</Text>
                }
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimer}>{t('auth.resendIn', { sec: resendTimer })}</Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={styles.resendLink}>{t('auth.resendOtp')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.backLink} onPress={() => { setStep('email'); setOtp(['','','','','','']); setError(''); }}>
                <Text style={styles.backText}>{t('auth.changeEmail')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>{t('auth.noAccountYet')} <Text style={styles.registerBold}>{t('auth.createAccount')}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F8F7F4' },
  brandHeader: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 84, height: 84, alignSelf: 'center', marginBottom: 14, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(249, 115, 22, 0.2)' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#172554', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#64748B', fontSize: 13.5, fontWeight: '500' },
  
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  stepTitle: { fontSize: 19, fontWeight: '800', color: '#172554', marginBottom: 6 },
  stepLabel: { color: '#64748B', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: '#172554', marginBottom: 6 },
  error: { color: '#DC2626', marginBottom: 14, textAlign: 'center', fontSize: 13, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, fontWeight: '600' },
  input: {
    backgroundColor: '#F8F7F4', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, padding: 14, marginBottom: 16, fontSize: 14.5, color: '#172554',
  },
  button: {
    backgroundColor: '#F97316', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15.5 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 44, height: 54, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E2E8F0', textAlign: 'center', fontSize: 22,
    fontWeight: '800', color: '#172554', backgroundColor: '#F8F7F4',
  },
  otpBoxFilled: { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.04)', color: '#F97316' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, alignItems: 'center' },
  resendText: { color: '#64748B', fontSize: 13.5 },
  resendLink: { color: '#F97316', fontWeight: '800', fontSize: 13.5 },
  resendTimer: { color: '#94A3B8', fontSize: 13.5, fontWeight: '600' },

  backLink: { alignItems: 'center', marginTop: 14 },
  backText: { color: '#64748B', fontSize: 13, fontWeight: '600' },

  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { color: '#64748B', fontSize: 14 },
  registerBold: { color: '#F97316', fontWeight: '800' },

  noAccountBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  noAccountTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  noAccountText: {
    fontSize: 12.5,
    color: '#991B1B',
    lineHeight: 18,
    marginBottom: 10,
  },
  createAccountBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  createAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
