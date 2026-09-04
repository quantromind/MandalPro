import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Switch, Platform, StatusBar, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import client, { API_URL } from '../api/client';

const PLANS = [
  {
    id: 'Silver', price: 199, label: '₹199', period: '/month', color: '#0EA5E9',
    badge: 'Affordable',
    tagline: 'सिल्व्हर योजना (१५ सदस्य)',
    features: [
      '१ मंडळ संपूर्ण व्यवस्थापन',
      '१५ समिती सदस्य व स्वयंसेवक',
      'अमर्यादित WhatsApp डिजिटल पावत्या',
      'खर्च आणि अंदाजपत्रक (Budget) ट्रॅकिंग',
      'समिती लाइव्ह ग्रुप चॅट'
    ],
    cta: 'सिल्व्हर योजना निवडा (₹199)'
  },
  {
    id: 'Gold', price: 299, label: '₹299', period: '/month', color: '#F97316',
    badge: '🔥 सर्वाधिक पसंती • BEST VALUE',
    tagline: 'गोल्ड मेंबरशिप (२५ सदस्य)',
    features: [
      '२ मंडळे / शाखा संपूर्ण व्यवस्थापन',
      '२५ समिती सदस्य व स्वयंसेवक',
      'अधिकृत शिक्का व लोगो असलेली पावती',
      'खर्च मंजुरी व बिलांचे फोटो साठवणूक',
      'सीए ऑडिट-रेडी ताळेबंद अहवाल',
      '२४/७ प्राधान्य WhatsApp सहाय्य'
    ],
    cta: 'गोल्ड मेंबरशिप निवडा (₹299)'
  }
];

function getRecommendedPlan(mandal) {
  const count = mandal?.memberCount || 0;
  return count > 15 ? 'Gold' : 'Silver';
}

import { useLanguage } from '../context/LanguageContext';

export default function SubscriptionScreen({ navigation }) {
  const { user, mandal, updateMandal, logout, refreshProfile } = useAuth();
  const { t, language } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState(getRecommendedPlan(mandal));
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState(null);

  const recommended = getRecommendedPlan(mandal);

  const effectivePrice = (plan) => {
    if (!plan.price) return plan.label;
    const p = annual ? Math.round(plan.price * 0.8) : plan.price;
    return p === 0 ? '₹0' : `₹${p}`;
  };

  const handleSelect = async () => {
    const plan = PLANS.find(p => p.id === selectedPlan);

    if (selectedPlan === 'Enterprise') {
      Alert.alert(t('subscription.enterprisePlan'), t('subscription.enterpriseTeamContact'), [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      `${selectedPlan} Plan`,
      `${t('subscription.selectPaymentMethod')} ${effectivePrice(PLANS.find(p => p.id === selectedPlan))}${annual ? t('subscription.perMonthAnnual') : t('subscription.perMonth')}:`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: `⚡ ${t('subscription.instantTestActivate')}`,
          onPress: async () => {
            setLoading(true);
            try {
              await client.patch('/onboarding/plan', { plan: selectedPlan });
              await updateMandal({
                ...mandal,
                checklist: { ...mandal?.checklist, planSelected: true, profileComplete: true },
                onboardingComplete: true,
                plan: selectedPlan,
                planStatus: 'Active'
              });

              // Refresh profile so AuthContext and RootNavigator receive latest server state
              await refreshProfile();

              Alert.alert(
                t('subscription.planActivated'),
                t('subscription.planActivatedDesc', { plan: selectedPlan }),
                [{
                  text: t('subscription.continueToDashboard'),
                  onPress: () => {
                    if (navigation?.canGoBack && navigation.canGoBack()) {
                      navigation.goBack();
                    }
                  }
                }]
              );
            } catch (e) {
              Alert.alert(t('common.error'), e.response?.data?.message || 'Activation failed');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: `${t('subscription.razorpayGateway')} →`,
          onPress: async () => {
            setLoading(true);
            try {
              const { data: orderData } = await client.post('/payments/create-order', { plan: selectedPlan });
              setCheckoutConfig({
                ...orderData,
                userName: user?.name || '',
                userEmail: user?.email || '',
                selectedPlan
              });
            } catch (e) {
              Alert.alert(t('common.error'), e.response?.data?.message || 'Payment failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <Modal visible={!!checkoutConfig} animationType="slide" onRequestClose={() => setCheckoutConfig(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {checkoutConfig && (
            <WebView
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              javaScriptCanOpenWindowsAutomatically={true}
              setSupportMultipleWindows={false}
              allowsBackForwardNavigationGestures={true}
              mixedContentMode="always"
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              startInLoadingState={true}
              onShouldStartLoadWithRequest={() => true}
              source={{
                uri: `${API_URL}/payments/checkout-page?orderId=${checkoutConfig.orderId}&amount=${checkoutConfig.amount}&currency=${checkoutConfig.currency}&keyId=${checkoutConfig.keyId}&plan=${checkoutConfig.selectedPlan}&name=${encodeURIComponent(checkoutConfig.userName)}&email=${encodeURIComponent(checkoutConfig.userEmail)}`
              }}
              onMessage={async (event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'success') {
                    setCheckoutConfig(null);
                    setLoading(true);
                    const res = data.response;
                    await client.post('/payments/verify', {
                      razorpay_order_id: res.razorpay_order_id,
                      razorpay_payment_id: res.razorpay_payment_id,
                      razorpay_signature: res.razorpay_signature,
                      plan: checkoutConfig.selectedPlan
                    });
                    await updateMandal({
                      ...mandal,
                      checklist: { ...mandal?.checklist, planSelected: true, profileComplete: true },
                      onboardingComplete: true,
                      plan: checkoutConfig.selectedPlan,
                      planStatus: 'Active'
                    });
                    // Refresh profile so RootNavigator re-evaluates and auto-navigates to Home
                    await refreshProfile();
                    Alert.alert(
                      t('subscription.paymentSuccessful'),
                      t('subscription.planActivatedDesc', { plan: checkoutConfig.selectedPlan }),
                      [{
                        text: t('subscription.continueToDashboard'),
                        onPress: () => {
                          if (navigation?.canGoBack && navigation.canGoBack()) {
                            navigation.goBack();
                          }
                        }
                      }]
                    );
                  } else if (data.type === 'cancel' || data.type === 'modal_dismissed') {
                    // Modal dismissed or closed
                  } else if (data.type === 'error') {
                    Alert.alert(t('subscription.paymentFailed'), data.error?.description || 'Payment was unsuccessful. Please choose a supported test method (e.g. HDFC/SBI Netbanking or Test Card) or use 1-Click Test Payment.');
                  }
                } catch (e) {
                  setCheckoutConfig(null);
                  setLoading(false);
                  Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                }
              }}
            />
          )}
          <TouchableOpacity style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' }} onPress={() => setCheckoutConfig(null)}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{t('subscription.cancelPayment')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Back Button if navigated from Settings/Profile */}
        {navigation.canGoBack() && (
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>← {t('subscription.backToProfile')}</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerPill}>
            <Text style={s.headerPillText}>💎 APLA MANDAL MEMBERSHIP PLANS</Text>
          </View>
          <Text style={s.title}>
            {mandal?.planStatus === 'Expired'
              ? (language === 'mr' ? 'मेंबरशिप नूतनीकरण करा' : 'Renew Your Membership')
              : (language === 'mr' ? 'सोप्या व पारदर्शक मासिक योजना' : 'Simple & Transparent Monthly Plans')}
          </Text>
          <Text style={s.sub}>
            {language === 'mr'
              ? 'क्लाउड लेजर, WhatsApp पावत्या, खर्च ऑडिट आणि मराठी संवाद एकाच ठिकाणी.'
              : 'Enterprise-grade cloud ledger, instant WhatsApp receipts, expense audits, and bilingual Marathi communication.'}
          </Text>
        </View>

        {/* Expired Plan Alert */}
        {mandal?.planStatus === 'Expired' && (
          <View style={s.expiredBanner}>
            <Text style={s.expiredIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.expiredTitle}>{t('subscription.subscriptionExpired')}</Text>
              <Text style={s.expiredSub}>
                {t('subscription.expiredSub')}
              </Text>
            </View>
          </View>
        )}

        {/* Recommendation Banner */}
        {mandal?.eventTypes?.length > 0 && mandal?.planStatus !== 'Expired' && (
          <View style={s.recBanner}>
            <Text style={s.recIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.recTitle}>{t('subscription.recommendedForYou')}</Text>
              <Text style={s.recSub}>
                {t('subscription.recReason', { count: mandal.eventTypes.length, plan: recommended })}
              </Text>
            </View>
          </View>
        )}

        {/* Billing Segmented Switch */}
        <View style={s.billingWrapper}>
          <TouchableOpacity
            style={[s.billingSegment, !annual && s.billingSegmentActive]}
            onPress={() => setAnnual(false)}
            activeOpacity={0.8}
          >
            <Text style={[s.billingSegmentText, !annual && s.billingSegmentTextActive]}>
              {language === 'mr' ? 'मासिक (Monthly)' : 'MONTHLY'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.billingSegment, annual && s.billingSegmentActive]}
            onPress={() => setAnnual(true)}
            activeOpacity={0.8}
          >
            <Text style={[s.billingSegmentText, annual && s.billingSegmentTextActive]}>
              {language === 'mr' ? 'वार्षिक (Annual)' : 'ANNUAL'}
            </Text>
            <View style={s.saveBadgePill}>
              <Text style={s.saveBadgeText}>SAVE 20%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isGold = plan.id === 'Gold';

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                s.planCard,
                isGold && s.goldPlanCard,
                isSelected && { borderColor: plan.color, borderWidth: 2.5, backgroundColor: `${plan.color}0A` },
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.85}
            >
              {plan.badge && (
                <View style={[s.badge, { backgroundColor: plan.color }]}>
                  <Text style={s.badgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={s.planTop}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[s.planName, { color: plan.color }]}>{plan.id} Pro</Text>
                  <Text style={s.planTagline}>{plan.tagline}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.planPrice}>{effectivePrice(plan)}</Text>
                  {plan.price !== null && plan.price > 0 && (
                    <Text style={s.planPeriod}>
                      {annual ? (language === 'mr' ? '/महिना (वार्षिक)' : '/mo billed annually') : (language === 'mr' ? '/महिना' : '/month')}
                    </Text>
                  )}
                </View>
              </View>

              <View style={s.features}>
                {plan.features.map((f) => (
                  <View key={f} style={s.featureRow}>
                    <Text style={[s.featureDot, { color: plan.color }]}>✓</Text>
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={[s.cardSelectBar, isSelected && { backgroundColor: plan.color }]}>
                <Text style={[s.cardSelectText, isSelected && { color: '#FFFFFF' }]}>
                  {isSelected ? `✓ ${language === 'mr' ? 'निवडलेली योजना' : 'Selected Plan'}` : (language === 'mr' ? 'निवडण्यासाठी स्पर्श करा' : 'Tap to Select')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleSelect}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaText}>
              {selectedPlan === 'Gold'
                ? (language === 'mr' ? '⚡ गोल्ड मेंबरशिप सुरू करा (₹299/महिना) →' : '⚡ Choose Gold Membership (₹299/mo) →')
                : (language === 'mr' ? '⚡ सिल्व्हर योजना सुरू करा (₹199/महिना) →' : '⚡ Choose Silver Plan (₹199/mo) →')}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={s.footer}>🔒 100% Secure Payments via Razorpay • 256-bit SSL Encryption</Text>

        <TouchableOpacity style={s.logoutLink} onPress={logout}>
          <Text style={s.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#172554',
  },
  header: { alignItems: 'center', marginBottom: 20 },
  headerPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  headerPillText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 6, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, paddingHorizontal: 10 },

  recBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.08)', borderRadius: 16,
    padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  recIcon: { fontSize: 20 },
  recTitle: { fontSize: 13, fontWeight: '800', color: '#F97316', marginBottom: 2 },
  recSub: { fontSize: 12, color: '#172554', lineHeight: 18, fontWeight: '500' },

  expiredBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 16,
    padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  expiredIcon: { fontSize: 20 },
  expiredTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626', marginBottom: 2 },
  expiredSub: { fontSize: 12, color: '#172554', lineHeight: 18, fontWeight: '500' },

  /* Segmented Billing Switch */
  billingWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  billingSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  billingSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  billingSegmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  billingSegmentTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  saveBadgePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  goldPlanCard: {
    borderColor: '#FED7AA',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderBottomLeftRadius: 12,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 6 },
  planName: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  planTagline: { fontSize: 12.5, color: '#64748B', fontWeight: '500' },
  planPrice: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4 },
  planPeriod: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  features: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.05)',
    paddingTop: 12,
    gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  featureDot: { fontSize: 14, fontWeight: '900', marginTop: -1 },
  featureText: { fontSize: 12.5, color: '#334155', flex: 1, fontWeight: '500', lineHeight: 18 },

  cardSelectBar: {
    marginTop: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cardSelectText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },

  ctaBtn: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 11.5, color: '#94A3B8', fontWeight: '500', lineHeight: 16 },
  logoutLink: { alignItems: 'center', marginTop: 14, paddingVertical: 8 },
  logoutText: { color: '#EF4444', fontSize: 13.5, fontWeight: '700' },
});
