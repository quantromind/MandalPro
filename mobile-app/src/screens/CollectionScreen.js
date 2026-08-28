import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import client from '../api/client';
import { queueDonation } from '../utils/offlineQueue';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();

  const validate = () => {
    const errs = {};

    // Donor Name validation
    const trimmedName = donorName.trim();
    if (!trimmedName) {
      errs.donorName = t('collection.donorNameRequired');
    } else if (trimmedName.length < 2) {
      errs.donorName = t('collection.donorNameMin');
    }

    // Donor Mobile validation (optional, but if provided must be valid 10 digits)
    const cleanMobile = donorMobile.trim();
    if (cleanMobile) {
      if (!/^\d{10}$/.test(cleanMobile)) {
        errs.donorMobile = t('collection.mobileExactTen');
      } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.donorMobile = t('collection.mobileStartDigit');
      }
    }

    // Amount validation
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) {
      errs.amount = t('collection.amountRequired');
    } else if (numAmount <= 0) {
      errs.amount = t('collection.amountPositive');
    } else if (numAmount > 10000000) {
      errs.amount = t('collection.amountLimitExceeded');
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F8F7F4' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Form Card Container */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>✨ {t('collection.recordNewDonation')}</Text>
            <Text style={styles.cardHeaderSub}>{t('collection.issueDigitalReceipt')}</Text>
          </View>

          {/* Donor Name */}
          <Text style={styles.label}>{t('collection.donorFullName')} *</Text>
          <TextInput
            style={[styles.input, errors.donorName && styles.inputError]}
            placeholder="e.g. Ramesh Patil"
            placeholderTextColor="#94A3B8"
            value={donorName}
            onChangeText={(t) => {
              setDonorName(t);
              if (errors.donorName) setErrors(prev => ({ ...prev, donorName: null }));
            }}
          />
          {errors.donorName ? <Text style={styles.errorText}>{errors.donorName}</Text> : null}

          {/* Donor Mobile */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('collection.donorMobile')}</Text>
            <Text style={styles.charCount}>{donorMobile.length}/10</Text>
          </View>
          <TextInput
            style={[styles.input, errors.donorMobile && styles.inputError]}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            value={donorMobile}
            onChangeText={handleMobileChange}
            keyboardType="number-pad"
            maxLength={10}
          />
          {errors.donorMobile ? <Text style={styles.errorText}>{errors.donorMobile}</Text> : null}

          {/* Amount */}
          <Text style={styles.label}>{t('collection.donationAmount')} *</Text>
          <TextInput
            style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
            placeholder="₹ 0"
            placeholderTextColor="#CBD5E1"
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
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, amount === String(amt) && styles.quickChipTextActive]}>
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Purpose */}
          <Text style={styles.label}>{t('collection.donationPurpose')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('collection.purposePlaceholder')}
            placeholderTextColor="#94A3B8"
            value={purpose}
            onChangeText={setPurpose}
          />

          {/* Payment Mode */}
          <Text style={styles.label}>{t('collection.paymentMode')}</Text>
          <View style={styles.modeRow}>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, paymentMode === m && styles.modeChipActive]}
                onPress={() => setPaymentMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeChipText, paymentMode === m && styles.modeChipTextActive]}>
                  {m === 'cash' ? `💵 ${t('collection.modes.cash')}` : m === 'upi' ? `📱 ${t('collection.modes.upi')}` : `💳 ${t('collection.modes.card')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            <Text style={styles.buttonText}>{saving ? `${t('common.saving')}…` : `${t('collection.generateReceipt')} →`}</Text>
          </TouchableOpacity>
        </View>
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
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  contentContainer: { padding: 16, paddingBottom: 32 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  cardHeader: { marginBottom: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(23, 37, 84, 0.05)' },
  cardHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#172554' },
  cardHeaderSub: { fontSize: 12.5, color: '#64748B', marginTop: 2 },

  label: { fontSize: 12.5, fontWeight: '700', color: '#172554', marginBottom: 6, marginTop: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  charCount: { fontSize: 11.5, color: '#94A3B8', fontWeight: '600' },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    fontSize: 14.5,
    color: '#172554'
  },
  amountInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.03)',
    borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11.5,
    marginTop: 4,
    fontWeight: '600'
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 13
  },
  quickChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316'
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modeChip: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modeChipActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#F97316'
  },
  modeChipText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  modeChipTextActive: { color: '#F97316', fontWeight: '800' },
  button: {
    backgroundColor: '#F97316',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4
  },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15.5 }
});
