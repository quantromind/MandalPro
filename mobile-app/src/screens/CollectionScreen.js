import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import client from '../api/client';
import { queueDonation } from '../utils/offlineQueue';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { numberToWordsEn, numberToWordsMr } from '../utils/numberToWords';
import ReceiptModal from '../components/ReceiptModal';

const MODES = [
  { id: 'cash', icon: '💵', labelMr: 'रोख (Cash)', labelEn: 'Cash' },
  { id: 'upi', icon: '📱', labelMr: 'UPI (GPay/PhonePe)', labelEn: 'UPI Online' },
  { id: 'card', icon: '💳', labelMr: 'कार्ड / बँक', labelEn: 'Card / Bank' }
];

const SHUBH_AMOUNTS = [51, 101, 251, 501, 1100, 2100, 5100];

const COMMON_PURPOSES = [
  { id: 'गणेशोत्सव वर्गणी', labelMr: '🐘 गणेशोत्सव वर्गणी', labelEn: 'Ganesh Utsav' },
  { id: 'महाप्रसाद देणगी', labelMr: '🍲 महाप्रसाद / अन्नदान', labelEn: 'Mahaprasad' },
  { id: 'आरती व पूजा', labelMr: '🪔 आरती व पूजा', labelEn: 'Aarti & Puja' },
  { id: 'सामान्य देणगी', labelMr: '🚩 सामान्य देणगी', labelEn: 'General Donation' }
];

export default function CollectionScreen({ navigation }) {
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('गणेशोत्सव वर्गणी');
  const [customPurpose, setCustomPurpose] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  const { mandal, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const isMr = language === 'mr';

  const toggleLanguage = () => {
    setLanguage(isMr ? 'en' : 'mr');
  };

  const numAmount = parseInt(amount, 10) || 0;
  const amountInWords = numAmount > 0 ? (isMr ? numberToWordsMr(numAmount) : numberToWordsEn(numAmount)) : '';

  const validate = () => {
    const errs = {};
    const trimmedName = donorName.trim();
    if (!trimmedName) {
      errs.donorName = isMr ? 'कृपया देणगीदाराचे नाव प्रविष्ट करा' : 'Please enter donor name';
    } else if (trimmedName.length < 2) {
      errs.donorName = isMr ? 'नाव किमान २ अक्षरांचे असावे' : 'Name must be at least 2 characters';
    }

    const cleanMobile = donorMobile.trim();
    if (cleanMobile) {
      if (!/^\d{10}$/.test(cleanMobile)) {
        errs.donorMobile = isMr ? 'मोबाइल नंबर अचूक १० अंकी असावा' : 'Mobile number must be exactly 10 digits';
      } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.donorMobile = isMr ? 'मोबाइल नंबर ६, ७, ८ किंवा ९ ने सुरू व्हावा' : 'Mobile must start with 6, 7, 8 or 9';
      }
    }

    if (!amount || numAmount <= 0) {
      errs.amount = isMr ? 'कृपया वैध देणगी रक्कम प्रविष्ट करा' : 'Please enter valid donation amount';
    } else if (numAmount > 10000000) {
      errs.amount = isMr ? 'रक्कम कमाल मर्यादेपेक्षा जास्त आहे' : 'Amount exceeds maximum limit';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setDonorMobile(cleaned);
    if (errors.donorMobile) {
      setErrors((prev) => ({ ...prev, donorMobile: null }));
    }
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  const selectQuickAmount = (val) => {
    setAmount(String(val));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    const finalPurpose = customPurpose.trim() || purpose;
    const payload = {
      donorName: donorName.trim(),
      donorMobile: donorMobile.trim() || undefined,
      amount: numAmount,
      purpose: finalPurpose || 'गणेशोत्सव वर्गणी',
      paymentMode
    };

    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const { data } = await client.post('/donations', {
          ...payload,
          idempotencyKey: `mob-${Date.now()}`
        });
        setGeneratedReceipt(data);
      } else {
        await queueDonation(payload);
        setGeneratedReceipt({
          ...payload,
          receiptNumber: 'OFFLINE-' + Date.now().toString().slice(-4)
        });
      }
    } catch (err) {
      await queueDonation(payload);
      setGeneratedReceipt({
        ...payload,
        receiptNumber: 'OFFLINE-' + Date.now().toString().slice(-4)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>{isMr ? 'मागे' : 'Back'}</Text>
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>{isMr ? 'नवीन देणगी पावती' : 'New Collection'}</Text>
          <Text style={styles.headerMandal} numberOfLines={1}>
            {mandal?.name || 'Apla Mandal'}
          </Text>
        </View>

        <TouchableOpacity style={styles.langPill} onPress={toggleLanguage} activeOpacity={0.8}>
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>{isMr ? 'मराठी' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ════════ 1. HERO AMOUNT SECTION ════════ */}
          <View style={styles.heroAmountCard}>
            <Text style={styles.heroAmountLabel}>
              {isMr ? 'देणगी / वर्गणी रक्कम' : 'Donation Amount'} *
            </Text>

            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.bigAmountInput, errors.amount && styles.inputErrorBorder]}
                placeholder="0"
                placeholderTextColor="#CBD5E1"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                autoFocus={true}
              />
            </View>

            {errors.amount ? (
              <Text style={styles.errorTextHero}>{errors.amount}</Text>
            ) : null}

            {/* Live Amount in Words Pill */}
            {amountInWords ? (
              <View style={styles.amountWordsBox}>
                <Text style={styles.amountWordsIcon}>📝</Text>
                <Text style={styles.amountWordsText}>{amountInWords}</Text>
              </View>
            ) : null}

            {/* Shubh Quick Amount Chips */}
            <View style={styles.quickChipContainer}>
              <Text style={styles.quickChipLabel}>
                {isMr ? 'जलद रक्कम निवडा:' : 'Quick Select:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipScroll}
              >
                {SHUBH_AMOUNTS.map((val) => {
                  const isActive = amount === String(val);
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.shubhChip, isActive && styles.shubhChipActive]}
                      onPress={() => selectQuickAmount(val)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.shubhChipText, isActive && styles.shubhChipTextActive]}>
                        ₹{val.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* ════════ 2. DONOR DETAILS CARD ════════ */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>
                👤 {isMr ? 'देणगीदाराची माहिती' : 'Donor Information'}
              </Text>
            </View>

            {/* Donor Name */}
            <Text style={styles.fieldLabel}>
              {isMr ? 'देणगीदाराचे पूर्ण नाव' : 'Donor Full Name'} *
            </Text>
            <TextInput
              style={[styles.input, errors.donorName && styles.inputError]}
              placeholder={isMr ? 'उदा. श्री. रमेश विनायक पाटील' : 'e.g. Ramesh V. Patil'}
              placeholderTextColor="#94A3B8"
              value={donorName}
              autoCapitalize="words"
              onChangeText={(t) => {
                setDonorName(t);
                if (errors.donorName) setErrors((prev) => ({ ...prev, donorName: null }));
              }}
            />
            {errors.donorName ? <Text style={styles.errorText}>{errors.donorName}</Text> : null}

            {/* WhatsApp Mobile */}
            <View style={styles.labelRow}>
              <View style={styles.whatsappLabelRow}>
                <Text style={styles.whatsappIcon}>📱</Text>
                <Text style={styles.fieldLabel}>
                  {isMr ? 'व्हॉट्सअ‍ॅप मोबाइल नंबर' : 'WhatsApp Number'}
                </Text>
                <View style={styles.whatsappBadge}>
                  <Text style={styles.whatsappBadgeText}>WhatsApp</Text>
                </View>
              </View>
              <Text style={styles.charCount}>{donorMobile.length}/10</Text>
            </View>

            <View style={[styles.phoneInputWrap, errors.donorMobile && styles.inputErrorBorder]}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                placeholderTextColor="#94A3B8"
                value={donorMobile}
                onChangeText={handleMobileChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <Text style={styles.helperText}>
              {isMr
                ? 'ℹ️ पावती तयार होताच या व्हॉट्सअ‍ॅप नंबरवर डिजिटल पावती पाठवता येईल.'
                : 'ℹ️ Digital receipt will be ready to send to this WhatsApp number.'}
            </Text>
            {errors.donorMobile ? (
              <Text style={styles.errorText}>{errors.donorMobile}</Text>
            ) : null}
          </View>

          {/* ════════ 3. PURPOSE & FESTIVAL CARD ════════ */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>
              🎯 {isMr ? 'देणगीचे निमित्त / उत्सव' : 'Donation Purpose'}
            </Text>

            <View style={styles.purposeChipsWrap}>
              {COMMON_PURPOSES.map((item) => {
                const isSelected = purpose === item.id && !customPurpose;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.purposeChip, isSelected && styles.purposeChipActive]}
                    onPress={() => {
                      setPurpose(item.id);
                      setCustomPurpose('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.purposeChipText,
                        isSelected && styles.purposeChipTextActive
                      ]}
                    >
                      {isMr ? item.labelMr : item.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom purpose optional input */}
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder={isMr ? 'किंवा इतर निमित्त टाईप करा (पर्यायी)' : 'Or enter custom purpose (optional)'}
              placeholderTextColor="#94A3B8"
              value={customPurpose}
              onChangeText={(t) => setCustomPurpose(t)}
            />
          </View>

          {/* ════════ 4. PAYMENT MODE CARD ════════ */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>
              💳 {isMr ? 'पेमेंट पद्धत' : 'Payment Mode'}
            </Text>

            <View style={styles.modeRow}>
              {MODES.map((m) => {
                const isSelected = paymentMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modeCard, isSelected && styles.modeCardActive]}
                    onPress={() => setPaymentMode(m.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modeIcon}>{m.icon}</Text>
                    <Text style={[styles.modeText, isSelected && styles.modeTextActive]}>
                      {isMr ? m.labelMr : m.labelEn}
                    </Text>
                    {isSelected && <View style={styles.modeActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ════════ 5. COLLECTOR INFO BAR ════════ */}
          <View style={styles.collectorBar}>
            <Text style={styles.collectorText}>
              ✍️ {isMr ? 'पावती नोंदवणारे:' : 'Collector:'}{' '}
              <Text style={styles.collectorName}>{user?.name || 'Authorized Member'}</Text>
            </Text>
          </View>

          {/* ════════ 6. SUBMIT CTA ════════ */}
          <TouchableOpacity
            style={[styles.submitButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <View style={styles.submitInner}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitBtnText}>
                  {isMr ? 'पावती तयार होत आहे...' : 'Generating Receipt...'}
                </Text>
              </View>
            ) : (
              <View style={styles.submitInner}>
                <Text style={styles.submitBtnText}>
                  {isMr ? 'पावती तयार करा व WhatsApp वर पाठवा' : 'Generate & Send Receipt'}
                </Text>
                <Text style={styles.submitBtnArrow}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── DIGITAL RECEIPT MODAL ── */}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.06)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172554',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172554',
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#172554',
  },
  headerMandal: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    maxWidth: 160,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  langIcon: { fontSize: 12 },
  langText: { fontSize: 11.5, fontWeight: '800', color: '#C2410C' },

  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },

  /* Hero Amount Section */
  heroAmountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  heroAmountLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F97316',
  },
  bigAmountInput: {
    fontSize: 38,
    fontWeight: '900',
    color: '#172554',
    textAlign: 'center',
    minWidth: 140,
    paddingVertical: 0,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  errorTextHero: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  amountWordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 6,
    maxWidth: '96%',
  },
  amountWordsIcon: { fontSize: 13 },
  amountWordsText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#C2410C',
    textAlign: 'center',
  },
  quickChipContainer: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.05)',
    paddingTop: 12,
  },
  quickChipLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  quickChipScroll: {
    gap: 8,
  },
  shubhChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shubhChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  shubhChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  shubhChipTextActive: {
    color: '#F97316',
  },

  /* General Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  whatsappLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsappIcon: { fontSize: 14 },
  whatsappBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  whatsappBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14.5,
    color: '#172554',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefixBox: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#172554',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  /* Purpose Chips */
  purposeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  purposeChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  purposeChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  purposeChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  purposeChipTextActive: {
    color: '#F97316',
  },

  /* Payment Mode */
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modeCardActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  modeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  modeTextActive: {
    color: '#F97316',
    fontWeight: '800',
  },
  modeActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },

  /* Collector Bar */
  collectorBar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  collectorText: {
    fontSize: 12,
    color: '#64748B',
  },
  collectorName: {
    color: '#172554',
    fontWeight: '800',
  },

  /* Submit CTA */
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  submitBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
