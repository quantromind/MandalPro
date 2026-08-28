import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';

const EVENT_TYPES = [
  { id: 'Ganesh Utsav', icon: '🐘' },
  { id: 'Navratri',     icon: '🪔' },
  { id: 'Jayanti',      icon: '📿' },
  { id: 'Diwali',       icon: '✨' },
  { id: 'Wedding/Hall', icon: '💒' },
  { id: 'Custom',       icon: '⚙️' }
];

export default function OnboardingScreen() {
  const { user, mandal, refreshProfile, logout } = useAuth();
  const { t } = useLanguage();

  // Form State
  const [presidentName, setPresidentName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [mandalName, setMandalName] = useState(
    mandal?.name && !mandal.name.includes("'s Mandal") ? mandal.name : ''
  );
  const [selectedTypes, setSelectedTypes] = useState(
    mandal?.eventTypes?.length > 0 ? mandal.eventTypes : ['Ganesh Utsav']
  );
  const [address, setAddress] = useState(mandal?.address || '');
  const [upiId, setUpiId] = useState(mandal?.upiId || '');
  const [logoBase64, setLogoBase64] = useState(mandal?.logoBase64 || null);
  const [saving, setSaving] = useState(false);

  const toggleType = (id) => {
    if (selectedTypes.includes(id)) {
      if (selectedTypes.length === 1) {
        Alert.alert(t('register.selectionRequired'), t('register.keepOneEvent'));
        return;
      }
      setSelectedTypes(selectedTypes.filter(t => t !== id));
    } else {
      if (selectedTypes.length >= 3) {
        Alert.alert(t('register.limitReached'), t('register.maxThreeEvents'));
        return;
      }
      setSelectedTypes([...selectedTypes, id]);
    }
  };

  const pickLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('common.error'), t('profile.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setLogoBase64(base64Uri);
      }
    } catch (err) {
      Alert.alert(t('common.error'), 'Could not open image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!presidentName.trim()) {
      Alert.alert(t('common.error'), t('register.errors.nameRequired'));
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      Alert.alert(t('common.error'), t('register.errors.mobileInvalid'));
      return;
    }
    if (!mandalName.trim()) {
      Alert.alert(t('common.error'), t('register.errors.mandalRequired'));
      return;
    }

    setSaving(true);
    try {
      await client.put('/auth/profile', {
        name: presidentName.trim(),
        mobile: mobile.trim(),
        mandalName: mandalName.trim(),
        logoBase64: logoBase64 || undefined,
        eventTypes: selectedTypes,
        address: address.trim() || undefined,
        upiId: upiId.trim() || undefined
      });

      // Refresh auth context so RootNavigator immediately evaluates the completed profile
      await refreshProfile();
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to save Mandal details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>👑 {t('onboarding.setupBadge')}</Text>
            </View>
            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.subtitle')}
            </Text>
          </View>

          {/* Section 1: President Personal Info */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>👤 {t('onboarding.presidentDetails')}</Text>

            <Text style={styles.label}>{t('onboarding.presidentName')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Patil"
              placeholderTextColor="#9ca3af"
              value={presidentName}
              onChangeText={setPresidentName}
            />

            <Text style={styles.label}>{t('onboarding.mobileNumber')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={t => setMobile(t.replace(/[^0-9]/g, ''))}
            />

            <Text style={styles.label}>{t('auth.emailLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email}
              editable={false}
            />
          </View>

          {/* Section 2: Mandal Details & Branding */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>🚩 {t('onboarding.mandalInfo')}</Text>

            <Text style={styles.label}>{t('onboarding.mandalOfficialName')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. सखी मित्र मंडळ (Sakhee Mitra Mandal)"
              placeholderTextColor="#9ca3af"
              value={mandalName}
              onChangeText={setMandalName}
            />

            {/* Logo Upload */}
            <Text style={styles.label}>{t('onboarding.mandalLogo')}</Text>
            <View style={styles.logoRow}>
              {logoBase64 ? (
                <Image source={{ uri: logoBase64 }} style={styles.logoPreview} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={{ fontSize: 26 }}>🪔</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickLogo} activeOpacity={0.85}>
                  <Text style={styles.uploadBtnText}>
                    {logoBase64 ? t('profile.changeLogo') : t('profile.addLogo')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.logoNote}>{t('profile.logoHint')}</Text>
              </View>
            </View>

            {/* Festival / Event Types */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
              <Text style={styles.label}>{t('dashboard.festivalsAndEvents')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: selectedTypes.length === 3 ? '#FF6B00' : '#6B7280' }}>
                {t('register.selectedCount', { count: selectedTypes.length })}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
              {t('register.selectUpToThree')}
            </Text>
            <View style={styles.chipsRow}>
              {EVENT_TYPES.map(e => {
                const active = selectedTypes.includes(e.id);
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleType(e.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipIcon}>{e.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t(`events.types.${e.id}`) || e.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t('profile.address')} (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sadashiv Peth, Pune"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.label}>{t('profile.upiId')} (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. sakheemandal@upi"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={upiId}
              onChangeText={setUpiId}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, saving && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('onboarding.completeSetup')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutLink} onPress={logout}>
            <Text style={styles.logoutLinkText}>{t('common.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F4' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
    marginBottom: 8
  },
  badgeText: { color: '#B45309', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#172554', textAlign: 'center', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeading: { fontSize: 17, fontWeight: '800', color: '#172554', marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: '700', color: '#172554', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    fontSize: 14.5,
    color: '#172554'
  },
  inputDisabled: {
    backgroundColor: 'rgba(23, 37, 84, 0.04)',
    color: '#94A3B8'
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 12,
    marginTop: 4
  },
  logoPreview: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#FFFFFF' },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  uploadBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  logoNote: { fontSize: 11, color: '#9A3412', marginTop: 4 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F7F4',
    gap: 6
  },
  chipActive: { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.08)' },
  chipIcon: { fontSize: 15 },
  chipText: { fontSize: 12.5, color: '#475569', fontWeight: '700' },
  chipTextActive: { color: '#F97316', fontWeight: '800' },

  submitButton: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  logoutLink: { alignItems: 'center', marginTop: 14 },
  logoutText: { color: '#EF4444', fontSize: 13.5, fontWeight: '700' }
});
