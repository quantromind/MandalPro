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

  // Step 2 — Account
  const [name, setName]               = useState('');
  const [mobile, setMobile]           = useState('');
  const [password, setPassword]       = useState('');
  const [mandalName, setMandalName]   = useState('');

  // Step 3 — Event types
  const [eventTypes, setEventTypes]   = useState([]);

  const toggleEvent = (id) =>
    setEventTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── OTP ────────────────────────────────────────────
  const sendOtp = async () => {
    if (!email.includes('@')) { Alert.alert('Invalid', 'Enter a valid email address'); return; }
    setLoading(true);
    try {
      await client.post('/auth/send-otp', { email });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'Check your email for the verification code');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await client.post('/auth/verify-otp', { email, code: otp });
      setOtpVerified(true);
      setStep(2);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Invalid OTP');
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
      await register({ name, email, password, mobile, mandalName, eventTypes });
      // Navigation handled by RootNavigator based on auth state
    } catch (e) {
      Alert.alert('Registration Failed', e.response?.data?.message || 'Something went wrong');
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
            <Text style={s.title}>MandalPro</Text>
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
              <Text style={s.label}>Email Address</Text>
              <TextInput
                style={s.input}
                placeholder="president@mandal.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!otpVerified}
              />
              {!otpSent && (
                <TouchableOpacity style={s.btnPrimary} onPress={sendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP →</Text>}
                </TouchableOpacity>
              )}
              {otpSent && !otpVerified && (
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
              <Text style={s.cardTitle}>🎪 Event Types</Text>
              <Text style={s.hint}>Select all types your mandal organises</Text>
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

const PRIMARY = '#FF6B00';
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 48, height: 48, borderRadius: 10, marginBottom: 12 },
  title: { color: '#17233C', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  stepper: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dotText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  dotTextActive: { color: '#fff' },
  stepLabel: { color: '#6b7280', fontSize: 13 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { color: '#17233C', fontSize: 17, fontWeight: '700', marginBottom: 16 },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, color: '#17233C', fontSize: 15, marginBottom: 14 },
  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { color: '#6b7280', fontSize: 13, marginBottom: 14 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  eventCard: { width: '30%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, alignItems: 'center', gap: 4, position: 'relative' },
  eventCardSel: { borderColor: PRIMARY, backgroundColor: 'rgba(255,107,0,0.08)' },
  eventIcon: { fontSize: 24 },
  eventName: { color: '#4b5563', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  eventNameSel: { color: PRIMARY, fontWeight: '700' },
  eventCheck: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: PRIMARY, fontWeight: '700' },
});
