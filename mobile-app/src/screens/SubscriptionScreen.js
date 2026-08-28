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
    id: 'Basic', price: 199, label: '₹199', period: '/month', color: '#64748B',
    tagline: 'Perfect to get started',
    features: ['1 Mandal', 'Up to 5 events/year', 'Basic receipts', 'Up to 10 members', 'Dashboard & reports'],
    cta: 'Choose Basic'
  },
  {
    id: 'Pro', price: 499, label: '₹499', period: '/month', color: '#FF6B00',
    badge: 'Most Popular',
    tagline: 'For active mandals',
    features: ['1 Mandal', 'Unlimited events', 'Custom receipt branding', 'Up to 25 members', 'Verified badge', 'Priority support'],
    cta: 'Choose Pro'
  },
  {
    id: 'Premium', price: 999, label: '₹999', period: '/month', color: '#6C4DD9',
    badge: 'Best Value',
    tagline: 'For multi-mandal organizations',
    features: ['3 Mandals', 'Unlimited events', 'Full branding', 'Unlimited members', 'Verified badge', 'Analytics export'],
    cta: 'Choose Premium'
  },
  {
    id: 'Enterprise', price: null, label: 'Custom', period: '', color: '#10B981',
    tagline: 'For large trusts & federations',
    features: ['Unlimited Mandals', 'Everything in Premium', 'White-label', 'API access', 'SLA support'],
    cta: 'Contact Sales'
  }
];

function getRecommendedPlan(mandal) {
  const types = mandal?.eventTypes || [];
  if (types.length >= 3) return 'Premium';
  if (types.length >= 2) return 'Pro';
  return 'Basic';
}

import { useLanguage } from '../context/LanguageContext';

export default function SubscriptionScreen({ navigation }) {
  const { user, mandal, updateMandal, logout, refreshProfile } = useAuth();
  const { t } = useLanguage();

  const PLANS = [
    {
      id: 'Basic', price: 199, label: '₹199', period: t('subscription.perMonth'), color: '#64748B',
      tagline: t('subscription.plans.basicTagline'),
      features: [
        t('subscription.features.oneMandal'),
        t('subscription.features.fiveEvents'),
        t('subscription.features.basicReceipts'),
        t('subscription.features.tenMembers'),
        t('subscription.features.dashboardReports')
      ],
      cta: t('subscription.choosePlan', { plan: 'Basic' })
    },
    {
      id: 'Pro', price: 499, label: '₹499', period: t('subscription.perMonth'), color: '#FF6B00',
      badge: t('subscription.mostPopular'),
      tagline: t('subscription.plans.proTagline'),
      features: [
        t('subscription.features.oneMandal'),
        t('subscription.features.unlimitedEvents'),
        t('subscription.features.customBranding'),
        t('subscription.features.twentyFiveMembers'),
        t('subscription.features.verifiedBadge'),
        t('subscription.features.prioritySupport')
      ],
      cta: t('subscription.choosePlan', { plan: 'Pro' })
    },
    {
      id: 'Premium', price: 999, label: '₹999', period: t('subscription.perMonth'), color: '#6C4DD9',
      badge: t('subscription.bestValue'),
      tagline: t('subscription.plans.premiumTagline'),
      features: [
        t('subscription.features.threeMandals'),
        t('subscription.features.unlimitedEvents'),
        t('subscription.features.fullBranding'),
        t('subscription.features.unlimitedMembers'),
        t('subscription.features.verifiedBadge'),
        t('subscription.features.analyticsExport')
      ],
      cta: t('subscription.choosePlan', { plan: 'Premium' })
    },
    {
      id: 'Enterprise', price: null, label: t('subscription.custom'), period: '', color: '#10B981',
      tagline: t('subscription.plans.enterpriseTagline'),
      features: [
        t('subscription.features.unlimitedMandals'),
        t('subscription.features.everythingPremium'),
        t('subscription.features.whiteLabel'),
        t('subscription.features.apiAccess'),
        t('subscription.features.slaSupport')
      ],
      cta: t('subscription.contactSales')
    }
  ];

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
          <Text style={s.brand}>🪔 {t('nav.appTitle')}</Text>
          <Text style={s.title}>
            {mandal?.planStatus === 'Expired' ? t('subscription.renewTitle') : t('subscription.title')}
          </Text>
          <Text style={s.sub}>
            {mandal?.planStatus === 'Expired'
              ? t('subscription.expiredSub')
              : t('subscription.subtitle')}
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

        {/* Billing Toggle */}
        <View style={s.billingRow}>
          <Text style={[s.billingLabel, !annual && s.billingActive]}>{t('subscription.monthly')}</Text>
          <Switch
            value={annual}
            onValueChange={setAnnual}
            trackColor={{ false: '#E5E7EB', true: '#FF6B00' }}
            thumbColor={'#fff'}
          />
          <Text style={[s.billingLabel, annual && s.billingActive]}>
            {t('subscription.annual')} <Text style={s.saveBadge}>{t('subscription.save20')}</Text>
          </Text>
        </View>

        {/* Plan Cards */}
        {PLANS.map(plan => {
          const isSelected = selectedPlan === plan.id;
          const isRec = plan.id === recommended;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[s.planCard, isSelected && { borderColor: plan.color, borderWidth: 2, backgroundColor: `${plan.color}08` }]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {(plan.badge || isRec) && !isSelected && (
                <View style={[s.badge, { backgroundColor: plan.color }]}>
                  <Text style={s.badgeText}>{plan.badge || `⭐ ${t('subscription.recommended')}`}</Text>
                </View>
              )}
              {isSelected && (
                <View style={[s.badge, { backgroundColor: plan.color }]}>
                  <Text style={s.badgeText}>✓ {t('subscription.selected')}</Text>
                </View>
              )}

              <View style={s.planTop}>
                <View>
                  <Text style={[s.planName, { color: plan.color }]}>{plan.id}</Text>
                  <Text style={s.planTagline}>{plan.tagline}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.planPrice}>{effectivePrice(plan)}</Text>
                  {plan.price !== null && plan.price > 0 && (
                    <Text style={s.planPeriod}>{annual ? t('subscription.perMonthAnnual') : t('subscription.perMonth')}</Text>
                  )}
                </View>
              </View>

              {isSelected && (
                <View style={s.features}>
                  {plan.features.map(f => (
                    <View key={f} style={s.featureRow}>
                      <Text style={[s.featureDot, { color: plan.color }]}>✓</Text>
                      <Text style={s.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleSelect}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>
              {selectedPlan === 'Enterprise' ? `${t('subscription.contactSales')} →` : `${t('subscription.choosePlan', { plan: selectedPlan })} →`}
            </Text>
          }
        </TouchableOpacity>

        <Text style={s.footer}>🔒 {t('subscription.securePayments')}</Text>

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
  header: { alignItems: 'center', marginBottom: 24 },
  brand: { color: '#F97316', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#172554', textAlign: 'center', marginBottom: 6, letterSpacing: -0.3 },
  sub: { fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 20 },

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

  billingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20
  },
  billingLabel: { fontSize: 13.5, color: '#94A3B8', fontWeight: '700' },
  billingActive: { color: '#172554' },
  saveBadge: { fontSize: 11, color: '#10B981', fontWeight: '800' },

  planCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(23, 37, 84, 0.08)',
    shadowColor: '#172554', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    position: 'relative', overflow: 'hidden'
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 10
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  planName: { fontSize: 16.5, fontWeight: '800', marginBottom: 2 },
  planTagline: { fontSize: 12, color: '#64748B' },
  planPrice: { fontSize: 20, fontWeight: '800', color: '#172554' },
  planPeriod: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  features: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(23, 37, 84, 0.05)', paddingTop: 12, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureDot: { fontSize: 13, fontWeight: '800' },
  featureText: { fontSize: 13, color: '#334155', flex: 1, fontWeight: '500' },

  ctaBtn: {
    backgroundColor: '#F97316', borderRadius: 16, padding: 16,
    alignItems: 'center', marginTop: 10, marginBottom: 12,
    shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  logoutLink: { alignItems: 'center', marginTop: 14, paddingVertical: 8 },
  logoutText: { color: '#EF4444', fontSize: 13.5, fontWeight: '700' }
});
