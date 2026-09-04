import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';

export default function LoginScreen({ navigation, route }) {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' | 'password'
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState(route?.params?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [noAccount, setNoAccount] = useState(false);

  const { loginWithOtp, login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const isMr = language === 'mr';
  const inputRefs = useRef([]);

  React.useEffect(() => {
    if (route?.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
      setError('');
    }
  }, [route?.params?.prefillEmail]);

  const toggleLanguage = () => {
    setLanguage(isMr ? 'en' : 'mr');
  };

  // ── Send OTP ──────────────────────────────────────────
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
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError(t('auth.enterSixDigitOtp'));
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    const trimmedEmail = (email || '').trim().toLowerCase();
    try {
      await loginWithOtp(trimmedEmail, code);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalidOtp'));
      setLoading(false);
    }
  };

  // ── Password Login ────────────────────────────────────
  const handlePasswordLogin = async () => {
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (!password) {
      setError(isMr ? 'कृपया पासवर्ड प्रविष्ट करा' : 'Please enter your password');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setLoading(true);

    try {
      await login(trimmedEmail, password);
    } catch (err) {
      setError(err.response?.data?.message || (isMr ? 'लॉगिन अयशस्वी झाले. ईमेल किंवा पासवर्ड तपासा.' : 'Login failed. Please check your email or password.'));
      setLoading(false);
    }
  };

  // ── OTP box input handler ─────────────────────────────
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Top Bar with Back & Language Switcher ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Welcome');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnArrow}>←</Text>
          <Text style={styles.backBtnText}>{isMr ? 'मागे' : 'Back'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langPill} onPress={toggleLanguage} activeOpacity={0.8}>
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>{isMr ? 'मराठी' : 'English'}</Text>
          <Text style={styles.langSub}>{isMr ? 'EN' : 'मराठी'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Header ── */}
          <View style={styles.brandHeader}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.title}>
              Apla<Text style={{ color: '#F97316' }}>Mandal</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isMr ? 'मंडळ व्यवस्थापन व वर्गणी पावती अ‍ॅप' : 'Mandal Management & Collector App'}
            </Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>
            {/* Mode Switcher Tabs */}
            {step === 'email' && (
              <View style={styles.modeTabs}>
                <TouchableOpacity
                  style={[styles.modeTab, authMode === 'otp' && styles.modeTabActive]}
                  onPress={() => {
                    setAuthMode('otp');
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, authMode === 'otp' && styles.modeTabTextActive]}>
                    🔑 {isMr ? 'OTP ने लॉगिन' : 'OTP Sign In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, authMode === 'password' && styles.modeTabActive]}
                  onPress={() => {
                    setAuthMode('password');
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, authMode === 'password' && styles.modeTabTextActive]}>
                    🔒 {isMr ? 'पासवर्ड ने लॉगिन' : 'Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* ── OPTION A: OTP FLOW ── */}
            {authMode === 'otp' ? (
              step === 'email' ? (
                <>
                  <Text style={styles.stepTitle}>{t('auth.loginTitle')}</Text>
                  <Text style={styles.stepLabel}>{t('auth.loginSubtitle')}</Text>

                  {noAccount && (
                    <View style={styles.noAccountBanner}>
                      <Text style={styles.noAccountTitle}>{t('auth.accountNotFound')}</Text>
                      <Text style={styles.noAccountText}>{t('auth.accountNotFoundDesc')}</Text>
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
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
                    )}
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
                        ref={(r) => (inputRefs.current[i] = r)}
                        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                        value={digit}
                        onChangeText={(val) => handleOtpChange(val, i)}
                        onKeyPress={(e) => handleOtpKeyPress(e, i)}
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
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{t('auth.verifyOtp')}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendRow}>
                    <Text style={styles.resendText}>
                      {isMr ? 'कोड मिळाला नाही? ' : "Didn't receive it? "}
                    </Text>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimer}>{t('auth.resendIn', { sec: resendTimer })}</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                        <Text style={styles.resendLink}>{t('auth.resendOtp')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => {
                      setStep('email');
                      setOtp(['', '', '', '', '', '']);
                      setError('');
                    }}
                  >
                    <Text style={styles.backText}>{t('auth.changeEmail')}</Text>
                  </TouchableOpacity>
                </>
              )
            ) : (
              /* ── OPTION B: PASSWORD LOGIN FLOW ── */
              <>
                <Text style={styles.stepTitle}>
                  {isMr ? 'पासवर्ड द्वारे लॉगिन करा' : 'Sign In with Password'}
                </Text>
                <Text style={styles.stepLabel}>
                  {isMr
                    ? 'तुमचा नोंदणीकृत ईमेल आणि पासवर्ड वापरून लॉगिन करा.'
                    : 'Enter your registered email and password.'}
                </Text>

                <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="president@yourmandal.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                />

                <Text style={styles.fieldLabel}>
                  {isMr ? 'पासवर्ड' : 'Password'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, { marginTop: 16 }]}
                  onPress={handlePasswordLogin}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isMr ? 'लॉगिन करा →' : 'Sign In →'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Register Link ── */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerText}>
              {t('auth.noAccountYet')}{' '}
              <Text style={styles.registerBold}>{t('auth.createAccount')}</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Legal Footer ── */}
          <View style={styles.legalFooter}>
            <Text style={styles.legalNotice}>
              {isMr ? 'लॉगिन करून आपण आमच्या ' : 'By continuing, you agree to our '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://aplamandal.quantromind.com/terms-and-conditions')}
              >
                {isMr ? 'नियम व अटी' : 'Terms & Conditions'}
              </Text>
              {isMr ? ' आणि ' : ' & '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://aplamandal.quantromind.com/privacy-policy')}
              >
                {isMr ? 'गोपनीयता धोरणाशी' : 'Privacy Policy'}
              </Text>
              {isMr ? ' सहमत आहात.' : '.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F7F4',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnArrow: {
    fontSize: 20,
    color: '#172554',
    fontWeight: '800',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172554',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  langIcon: {
    fontSize: 12,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  langSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F97316',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#F8F7F4',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 74,
    height: 74,
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    color: '#172554',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
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
    elevation: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#F97316',
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 4,
  },
  stepLabel: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 6,
  },
  error: {
    color: '#DC2626',
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 12.5,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
    fontSize: 14,
    color: '#172554',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingRight: 10,
    marginBottom: 6,
  },
  eyeBtn: {
    padding: 8,
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#172554',
    backgroundColor: '#F8F7F4',
  },
  otpBoxFilled: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    color: '#F97316',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: '#64748B',
    fontSize: 13,
  },
  resendLink: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 13,
  },
  resendTimer: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 14,
  },
  backText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#64748B',
    fontSize: 13.5,
  },
  registerBold: {
    color: '#F97316',
    fontWeight: '800',
  },
  noAccountBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  noAccountTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  noAccountText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
    marginBottom: 8,
  },
  createAccountBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  legalFooter: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  legalNotice: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: '#F97316',
    fontWeight: '700',
  },
});
