import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const EVENT_TYPES = [
  { id: 'Ganesh Utsav', icon: '🐘' },
  { id: 'Navratri',     icon: '🪔' },
  { id: 'Jayanti',      icon: '📿' },
  { id: 'Diwali',       icon: '✨' },
  { id: 'Wedding/Hall', icon: '💒' },
  { id: 'Custom',       icon: '⚙️' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);

  // Step 1 — Email + OTP
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [otpSent, setOtpSent]         = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existingUserMessage, setExistingUserMessage] = useState('');

  // Step 2 — Account
  const [name, setName]               = useState('');
  const [mobile, setMobile]           = useState('');
  const [password, setPassword]       = useState('');
  const [mandalName, setMandalName]   = useState('');
  const [eventTypes, setEventTypes]   = useState(['Ganesh Utsav']);

  const toggleEvent = (id) => {
    if (eventTypes.includes(id)) {
      setEventTypes(prev => prev.filter(x => x !== id));
    } else {
      if (eventTypes.length >= 3) {
        Alert.alert('Limit Reached', 'You can select up to 3 event types for your Mandal in this plan.');
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
        setExistingUserMessage('This email is already registered. Please sign in instead.');
        return true;
      }
      return false;
    } catch (err) {
      // 409 or any "already registered" error
      if (err.response?.status === 409 || err.response?.data?.message?.toLowerCase().includes('already registered')) {
        setIsExistingUser(true);
        setExistingUserMessage('This email is already registered. Please sign in instead.');
        return true;
      }
      return false;
    }
  };

  // ── OTP ────────────────────────────────────────────
  const sendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid', 'Enter a valid email address');
      return;
    }

    // ① Always check if the user already exists BEFORE sending OTP
    setLoading(true);
    setIsExistingUser(false);
    setExistingUserMessage('');
    const alreadyExists = await checkEmailExists(email);
    if (alreadyExists) {
      // Email is taken — show alert and stop here, don't send OTP
      setLoading(false);
      Alert.alert(
        'Account Already Registered',
        'An account with this email already exists. Please sign in to your existing account instead of creating a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Login →',
            onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() }),
          },
        ]
      );
      return;
    }

    // ② Email is free — send OTP
    try {
      await client.post('/auth/send-otp', { email: email.trim(), purpose: 'register' });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Check your email for the 6-digit verification code.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send OTP';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setExistingUserMessage('This email is already registered with Apla Mandal. Please sign in instead.');
        Alert.alert(
          'Account Already Registered',
          'An account with this email already exists. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Login →', onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() }) },
          ]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/verify-otp', { email: email.trim(), code: otp.trim(), purpose: 'register' });
      setOtpVerified(true);
      setStep(2);
    } catch (e) {
      const msg = e.response?.data?.message || 'Invalid OTP';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setIsExistingUser(true);
        setExistingUserMessage('This email is already registered with Apla Mandal. Please sign in instead.');
        Alert.alert(
          'Existing Account',
          'This email is already registered with Apla Mandal. Please sign in to your existing account.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Login →',
              onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() })
            }
          ]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally { setLoading(false); }
  };

  // ── Register ────────────────────────────────────────
  const handleRegister = async () => {
    if (!name || !email || !password || !mandalName) {
      Alert.alert('Missing fields', 'Please fill all fields'); return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      await register({ name, email: email.trim(), password, mobile, mandalName, eventTypes });
      // Navigation handled by RootNavigator based on auth state
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      if (e.response?.status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        Alert.alert(
          'Existing Account',
          'An account with this email is already registered. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Login →',
              onPress: () => navigation.navigate('Login', { prefillEmail: email.trim() })
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <Image source={require('../../assets/logo.jpg')} style={s.logo} />
            <Text style={s.title}>Apla Mandal</Text>
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
              {step === 1 ? 'Verify Email' : step === 2 ? 'Account Details' : 'Event Types'}
            </Text>
          </View>

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>✉️ Email Verification</Text>
              
              {isExistingUser && (
                <View style={s.existingBanner}>
                  <Text style={s.existingTitle}>⚠️ Account Already Registered</Text>
                  <Text style={s.existingText}>
                    An account with this email address already exists. Please sign in to your existing account.
                  </Text>
                  <TouchableOpacity
                    style={s.loginRedirectBtn}
                    onPress={() => navigation.navigate('Login', { prefillEmail: email.trim() })}
                  >
                    <Text style={s.loginRedirectBtnText}>Go to Login →</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={s.label}>Email Address</Text>
              <TextInput
                style={[s.input, isExistingUser && { borderColor: '#EF4444' }]}
                placeholder="president@mandal.com"
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
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP →</Text>}
                </TouchableOpacity>
              )}
              {otpSent && !otpVerified && !isExistingUser && (
                <>
                  <Text style={s.label}>Enter OTP</Text>
                  <TextInput
                    style={s.input} placeholder="123456" placeholderTextColor="#9ca3af"
                    keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp}
                  />
                  <TouchableOpacity style={s.btnPrimary} onPress={verifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify OTP</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── STEP 2: Account ── */}
          {step === 2 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>👤 Account Details</Text>
              {[
                { label: 'Your Name', value: name, setter: setName, placeholder: 'Ramesh Sharma' },
                { label: 'Mandal Name', value: mandalName, setter: setMandalName, placeholder: 'Shri Ganesh Mandal' },
                { label: 'Mobile Number (Optional)', value: mobile, setter: setMobile, placeholder: '9876543210', keyboard: 'phone-pad' },
                { label: 'Password', value: password, setter: setPassword, placeholder: '8+ characters', secure: true },
              ].map(field => (
                <View key={field.label}>
                  <Text style={s.label}>{field.label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="#9ca3af"
                    keyboardType={field.keyboard || 'default'}
                    secureTextEntry={field.secure}
                    value={field.value}
                    onChangeText={field.setter}
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <TouchableOpacity style={s.btnPrimary} onPress={() => setStep(3)}>
                <Text style={s.btnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Event Types ── */}
          {step === 3 && (
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.cardTitle}>🎪 Event Types</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: eventTypes.length === 3 ? '#FF6B00' : '#6b7280' }}>
                  {eventTypes.length}/3 selected
                </Text>
              </View>
              <Text style={s.hint}>Select up to 3 event types your mandal organizes</Text>
              <View style={s.eventGrid}>
                {EVENT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.eventCard, eventTypes.includes(t.id) && s.eventCardSel]}
                    onPress={() => toggleEvent(t.id)}
                  >
                    <Text style={s.eventIcon}>{t.icon}</Text>
                    <Text style={[s.eventName, eventTypes.includes(t.id) && s.eventNameSel]}>{t.id}</Text>
                    {eventTypes.includes(t.id) && <View style={s.eventCheck}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>✓</Text></View>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.btnPrimary} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create My Mandal 🎉</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Sign in link */}
          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign in</Text></Text>
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
});
