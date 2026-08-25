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

export default function SubscriptionScreen({ navigation }) {
  const { user, mandal, updateMandal } = useAuth();
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
      Alert.alert('Enterprise Plan', 'Our team will contact you shortly.', [{ text: 'OK' }]);
      return;
    }

    // All plans require payment
    Alert.alert(
      `${selectedPlan} Plan`,
      `Select your payment method for ${effectivePrice(PLANS.find(p => p.id === selectedPlan))}${annual ? '/month (annual)' : '/month'}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '⚡ Instant Test Activate',
          onPress: async () => {
            setLoading(true);
            try {
              await client.patch('/onboarding/plan', { plan: selectedPlan });
              await updateMandal({ checklist: { ...mandal?.checklist, planSelected: true }, plan: selectedPlan, planStatus: 'Active' });
              Alert.alert('Success!', `${selectedPlan} plan activated!`);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Activation failed');
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'Razorpay Gateway →',
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
              Alert.alert('Error', e.response?.data?.message || 'Payment failed');
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
                    await updateMandal({ checklist: { ...mandal?.checklist, planSelected: true }, plan: checkoutConfig.selectedPlan, planStatus: 'Active' });
                    Alert.alert('Success!', `${checkoutConfig.selectedPlan} plan activated!`);
                  } else if (data.type === 'cancel' || data.type === 'modal_dismissed') {
                    // Modal dismissed or closed; user can retry with the button on screen or cancel
                  } else if (data.type === 'error') {
                    Alert.alert('Payment Failed', data.error?.description || 'Payment was unsuccessful.');
                  }
                } catch (e) {
                  setCheckoutConfig(null);
                  setLoading(false);
                  Alert.alert('Verification Error', e.response?.data?.message || e.message);
                }
              }}
            />
          )}
          <TouchableOpacity style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' }} onPress={() => setCheckoutConfig(null)}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel Payment</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>🪔 MandalPro</Text>
          <Text style={s.title}>Choose your Plan</Text>
          <Text style={s.sub}>Unlock the full power of MandalPro for your community.</Text>
        </View>

        {/* Recommendation Banner */}
        {mandal?.eventTypes?.length > 0 && (
          <View style={s.recBanner}>
            <Text style={s.recIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.recTitle}>Recommended for you</Text>
              <Text style={s.recSub}>
                You selected {mandal.eventTypes.length} event type{mandal.eventTypes.length !== 1 ? 's' : ''}. We suggest the <Text style={{ fontWeight: '800' }}>{recommended}</Text> plan.
              </Text>
            </View>
          </View>
        )}

        {/* Billing Toggle */}
        <View style={s.billingRow}>
          <Text style={[s.billingLabel, !annual && s.billingActive]}>Monthly</Text>
          <Switch
            value={annual}
            onValueChange={setAnnual}
            trackColor={{ false: '#E5E7EB', true: '#FF6B00' }}
            thumbColor={'#fff'}
          />
          <Text style={[s.billingLabel, annual && s.billingActive]}>
            Annual <Text style={s.saveBadge}> Save 20%</Text>
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
                  <Text style={s.badgeText}>{plan.badge || '⭐ Recommended'}</Text>
                </View>
              )}
              {isSelected && (
                <View style={[s.badge, { backgroundColor: plan.color }]}>
                  <Text style={s.badgeText}>✓ Selected</Text>
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
                    <Text style={s.planPeriod}>{annual ? '/mo (annual)' : '/month'}</Text>
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
              {selectedPlan === 'Enterprise' ? 'Contact Sales →' : `Choose ${selectedPlan} →`}
            </Text>
          }
        </TouchableOpacity>

        <Text style={s.footer}>🔒 Secure payments via Razorpay · Cancel anytime</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  brand: { color: '#FF6B00', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#17233C', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  recBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,107,0,0.08)', borderRadius: 12,
    padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)'
  },
  recIcon: { fontSize: 20 },
  recTitle: { fontSize: 13, fontWeight: '700', color: '#FF6B00', marginBottom: 2 },
  recSub: { fontSize: 12, color: '#374151', lineHeight: 18 },

  billingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20
  },
  billingLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  billingActive: { color: '#17233C' },
  saveBadge: { fontSize: 11, color: '#10B981', fontWeight: '700' },

  planCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    position: 'relative', overflow: 'hidden'
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 10
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  planName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  planTagline: { fontSize: 12, color: '#9CA3AF' },
  planPrice: { fontSize: 20, fontWeight: '800', color: '#17233C' },
  planPeriod: { fontSize: 11, color: '#9CA3AF' },
  features: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F0F0EE', paddingTop: 12, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureDot: { fontSize: 13, fontWeight: '700' },
  featureText: { fontSize: 13, color: '#374151', flex: 1 },

  ctaBtn: {
    backgroundColor: '#FF6B00', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 12,
    shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' }
});
