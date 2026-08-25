import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import client from '../api/client';
import { queueDonation } from '../utils/offlineQueue';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

const MODES = ['cash', 'upi', 'card'];
const QUICK_AMOUNTS = [100, 250, 500, 1000, 2100, 5100];

export default function CollectionScreen({ navigation }) {
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  const { mandal, user } = useAuth();

  const validate = () => {
    const errs = {};

    // Donor Name validation
    const trimmedName = donorName.trim();
    if (!trimmedName) {
      errs.donorName = 'Donor name is required';
    } else if (trimmedName.length < 2) {
      errs.donorName = 'Donor name must be at least 2 characters';
    }

    // Donor Mobile validation (optional, but if provided must be valid 10 digits)
    const cleanMobile = donorMobile.trim();
    if (cleanMobile) {
      if (!/^\d{10}$/.test(cleanMobile)) {
        errs.donorMobile = 'Mobile number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.donorMobile = 'Mobile number must start with 6, 7, 8, or 9';
      }
    }

    // Amount validation
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) {
      errs.amount = 'Amount is required';
    } else if (numAmount <= 0) {
      errs.amount = 'Amount must be greater than ₹0';
    } else if (numAmount > 10000000) {
      errs.amount = 'Amount exceeds maximum limit';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleMobileChange = (text) => {
    // Only allow numbers and limit to 10 digits
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setDonorMobile(cleaned);
    if (errors.donorMobile) {
      setErrors(prev => ({ ...prev, donorMobile: null }));
    }
  };

  const handleAmountChange = (text) => {
    // Only allow whole numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    const payload = {
      donorName: donorName.trim(),
      donorMobile: donorMobile.trim() || undefined,
      amount: Number(amount),
      purpose: purpose.trim() || undefined,
      paymentMode
    };

    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const { data } = await client.post('/donations', { ...payload, idempotencyKey: `mob-${Date.now()}` });
        setGeneratedReceipt(data);
      } else {
        await queueDonation(payload);
        setGeneratedReceipt({ ...payload, receiptNumber: 'OFFLINE-' + Date.now().toString().slice(-4) });
      }
    } catch (err) {
      await queueDonation(payload);
      setGeneratedReceipt({ ...payload, receiptNumber: 'OFFLINE-' + Date.now().toString().slice(-4) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Donor Name */}
        <Text style={styles.label}>Donor Name *</Text>
        <TextInput
          style={[styles.input, errors.donorName && styles.inputError]}
          placeholder="e.g. Ramesh Patil"
          placeholderTextColor="#9ca3af"
          value={donorName}
          onChangeText={(t) => {
            setDonorName(t);
            if (errors.donorName) setErrors(prev => ({ ...prev, donorName: null }));
          }}
        />
        {errors.donorName ? <Text style={styles.errorText}>{errors.donorName}</Text> : null}

        {/* Donor Mobile */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Donor Mobile (Optional)</Text>
          <Text style={styles.charCount}>{donorMobile.length}/10</Text>
        </View>
        <TextInput
          style={[styles.input, errors.donorMobile && styles.inputError]}
          placeholder="10-digit mobile number"
          placeholderTextColor="#9ca3af"
          value={donorMobile}
          onChangeText={handleMobileChange}
          keyboardType="number-pad"
          maxLength={10}
        />
        {errors.donorMobile ? <Text style={styles.errorText}>{errors.donorMobile}</Text> : null}

        {/* Amount */}
        <Text style={styles.label}>Amount (₹) *</Text>
        <TextInput
          style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
          placeholder="₹ 0"
          placeholderTextColor="#9ca3af"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="number-pad"
        />
        {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

        {/* Quick Amount Chips */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickChip, amount === String(amt) && styles.quickChipActive]}
              onPress={() => {
                setAmount(String(amt));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
              }}
            >
              <Text style={[styles.quickChipText, amount === String(amt) && styles.quickChipTextActive]}>
                ₹{amt.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purpose */}
        <Text style={styles.label}>Purpose (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Visarjan Prasad, Aarti, Decoration"
          placeholderTextColor="#9ca3af"
          value={purpose}
          onChangeText={setPurpose}
        />

        {/* Payment Mode */}
        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeChip, paymentMode === m && styles.modeChipActive]}
              onPress={() => setPaymentMode(m)}
            >
              <Text style={[styles.modeChipText, paymentMode === m && styles.modeChipTextActive]}>
                {m === 'cash' ? '💵 Cash' : m === 'upi' ? '📱 UPI' : '💳 Card'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={[styles.button, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Generate Receipt →'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Digital Receipt Modal with WhatsApp Sharing */}
      <ReceiptModal
        visible={!!generatedReceipt}
        receipt={generatedReceipt}
        mandal={mandal}
        collectorName={user?.name}
        onClose={() => {
          setGeneratedReceipt(null);
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6', padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  charCount: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#17233C'
  },
  amountInput: {
    fontSize: 20, fontWeight: '700', color: '#FF6B00'
  },
  inputError: {
    borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.02)'
  },
  errorText: {
    color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: '500'
  },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4
  },
  quickChip: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12
  },
  quickChipActive: {
    backgroundColor: '#FF6B00', borderColor: '#FF6B00'
  },
  quickChipText: {
    fontSize: 12, fontWeight: '600', color: '#4B5563'
  },
  quickChipTextActive: {
    color: '#fff', fontWeight: '700'
  },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modeChip: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center'
  },
  modeChipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  modeChipText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  modeChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#FF6B00', padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 30, marginBottom: 40,
    shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
