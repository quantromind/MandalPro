import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Linking, Platform, Alert, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { numberToWordsEn } from '../utils/numberToWords';

export default function ReceiptModal({ visible, receipt, mandal, collectorName, onClose }) {
  if (!receipt) return null;

  const receiptRef = useRef();
  const [sharingImage, setSharingImage] = useState(false);

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
        Alert.alert('Sharing Unavailable', 'Image sharing is not supported on this device.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate receipt image: ' + err.message);
    } finally {
      setSharingImage(false);
    }
  };

  // ── Direct WhatsApp Message ──
  const handleDirectWhatsApp = async () => {
    if (!donorMobile) {
      Alert.alert('No Mobile Number', 'No phone number is attached to this receipt.');
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
        Alert.alert('Error', 'Unable to open WhatsApp.');
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
              <Text style={styles.successText}>Receipt Generated Successfully</Text>
            </View>

            {/* ════════ RECEIPT VIEW (CAPTURED AS HIGH-RES IMAGE) ════════ */}
            <View style={styles.receiptContainer}>
              <View ref={receiptRef} collapsable={false} style={styles.receiptCard}>
                <View style={styles.innerBorder}>
                  
                  {/* 1. Top Header Row: Left Dengi Pawti (Small font) | Right Receipt No & Date (Reduced font size) */}
                  <View style={styles.topHeaderRow}>
                    <View style={styles.dengiPillBadge}>
                      <Text style={styles.dengiPillText}>॥ देणगी पावती ॥</Text>
                    </View>

                    <View style={styles.topMetaRight}>
                      <Text style={styles.metaText}>
                        Receipt No.: <Text style={styles.metaValue}>#{receiptNo}</Text>
                      </Text>
                      <Text style={styles.metaText}>
                        Date: <Text style={styles.metaValue}>{dateFormatted}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* 2. Center Sacred Chant & Enlarged Mandal Name (Logo replaced in place of Diya if uploaded) */}
                  <View style={styles.mandalHeaderSection}>
                    <Text style={styles.topCenterChant}>॥ गणपती बाप्पा मोरया ॥</Text>
                    <View style={styles.mandalTitleRow}>
                      {logoUri ? (
                        <Image
                          source={{ uri: logoUri }}
                          style={styles.mandalLogoImg}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.ganeshaIcon}>🪔</Text>
                      )}
                      <Text
                        style={styles.mandalTitleText}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                      >
                        {mandalName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dividerLine} />

                  {/* 3. Body Section (Cleanly Structured Rows) */}
                  <View style={styles.bodySection}>
                    
                    {/* Row 1: Donor Name */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Mr./Mrs.:</Text>
                      <View style={styles.lineFill}>
                        <Text style={styles.fieldValue} numberOfLines={1}>
                          {donorName}
                        </Text>
                        <View style={styles.dotLine} />
                      </View>
                    </View>

                    {/* Row 2: Mobile Number (New Dedicated Field) */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Mobile No.:</Text>
                      <View style={styles.lineFill}>
                        <Text style={styles.fieldValue} numberOfLines={1}>
                          {donorMobile ? (donorMobile.startsWith('91') || donorMobile.startsWith('+') ? donorMobile : `+91 ${donorMobile}`) : '—'}
                        </Text>
                        <View style={styles.dotLine} />
                      </View>
                    </View>

                    {/* Row 3: Purpose */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Purpose:</Text>
                      <View style={styles.lineFill}>
                        <Text style={styles.fieldValue} numberOfLines={1}>{purpose}</Text>
                        <View style={styles.dotLine} />
                      </View>
                    </View>

                    {/* Row 4: Donation Amount (Highlighted Box) */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Donation Amount:</Text>
                      <View style={styles.amountBox}>
                        <Text style={styles.amountBoxText}>₹ {amount.toLocaleString('en-IN')}/-</Text>
                      </View>
                    </View>

                    {/* Row 5: Amount in Words */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Amount in Words:</Text>
                      <View style={styles.lineFill}>
                        <Text style={styles.fieldValueWords} numberOfLines={2}>
                          {numberToWordsEn(amount)}
                        </Text>
                        <View style={styles.dotLine} />
                      </View>
                    </View>

                    {/* Row 6: Payment Method (Cash and UPI / Online - Fits cleanly without overflowing) */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Payment Mode:</Text>
                      <View style={styles.checkboxesRow}>
                        <View style={styles.checkItem}>
                          <View style={[styles.boxCheck, paymentMode === 'cash' && styles.boxCheckActive]}>
                            {paymentMode === 'cash' && <Text style={styles.checkMark}>✓</Text>}
                          </View>
                          <Text style={styles.checkText}>Cash</Text>
                        </View>

                        <View style={styles.checkItem}>
                          <View style={[styles.boxCheck, (paymentMode === 'upi' || paymentMode === 'card' || paymentMode === 'online' || paymentMode === 'netbanking') && styles.boxCheckActive]}>
                            {(paymentMode === 'upi' || paymentMode === 'card' || paymentMode === 'online' || paymentMode === 'netbanking') && <Text style={styles.checkMark}>✓</Text>}
                          </View>
                          <Text style={styles.checkText}>UPI / Online</Text>
                        </View>
                      </View>
                    </View>

                    {/* Row 7: Txn / Ref No (if available) */}
                    {receipt.idempotencyKey ? (
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Txn / Ref No.:</Text>
                        <View style={styles.lineFill}>
                          <Text style={styles.fieldValueSmall}>{receipt.idempotencyKey}</Text>
                          <View style={styles.dotLine} />
                        </View>
                      </View>
                    ) : null}

                  </View>

                  {/* 4. Footer (Bottom chant line removed) */}
                  <View style={styles.footerSection}>
                    <Text style={styles.thankYouText}>❖ Thank you for your generous contribution! ❖</Text>
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
                    <Text style={styles.imageShareBtnText}>Share Receipt Image (WhatsApp)</Text>
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
                  <Text style={styles.whatsappDirectBtnText}>Send Message to WhatsApp (+91 {donorMobile})</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Done / New Collection ✓</Text>
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
    backgroundColor: 'rgba(23, 35, 60, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  container: {
    width: '100%',
    maxHeight: '98%',
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  successIcon: { fontSize: 14 },
  successText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* ── Clean Receipt Card Styling ── */
  receiptContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginVertical: 4
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: '#781D1D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5
  },
  innerBorder: {
    borderWidth: 1.2,
    borderColor: '#781D1D',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FFFDF9'
  },

  /* Top Header Row (Left: Dengi Pawti | Right: Meta) */
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  dengiPillBadge: {
    backgroundColor: '#781D1D',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  dengiPillText: {
    color: '#FFFDF9',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  topMetaRight: {
    alignItems: 'flex-end'
  },
  metaText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 13
  },
  metaValue: {
    color: '#781D1D',
    fontWeight: '800'
  },

  /* Mandal Header Section */
  mandalHeaderSection: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4
  },
  topCenterChant: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#781D1D',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  mandalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4
  },
  ganeshaIcon: {
    fontSize: 22
  },
  mandalLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 0.8,
    borderColor: '#FED7AA'
  },
  mandalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#781D1D',
    textAlign: 'center',
    flexShrink: 1,
    letterSpacing: 0.2
  },

  dividerLine: {
    height: 1.2,
    backgroundColor: '#F3E8E8',
    marginVertical: 8
  },

  /* Body */
  bodySection: {
    gap: 10,
    marginVertical: 2
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 6,
    minWidth: 105
  },
  lineFill: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative'
  },
  fieldValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#781D1D',
    paddingBottom: 2
  },
  fieldValueWords: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#781D1D',
    paddingBottom: 2,
    lineHeight: 15
  },
  fieldValueSmall: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#781D1D',
    paddingBottom: 2
  },
  dotLine: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
    borderStyle: 'dashed',
    marginTop: 2
  },
  amountBox: {
    borderWidth: 1.5,
    borderColor: '#781D1D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#FFF7ED'
  },
  amountBoxText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#781D1D'
  },

  /* Checkboxes */
  checkboxesRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap'
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  boxCheck: {
    width: 14,
    height: 14,
    borderWidth: 1.2,
    borderColor: '#781D1D',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  boxCheckActive: {
    backgroundColor: '#781D1D'
  },
  checkMark: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900'
  },
  checkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151'
  },

  /* Footer */
  footerSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E8E8',
    alignItems: 'center'
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#781D1D',
    textAlign: 'center'
  },

  /* Action Buttons */
  actionContainer: {
    width: '100%',
    maxWidth: 380,
    marginTop: 12,
    gap: 8
  },
  imageShareBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  imageShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  whatsappDirectBtn: {
    backgroundColor: '#25D366',
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
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  btnIcon: {
    fontSize: 16
  }
});
