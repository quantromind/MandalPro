import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { loginWithOtp } = useAuth();
  const inputRefs = useRef([]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/send-otp', { email: email.trim() });
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check your email.');
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
    if (code.length < 6) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(email.trim(), code);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
        <Text style={styles.title}>MandalPro</Text>
        <Text style={styles.subtitle}>Mandal Management & Collector App</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 'email' ? (
          <>
            <Text style={styles.stepLabel}>Enter your email address to receive a one-time OTP verification code.</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoFocus
            />
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send OTP →</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.stepLabel}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: '#FF6B00', fontWeight: '700' }}>{email}</Text>
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
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Verify & Sign In →</Text>
              }
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive it? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.backLink} onPress={() => { setStep('email'); setOtp(['','','','','','']); setError(''); }}>
              <Text style={styles.backText}>← Change email</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>New mandal? <Text style={styles.registerBold}>Create account →</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8F8F6' },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 16, borderRadius: 16 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#FF6B00', marginBottom: 6 },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: 28, fontSize: 14 },
  stepLabel: { textAlign: 'center', color: '#374151', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  error: { color: '#ef4444', marginBottom: 14, textAlign: 'center', fontSize: 14, backgroundColor: 'rgba(239,68,68,0.08)', padding: 10, borderRadius: 8 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 15, color: '#17233C',
  },
  button: {
    backgroundColor: '#FF6B00', borderRadius: 12, padding: 15,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
  otpBox: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', textAlign: 'center', fontSize: 22,
    fontWeight: '700', color: '#17233C', backgroundColor: '#fff',
  },
  otpBoxFilled: { borderColor: '#FF6B00', backgroundColor: 'rgba(255,107,0,0.04)' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' },
  resendText: { color: '#6b7280', fontSize: 14 },
  resendLink: { color: '#FF6B00', fontWeight: '700', fontSize: 14 },
  resendTimer: { color: '#9CA3AF', fontSize: 14 },

  backLink: { alignItems: 'center', marginTop: 12 },
  backText: { color: '#6b7280', fontSize: 14 },

  registerLink: { marginTop: 36, alignItems: 'center' },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerBold: { color: '#FF6B00', fontWeight: '700' },
});
