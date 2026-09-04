import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';

const EVENT_TYPES = [
  { id: 'Ganesh Utsav', icon: '🐘' },
  { id: 'Navratri',     icon: '🪔' },
  { id: 'Jayanti',      icon: '📿' },
  { id: 'Diwali',       icon: '✨' },
  { id: 'Wedding/Hall', icon: '💒' },
  { id: 'Custom',       icon: '⚙️' },
];

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const isMr = language === 'mr';
  const toggleLanguage = () => setLanguage(isMr ? 'en' : 'mr');

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);

  // Step 1 — Email + OTP
  const [email, setEmail]             = useState(route?.params?.prefillEmail || '');
  const [otp, setOtp]                 = useState('');
  const [otpSent, setOtpSent]         = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserMessage, setExistingUserMessage] = useState('');

  // Step 2 — Account
  const [name, setName]               = useState('');
  const [mobile, setMobile]           = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mandalName, setMandalName]   = useState('');
  const [eventTypes, setEventTypes]   = useState(['Ganesh Utsav']);
  const [errors, setErrors]           = useState({});

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep2 = () => {
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedMandal = mandalName.trim();
    const cleanMobile = mobile.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      newErrors.name = t('register.errors.nameRequired');
    } else if (trimmedName.length < 2) {
      newErrors.name = t('register.errors.nameMin');
    }

    if (!trimmedMandal) {
      newErrors.mandalName = t('register.errors.mandalRequired');
    } else if (trimmedMandal.length < 3) {
      newErrors.mandalName = t('register.errors.mandalMin');
    }

    if (mobile.trim() && cleanMobile.length !== 10) {
      newErrors.mobile = t('register.errors.mobileInvalid');
    }

    if (!password) {
      newErrors.password = t('register.errors.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('register.errors.passwordMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep2Continue = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const toggleEvent = (id) => {
    if (eventTypes.includes(id)) {
      if (eventTypes.length === 1) {
        Alert.alert(t('register.selectionRequired'), t('register.keepOneEvent'));
        return;
      }
      setEventTypes(prev => prev.filter(x => x !== id));
    } else {
      if (eventTypes.length >= 3) {
        Alert.alert(t('register.limitReached'), t('register.maxThreeEvents'));
        return;
      }
      setEventTypes(prev => [...prev, id]);
    }
  };

  // Check if an email is already registered (returns true if exists)
  const checkEmailExists = async (emailToCheck) => {
    const trimmed = (emailToCheck || '').trim();
    if (!trimmed || !trimmed.includes('@') || trimmed.length < 5) return false;
    try {
      const res = await client.post('/auth/check-email', { email: trimmed });
      if (res.data?.exists) {
        setIsExistingUser(true);
        setExistingUserMessage(t('register.accountExistsAlert'));
        return true;
      }
      return false;
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.message?.toLowerCase().includes('already registered')) {
        setIsExistingUser(true);
        setExistingUserMessage(t('register.accountExistsAlert'));
        return true;
      }
      return false;
    }
  };

  // ── OTP ────────────────────────────────────────────
  const sendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    setIsExistingUser(false);
    setExistingUserMessage('');
    const alreadyExists = await checkEmailExists(email);
    if (alreadyExists) {
      setLoading(false);
      Alert.alert(
        t('register.accountExists'),
        t('register.accountExistsAlert'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('register.goToLogin'),
            onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() }),
          },
        ]
      );
      return;
    }

    try {
      await client.post('/auth/send-otp', { email: email.trim(), purpose: 'register' });
      setOtpSent(true);
      Alert.alert(t('auth.otpVerification'), t('auth.otpSubtitle', { email: email.trim() }));
    } catch (e) {
      const msg = e.response?.data?.message || t('auth.failedToSendOtp');
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setExistingUserMessage(t('register.accountExistsAlert'));
        Alert.alert(
          t('register.accountExists'),
          t('register.accountExistsAlert'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('register.goToLogin'), onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() }) },
          ]
        );
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      Alert.alert(t('common.error'), t('auth.enterSixDigitOtp'));
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/verify-otp', { email: email.trim(), code: otp.trim(), purpose: 'register' });
      setOtpVerified(true);
      setStep(2);
    } catch (e) {
      const msg = e.response?.data?.message || t('auth.invalidOtp');
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setExistingUserMessage(t('register.accountExistsAlert'));
        Alert.alert(
          t('register.accountExists'),
          t('register.accountExistsAlert'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('register.goToLogin'),
              onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() })
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally { setLoading(false); }
  };

  // ── Register ────────────────────────────────────────
  const handleRegister = async () => {
    if (!validateStep2()) {
      setStep(2);
      Alert.alert(t('common.error'), t('register.errors.fillAllFields'));
      return;
    }
    if (!eventTypes || eventTypes.length === 0) {
      Alert.alert(t('register.selectionRequired'), t('register.keepOneEvent'));
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: mobile.trim() ? mobile.replace(/[^0-9]/g, '') : undefined,
        mandalName: mandalName.trim(),
        eventTypes
      });
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        Alert.alert(
          t('register.accountExists'),
          t('register.accountExistsAlert'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('register.goToLogin'),
              onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() })
            }
          ]
        );
      } else {
        Alert.alert(t('common.error'), msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Top Navigation Bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Welcome');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={s.backBtnArrow}>←</Text>
          <Text style={s.backBtnText}>{isMr ? 'मागे' : 'Back'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.langPill} onPress={toggleLanguage} activeOpacity={0.8}>
          <Text style={s.langIcon}>🌐</Text>
          <Text style={s.langText}>{isMr ? 'मराठी' : 'English'}</Text>
          <Text style={s.langSub}>{isMr ? 'EN' : 'मराठी'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <Image source={require('../../assets/logo.png')} style={s.logo} />
            <Text style={s.title}>{t('nav.appTitle')}</Text>
            <View style={s.stepper}>
              {[1,2,3].map(n => (
                <View key={n} style={[s.dot, step === n && s.dotActive, step > n && s.dotDone]}>
                  <Text style={[s.dotText, (step === n || step > n) && s.dotTextActive]}>
                    {step > n ? '✓' : n}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={s.stepLabel}>
              {step === 1 ? t('register.verifyEmail') : step === 2 ? t('register.accountDetails') : t('register.eventTypes')}
            </Text>
          </View>

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>✉️ {t('register.emailVerification')}</Text>
              
              {isExistingUser && (
                <View style={s.existingBanner}>
                  <Text style={s.existingTitle}>⚠️ {t('register.accountExists')}</Text>
                  <Text style={s.existingText}>
                    {t('register.accountExistsAlert')}
                  </Text>
                  <TouchableOpacity
                    style={s.loginRedirectBtn}
                    onPress={() => navigation.navigate('Login', { prefillEmail: email.trim() })}
                  >
                    <Text style={s.loginRedirectBtnText}>{t('register.goToLogin')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.label}>{t('auth.emailLabel')}</Text>
              <TextInput
                style={[s.input, isExistingUser && { borderColor: '#EF4444' }]}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onBlur={() => checkEmailExists(email)}
                onChangeText={(text) => {
                  setEmail(text);
                  if (isExistingUser) {
                    setIsExistingUser(false);
                    setExistingUserMessage('');
                  }
                }}
                editable={!otpVerified}
              />
              {!otpSent && !isExistingUser && (
                <TouchableOpacity style={s.btnPrimary} onPress={sendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{t('auth.sendOtp')}</Text>}
                </TouchableOpacity>
              )}
              {otpSent && !otpVerified && !isExistingUser && (
                <>
                  <Text style={s.label}>{t('auth.otpVerification')}</Text>
                  <TextInput
                    style={s.input} placeholder="123456" placeholderTextColor="#9ca3af"
                    keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp}
                  />
                  <TouchableOpacity style={s.btnPrimary} onPress={verifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{t('auth.verifyOtp')}</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── STEP 2: Account Details ── */}
          {step === 2 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>👤 {t('register.accountDetails')}</Text>

              {/* Your Name */}
              <Text style={s.label}>{t('register.yourName')} *</Text>
              <TextInput
                style={[s.input, errors.name && s.inputError]}
                placeholder={t('register.yourNamePlaceholder')}
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError('name');
                }}
                autoCapitalize="words"
              />
              {errors.name ? <Text style={s.errorText}>⚠️ {errors.name}</Text> : null}

              {/* Mandal Name */}
              <Text style={s.label}>{t('register.mandalName')} *</Text>
              <TextInput
                style={[s.input, errors.mandalName && s.inputError]}
                placeholder={t('register.mandalNamePlaceholder')}
                placeholderTextColor="#9ca3af"
                value={mandalName}
                onChangeText={(text) => {
                  setMandalName(text);
                  clearError('mandalName');
                }}
                autoCapitalize="words"
              />
              {errors.mandalName ? <Text style={s.errorText}>⚠️ {errors.mandalName}</Text> : null}

              {/* Mobile */}
              <Text style={s.label}>{t('register.mobileOptional')}</Text>
              <TextInput
                style={[s.input, errors.mobile && s.inputError]}
                placeholder={t('register.mobilePlaceholder')}
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text.replace(/[^0-9]/g, ''));
                  clearError('mobile');
                }}
              />
              {errors.mobile ? <Text style={s.errorText}>⚠️ {errors.mobile}</Text> : null}

              {/* Password */}
              <Text style={s.label}>{t('register.password')} *</Text>
              <View style={s.passwordWrapper}>
                <TextInput
                  style={[s.input, s.passwordInput, errors.password && s.inputError]}
                  placeholder={t('register.passwordPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError('password');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={s.togglePassBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={s.togglePassText}>{showPassword ? t('register.hide') : t('register.show')}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.errorText}>⚠️ {errors.password}</Text> : null}

              <TouchableOpacity style={s.btnPrimary} onPress={handleStep2Continue}>
                <Text style={s.btnText}>{t('register.continueToEvents')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Event Types ── */}
          {step === 3 && (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardTitle}>🎪 {t('register.eventTypes')}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: eventTypes.length === 3 ? '#FF6B00' : '#6b7280' }}>
                  {t('register.selectedCount', { count: eventTypes.length })}
                </Text>
              </View>
              <Text style={s.hint}>{t('register.selectUpToThree')}</Text>
              <View style={s.eventGrid}>
                {EVENT_TYPES.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.eventCard, eventTypes.includes(item.id) && s.eventCardSel]}
                    onPress={() => toggleEvent(item.id)}
                  >
                    <Text style={s.eventIcon}>{item.icon}</Text>
                    <Text style={[s.eventName, eventTypes.includes(item.id) && s.eventNameSel]}>
                      {t(`events.types.${item.id}`) || item.id}
                    </Text>
                    {eventTypes.includes(item.id) && <View style={s.eventCheck}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>✓</Text></View>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.btnPrimary} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{t('register.createMyMandal')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={s.backStepBtn} onPress={() => setStep(2)}>
                <Text style={s.backStepText}>{t('register.editAccountDetails')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign in link */}
          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
            <Text style={s.linkText}>{t('register.alreadyHaveAccount')} <Text style={s.linkBold}>{t('register.signIn')}</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#F97316';
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { padding: 20, paddingTop: 30, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(249, 115, 22, 0.2)' },
  title: { color: '#172554', fontSize: 26, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  stepper: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  dot: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dotText: { color: '#94A3B8', fontSize: 13, fontWeight: '800' },
  dotTextActive: { color: '#FFFFFF' },
  stepLabel: { color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    marginBottom: 16,
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  cardTitle: { color: '#172554', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { color: '#172554', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    color: '#172554',
    fontSize: 14.5,
    marginBottom: 14
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4
  },
  btnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  hint: { color: '#64748B', fontSize: 13, marginBottom: 14 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  eventCard: {
    width: '30%',
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    position: 'relative'
  },
  eventCardSel: { borderColor: PRIMARY, backgroundColor: 'rgba(249, 115, 22, 0.08)' },
  eventIcon: { fontSize: 26 },
  eventName: { color: '#475569', fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  eventNameSel: { color: PRIMARY, fontWeight: '800' },
  eventCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center'
  },
  link: { alignItems: 'center', marginTop: 10 },
  linkText: { color: '#64748B', fontSize: 14 },
  linkBold: { color: PRIMARY, fontWeight: '800' },
  existingBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  existingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  existingText: {
    fontSize: 12.5,
    color: '#991B1B',
    lineHeight: 18,
    marginBottom: 10,
  },
  loginRedirectBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  loginRedirectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 2,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  togglePassBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  togglePassText: {
    color: PRIMARY,
    fontWeight: '800',
    fontSize: 12.5,
  },
  backStepBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  backStepText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F6',
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
});
