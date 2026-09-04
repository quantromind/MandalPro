import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Linking, Platform, Alert, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { numberToWordsMr, toMarathiDigits } from '../utils/numberToWords';
import { useLanguage } from '../context/LanguageContext';

const defaultLogo = require('../../assets/logo.png');

export default function ReceiptModal({ visible, receipt, mandal, collectorName, onClose }) {
  const { t } = useLanguage();
  const receiptRef = useRef();
  const [sharingImage, setSharingImage] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Guard: must be after hooks to satisfy React Rules of Hooks
  if (!receipt) return null;

  const mandalName = mandal?.name || (typeof receipt.mandalId === 'object' ? receipt.mandalId?.name : null) || receipt.mandal?.name || receipt.mandalName || 'सखी मित्र मंडळ (Sakhee Mitra Mandal)';
  const mandalLocation = mandal?.address || mandal?.city || receipt?.mandal?.address || 'सार्वजनिक उत्सव परिसर';
  const establishedYear = mandal?.establishedYear || '२०२३';
  const logoUri = mandal?.logoBase64 || mandal?.logoUrl || (typeof receipt.mandalId === 'object' ? (receipt.mandalId?.logoBase64 || receipt.mandalId?.logoUrl) : null) || receipt?.mandal?.logoBase64 || receipt?.mandal?.logoUrl || receipt?.mandalLogo;

  const receiptNo = receipt.receiptNumber || receipt._id?.slice(-6)?.toUpperCase() || 'RCPT-001';
  const amount = Number(receipt.amount || 0);
  const donorName = receipt.donorName || receipt.contributor || receipt.donor || 'भक्त';
  const donorMobile = receipt.donorMobile || receipt.mobile || '';
  const purpose = receipt.purpose || receipt.title || receipt.category || 'सार्वजनिक गणेशोत्सव';
  const paymentMode = (receipt.paymentMode || 'cash').toLowerCase();

  const d = receipt.createdAt || receipt.date ? new Date(receipt.createdAt || receipt.date) : new Date();
  const dayStr = String(d.getDate()).padStart(2, '0');
  const monthStr = String(d.getMonth() + 1).padStart(2, '0');
  const yearStr = String(d.getFullYear());
  const dateFormattedMr = `${toMarathiDigits(dayStr)}/${toMarathiDigits(monthStr)}/${toMarathiDigits(yearStr)}`;
  const currentYearMr = toMarathiDigits(yearStr);
  const establishedYearMr = toMarathiDigits(establishedYear);

  const amountFormattedMr = toMarathiDigits(amount.toLocaleString('en-IN'));
  const marathiWords = numberToWordsMr(amount);
  const isCash = paymentMode === 'cash';
  const paymentAckText = isCash ? 'रोख (Cash) द्वारे मिळाले, धन्यवाद !' : 'UPI द्वारे मिळाले, धन्यवाद !';

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
*॥ अधिकृत देणगी पावती ॥*
━━━━━━━━━━━━━━━━━━━━
🧾 *पावती क्र.:* #${receiptNo}
📅 *दिनांक:* ${dateFormattedMr}
👤 *श्री/श्रीमती:* ${donorName}
${donorMobile ? `📱 *मोबाइल:* +91 ${donorMobile}\n` : ''}💰 *देणगी रक्कम:* ₹${amount.toLocaleString('en-IN')}/- (अक्षरी: ${marathiWords})
💳 *देयक पद्धत:* ${isCash ? 'रोख (Cash)' : 'UPI / Online'}
🎯 *हेतू:* ${purpose}
${collectorName ? `✍️ *संकलक:* ${collectorName}\n` : ''}━━━━━━━━━━━━━━━━━━━━
❖ *आपल्या मोलाच्या देणगीबद्दल मनःपूर्वक धन्यवाद!* ❖
॥ गणपती बाप्पा मोरया ॥`;

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
                
                {/* Subtle Background Watermark */}
                <View style={styles.watermarkContainer} pointerEvents="none">
                  <Text style={styles.watermarkText} numberOfLines={1}>
                    {mandalName}
                  </Text>
                </View>

                {/* Inner Decorative Golden Border */}
                <View style={styles.innerBorder}>
                  
                  {/* 1. Top Sacred Row: Center Om Shri Ganesh | Right Sthapana */}
                  <View style={styles.topAuspiciousRow}>
                    <Text style={styles.topSacredCenterText}>॥ श्री गणेश ॥</Text>
                    <Text style={styles.topSacredRightText}>स्थापना {establishedYearMr}</Text>
                  </View>

                  {/* 2. Mandal Grand Header - Centered with Logo Badge */}
                  <View style={styles.mandalHeaderSection}>
                    <View style={styles.logoBadge}>
                      <Image
                        source={logoUri && !logoError ? { uri: logoUri } : defaultLogo}
                        style={styles.mandalLogoImg}
                        resizeMode="contain"
                        onError={() => setLogoError(true)}
                      />
                    </View>

                    <View style={styles.mandalTitleCol}>
                      <Text
                        style={styles.mandalTitleText}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {mandalName}
                      </Text>
                      <Text style={styles.mandalSubFestival}>
                        आयोजित सार्वजनिक गणेशोत्सव {currentYearMr}
                      </Text>
                      <Text style={styles.mandalLocationText} numberOfLines={1}>
                        {mandalLocation}
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
                      दिनांक: <Text style={styles.metaBoldText}>{dateFormattedMr}</Text>
                    </Text>
                  </View>

                  {/* 5. Donor Info Row with Dashed Underline */}
                  <View style={styles.donorContainer}>
                    <View style={styles.donorRow}>
                      <Text style={styles.donorPrefix}>श्री./श्रीमती/मेसर्स </Text>
                      <View style={styles.donorUnderlineWrap}>
                        <Text style={styles.donorNameText} numberOfLines={1}>
                          {donorName}
                        </Text>
                        <View style={styles.dashedUnderline} />
                      </View>
                      <Text style={styles.donorSuffix}>यांजकडून</Text>
                    </View>
                    {donorMobile ? (
                      <Text style={styles.donorMobileText}>
                        📱 मो. क्र.: <Text style={styles.donorMobileVal}>+91 {donorMobile}</Text>
                      </Text>
                    ) : null}
                  </View>

                  {/* 6. Contribution Line */}
                  <Text style={styles.varganiText}>वर्गणी / देणगी रु.</Text>

                  {/* 7. Highlight Amount Box */}
                  <View style={styles.amountBoxContainer}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountBoxText}>
                        ₹ {amountFormattedMr}
                      </Text>
                    </View>
                  </View>

                  {/* 8. Amount in Marathi Words */}
                  <Text style={styles.amountInWordsText}>
                    {marathiWords}
                  </Text>

                  {/* 9. Payment Acknowledgement */}
                  <Text style={styles.paymentAckText}>
                    {paymentAckText}
                  </Text>

                  {/* 10. Bottom Blessing & Chant */}
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
    padding: 8
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

  /* ── Traditional Marathi Receipt Card Styling ── */
  receiptContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginVertical: 4
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    padding: 5,
    borderWidth: 2.5,
    borderColor: '#C2410C',
    position: 'relative',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#C2410C',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },

  /* Subtle Watermark */
  watermarkContainer: {
    position: 'absolute',
    top: '48%',
    left: -80,
    right: -80,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    opacity: 0.045,
    zIndex: 0
  },
  watermarkText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#C2410C',
    textAlign: 'center',
    letterSpacing: 2
  },

  /* Inner Golden Border */
  innerBorder: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 13,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1
  },

  /* Top Sacred Row */
  topAuspiciousRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 20
  },
  topSacredCenterText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9A3412',
    textAlign: 'center',
    letterSpacing: 0.5
  },
  topSacredRightText: {
    position: 'absolute',
    right: 0,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#9A3412'
  },

  /* Mandal Grand Header */
  mandalHeaderSection: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 48,
    minHeight: 58
  },
  logoBadge: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#EA580C',
    backgroundColor: '#FFFFFF',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden'
  },
  mandalLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 25
  },
  mandalTitleCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  mandalTitleText: {
    fontSize: 20.5,
    fontWeight: '900',
    color: '#831843',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: 0.3
  },
  mandalSubFestival: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C2410C',
    textAlign: 'center',
    marginTop: 3
  },
  mandalLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2
  },

  /* Section Divider: ◆ देणगी पावती ◆ */
  pawtiDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 10
  },
  pawtiLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#FDBA74'
  },
  pawtiBadgeText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 0.5
  },

  /* Meta Row: पावती क्र. & दिनांक */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  metaLabelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155'
  },
  metaBoldText: {
    fontWeight: '900',
    color: '#0F172A'
  },

  /* Donor Row */
  donorContainer: {
    marginBottom: 12
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  donorPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    paddingBottom: 2
  },
  donorUnderlineWrap: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 4,
    position: 'relative',
    justifyContent: 'flex-end'
  },
  donorNameText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    paddingBottom: 2
  },
  dashedUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: '#94A3B8',
    borderStyle: 'dashed'
  },
  donorSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    paddingBottom: 2
  },
  donorMobileText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4
  },
  donorMobileVal: {
    fontWeight: '800',
    color: '#0F172A'
  },

  /* Contribution Line */
  varganiText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },

  /* Highlight Amount Box */
  amountBoxContainer: {
    alignItems: 'center',
    marginVertical: 8
  },
  amountBox: {
    borderWidth: 2.5,
    borderColor: '#EA580C',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minWidth: 220,
    maxWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#EA580C',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  amountBoxText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: 1,
    textAlign: 'center'
  },

  /* Amount in Marathi Words */
  amountInWordsText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6
  },

  /* Payment Ack */
  paymentAckText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12
  },

  /* Bottom Blessing */
  bottomBlessingSection: {
    marginTop: 2,
    alignItems: 'center'
  },
  dashedFooterLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    borderStyle: 'dashed',
    marginBottom: 10
  },
  bottomChantText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#9A3412',
    textAlign: 'center',
    letterSpacing: 0.8
  },

  /* Action Buttons */
  actionContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 12,
    gap: 8
  },
  imageShareBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    elevation: 3
  },
  imageShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
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
    fontSize: 13.5,
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
