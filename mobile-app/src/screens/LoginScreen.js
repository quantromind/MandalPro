import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Keyboard
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function LoginScreen({ navigation, route }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState(route?.params?.prefillEmail || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { loginWithOtp } = useAuth();
  const inputRefs = useRef([]);

  React.useEffect(() => {
    if (route?.params?.prefillEmail) {
      setEmail(route.params.prefillEmail);
      setError('');
    }
  }, [route?.params?.prefillEmail]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    Keyboard.dismiss();
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
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(email.trim(), code);
      // Navigation is seamlessly handled by RootNavigator with fade animation
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
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
          <Text style={styles.title}>Apla Mandal</Text>
          <Text style={styles.subtitle}>Mandal Management & Collector App</Text>
        </View>

        <View style={styles.formCard}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 'email' ? (
            <>
              <Text style={styles.stepTitle}>Sign In with OTP</Text>
              <Text style={styles.stepLabel}>Enter your registered email address to receive a 6-digit one-time password.</Text>
              
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="president@yourmandal.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
              <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading} activeOpacity={0.88}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Send OTP Code →</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.stepTitle}>Enter Verification Code</Text>
              <Text style={styles.stepLabel}>
                We sent a 6-digit code to{'\n'}
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
                <Text style={styles.backText}>← Change email address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>New mandal? <Text style={styles.registerBold}>Create account →</Text></Text>
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
});
