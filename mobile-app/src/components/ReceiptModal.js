import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Linking, Platform, Alert, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { numberToWordsEn } from '../utils/numberToWords';

import { useLanguage } from '../context/LanguageContext';

export default function ReceiptModal({ visible, receipt, mandal, collectorName, onClose }) {
  const { t } = useLanguage();
  const receiptRef = useRef();
  const [sharingImage, setSharingImage] = useState(false);

  // Guard: must be after hooks to satisfy React Rules of Hooks
  if (!receipt) return null;

  const mandalName = mandal?.name || (typeof receipt.mandalId === 'object' ? receipt.mandalId?.name : null) || receipt.mandal?.name || 'सखी मित्र मंडळ (Sakhee Mitra Mandal)';
  const logoUri = mandal?.logoBase64 || mandal?.logoUrl || (typeof receipt.mandalId === 'object' ? (receipt.mandalId?.logoBase64 || receipt.mandalId?.logoUrl) : null) || receipt?.mandal?.logoBase64 || receipt?.mandal?.logoUrl || receipt?.mandalLogo;
  const receiptNo = receipt.receiptNumber || 'RCPT-001';
  const amount = Number(receipt.amount || 0);
  const donorName = receipt.donorName || 'Devotee';
  const donorMobile = receipt.donorMobile || '';
  const purpose = receipt.purpose || 'Ganpati Festival Donation';
  const paymentMode = (receipt.paymentMode || 'cash').toLowerCase();

  const d = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
  const dateFormatted = `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;

  // ── Share as High-Resolution Image ──
  const handleShareImage = async () => {
    try {
      setSharingImage(true);
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile'
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${mandalName} - Receipt #${receiptNo}`,
          UTI: 'public.png'
        });
      } else {
        Alert.alert(t('common.error'), 'Image sharing is not supported on this device.');
      }
    } catch (err) {
      Alert.alert(t('common.error'), 'Could not generate receipt image: ' + err.message);
    } finally {
      setSharingImage(false);
    }
  };

  // ── Direct WhatsApp Message ──
  const handleDirectWhatsApp = async () => {
    if (!donorMobile) {
      Alert.alert(t('common.error'), 'No phone number is attached to this receipt.');
      return;
    }

    const cleanMobile = donorMobile.replace(/[^0-9]/g, '');
    const formattedPhone = cleanMobile.startsWith('91') && cleanMobile.length > 10
      ? cleanMobile
      : `91${cleanMobile}`;

    const message = 
`॥ गणपती बाप्पा मोरया ॥
🚩 *${mandalName}* 🚩
*॥ देणगी पावती (DONATION RECEIPT) ॥*
━━━━━━━━━━━━━━━━━━━━
🧾 *Receipt No.:* #${receiptNo}
📅 *Date:* ${dateFormatted}
👤 *Mr./Mrs.:* ${donorName}
📱 *Mobile No.:* ${donorMobile ? (donorMobile.startsWith('+') ? donorMobile : `+91 ${donorMobile}`) : 'N/A'}
💰 *Donation Amount:* ₹${amount.toLocaleString('en-IN')}/-
📝 *Amount in Words:* ${numberToWordsEn(amount)}
💳 *Payment Mode:* ${paymentMode === 'cash' ? 'CASH' : 'UPI / ONLINE'}
🎯 *Purpose:* ${purpose}
${collectorName ? `✍️ *Issued By:* ${collectorName}\n` : ''}━━━━━━━━━━━━━━━━━━━━
❖ *Thank you for your generous contribution!* ❖`;

    const encodedText = encodeURIComponent(message);
    const nativeUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
    const webUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert(t('common.error'), 'Unable to open WhatsApp.');
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Status Pill */}
            <View style={styles.topSuccess}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>{t('receipts.receiptGeneratedSuccess')}</Text>
            </View>

            {/* ════════ RECEIPT VIEW (CAPTURED AS HIGH-RES IMAGE) ════════ */}
            <View style={styles.receiptContainer}>
              <View ref={receiptRef} collapsable={false} style={styles.receiptCard}>
                <View style={styles.innerBorder}>
                  
                  {/* 1. Top Sacred Row: Center Om Shri Ganesh | Right Sthapana */}
                  <View style={styles.topAuspiciousRow}>
                    <Text style={styles.topSacredCenterText}>॥ श्री गणेश ॥</Text>
                    <Text style={styles.topSacredRightText}>स्थापना {toMarathiDigits(mandal?.establishedYear || '२०२३')}</Text>
                  </View>

                  {/* 2. Mandal Header Section - Centered */}
                  <View style={styles.mandalHeaderSection}>
                    {logoUri ? (
                      <Image
                        source={{ uri: logoUri }}
                        style={styles.mandalLogoImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.ganeshaCircle}>
                        <Text style={styles.ganeshaIcon}>🪔</Text>
                      </View>
                    )}
                    <View style={styles.mandalTitleCol}>
                      <Text
                        style={styles.mandalTitleText}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                      >
                        {mandalName}
                      </Text>
                      <Text style={styles.mandalSubFestival}>
                        आयोजित सार्वजनिक गणेशोत्सव {toMarathiDigits(new Date().getFullYear())}
                      </Text>
                      <Text style={styles.mandalLocationText} numberOfLines={1}>
                        {mandal?.address || mandal?.city || 'सार्वजनिक उत्सव परिसर'}
                      </Text>
                    </View>
                  </View>

                  {/* 3. Section Title Divider: ◆ देणगी पावती ◆ */}
                  <View style={styles.pawtiDividerRow}>
                    <View style={styles.pawtiLine} />
                    <Text style={styles.pawtiBadgeText}>◆ देणगी पावती ◆</Text>
                    <View style={styles.pawtiLine} />
                  </View>

                  {/* 4. Receipt No & Date Row */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabelText}>
                      पावती क्र. <Text style={styles.metaBoldText}>{receiptNo}</Text>
                    </Text>
                    <Text style={styles.metaLabelText}>
                      दिनांक: <Text style={styles.metaBoldText}>{toMarathiDigits(dateFormatted)}</Text>
                    </Text>
                  </View>

                  {/* 5. Donor Info Row */}
                  <View style={styles.donorRow}>
                    <Text style={styles.donorPrefix}>श्री./श्रीमती/मेसर्स </Text>
                    <View style={styles.lineFill}>
                      <Text style={styles.donorNameText} numberOfLines={1}>
                        {donorName}
                      </Text>
                      <View style={styles.dotLine} />
                    </View>
                    <Text style={styles.donorPrefix}> यांजकडून</Text>
                  </View>

                  {/* 6. Contribution Line */}
                  <Text style={styles.varganiText}>वर्गणी / देणगी रु.</Text>

                  {/* 7. Highlight Amount Box */}
                  <View style={styles.amountBoxContainer}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountBoxText}>
                        ₹ {toMarathiDigits(amount.toLocaleString('en-IN'))}
                      </Text>
                    </View>
                  </View>

                  {/* 8. Amount in Marathi Words */}
                  <Text style={styles.amountInWordsText}>
                    {numberToWordsMr(amount)}
                  </Text>

                  {/* 9. Payment Acknowledgement */}
                  <Text style={styles.paymentAckText}>
                    {paymentMode === 'cash' ? 'रोख (Cash) द्वारे मिळाले, धन्यवाद !' : 'UPI द्वारे मिळाले, धन्यवाद !'}
                  </Text>

                  {/* 10. Bottom Blessing */}
                  <View style={styles.bottomBlessingSection}>
                    <View style={styles.dashedFooterLine} />
                    <Text style={styles.bottomChantText}>॥ गणपती बाप्पा मोरया ॥</Text>
                  </View>

                </View>
              </View>
            </View>
            {/* ════════ END RECEIPT VIEW ════════ */}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.imageShareBtn}
                onPress={handleShareImage}
                disabled={sharingImage}
                activeOpacity={0.85}
              >
                {sharingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnIcon}>🖼️</Text>
                    <Text style={styles.imageShareBtnText}>{t('receipts.shareImageWhatsApp')}</Text>
                  </>
                )}
              </TouchableOpacity>

              {donorMobile ? (
                <TouchableOpacity
                  style={styles.whatsappDirectBtn}
                  onPress={handleDirectWhatsApp}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnIcon}>📲</Text>
                  <Text style={styles.whatsappDirectBtnText}>{t('receipts.sendDirectWhatsApp', { mobile: donorMobile })}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>{t('receipts.doneNewCollection')}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  container: {
    width: '100%',
    maxHeight: '98%'
  },
  scrollContent: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  topSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 10,
    gap: 8,
    elevation: 3
  },
  successIcon: { fontSize: 14 },
  successText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* ── Traditional Receipt Card Styling ── */
  receiptContainer: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    marginVertical: 4
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    padding: 6,
    borderWidth: 2.5,
    borderColor: '#C2410C',
    elevation: 6
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFDF9'
  },

  /* Top Sacred Row */
  topAuspiciousRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 20
  },
  topSacredCenterText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9A3412',
    textAlign: 'center'
  },
  topSacredRightText: {
    position: 'absolute',
    right: 0,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#9A3412'
  },

  /* Mandal Header */
  mandalHeaderSection: {
    marginBottom: 8
  },
  mandalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  mandalLogoImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EA580C',
    backgroundColor: '#fff'
  },
  ganeshaCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center'
  },
  ganeshaIcon: {
    fontSize: 24
  },
  mandalTitleCol: {
    flex: 1
  },
  mandalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#831843',
    lineHeight: 22
  },
  mandalSubFestival: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#C2410C',
    marginTop: 2
  },
  mandalLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1
  },

  /* Section Divider */
  pawtiDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8
  },
  pawtiLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#FDBA74'
  },
  pawtiBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9A3412'
  },

  /* Meta Row */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  metaLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155'
  },
  metaBoldText: {
    fontWeight: '900',
    color: '#0F172A'
  },

  /* Donor Row */
  donorRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  donorPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  donorNameText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
    paddingBottom: 2
  },
  lineFill: {
    flex: 1,
    minWidth: 100,
    justifyContent: 'center',
    position: 'relative'
  },
  dotLine: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1.2,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed',
    marginTop: 1
  },

  varganiText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },

  /* Amount Box */
  amountBoxContainer: {
    alignItems: 'center',
    marginVertical: 6
  },
  amountBox: {
    borderWidth: 2,
    borderColor: '#EA580C',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  amountBoxText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 0.5
  },

  amountInWordsText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8
  },

  paymentAckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10
  },

  /* Bottom Blessing */
  bottomBlessingSection: {
    marginTop: 4,
    alignItems: 'center'
  },
  dashedFooterLine: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    borderStyle: 'dashed',
    marginBottom: 8
  },
  bottomChantText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 0.5
  },

  /* Action Buttons */
  actionContainer: {
    width: '100%',
    maxWidth: 390,
    marginTop: 12,
    gap: 8
  },
  imageShareBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 3
  },
  imageShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  whatsappDirectBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  whatsappDirectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  doneBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  doneBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700'
  },
  btnIcon: {
    fontSize: 16
  }
});
