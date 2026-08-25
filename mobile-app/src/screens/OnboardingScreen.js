import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
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
        Alert.alert('Selection required', 'Please keep at least one festival/event type selected.');
        return;
      }
      setSelectedTypes(selectedTypes.filter(t => t !== id));
    } else {
      setSelectedTypes([...selectedTypes, id]);
    }
  };

  const pickLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to choose a logo.');
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
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!presidentName.trim()) {
      Alert.alert('Missing Name', 'Please enter the President / Your full name.');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!mandalName.trim()) {
      Alert.alert('Missing Mandal Name', 'Please enter the official name of your Mandal.');
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
      Alert.alert('Setup Error', err.response?.data?.message || 'Failed to save Mandal details.');
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
              <Text style={styles.badgeText}>👑 PRESIDENT & MANDAL SETUP</Text>
            </View>
            <Text style={styles.title}>Complete Your Mandal Setup</Text>
            <Text style={styles.subtitle}>
              Fill in your details and Mandal information to start managing donations, issuing digital receipts, and adding team members.
            </Text>
          </View>

          {/* Section 1: President Personal Info */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>👤 President Details</Text>

            <Text style={styles.label}>President Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Patil"
              placeholderTextColor="#9ca3af"
              value={presidentName}
              onChangeText={setPresidentName}
            />

            <Text style={styles.label}>Mobile / Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={t => setMobile(t.replace(/[^0-9]/g, ''))}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email}
              editable={false}
            />
          </View>

          {/* Section 2: Mandal Details & Branding */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>🚩 Mandal Information</Text>

            <Text style={styles.label}>Mandal Official Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. सखी मित्र मंडळ (Sakhee Mitra Mandal)"
              placeholderTextColor="#9ca3af"
              value={mandalName}
              onChangeText={setMandalName}
            />

            {/* Logo Upload */}
            <Text style={styles.label}>Mandal Logo / Image (Optional)</Text>
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
                    {logoBase64 ? '📷 Change Photo' : '📷 Upload Logo'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.logoNote}>Printed on all digital WhatsApp receipts</Text>
              </View>
            </View>

            {/* Festival / Event Types */}
            <Text style={styles.label}>Festivals & Events Managed</Text>
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
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{e.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Mandal Area / Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sadashiv Peth, Pune"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.label}>Mandal UPI ID for QR / Online Payments (Optional)</Text>
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
              <Text style={styles.submitButtonText}>Complete Setup & Continue →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutLink} onPress={logout}>
            <Text style={styles.logoutText}>Cancel & Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8F6' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8
  },
  badgeText: { color: '#B45309', fontWeight: '800', fontSize: 11 },
  title: { fontSize: 24, fontWeight: '800', color: '#17233C', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13.5, color: '#6B7280', textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeading: { fontSize: 17, fontWeight: '800', color: '#17233C', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14.5,
    color: '#17233C'
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF'
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginTop: 4
  },
  logoPreview: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#fff' },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  logoNote: { fontSize: 11, color: '#9A3412', marginTop: 4 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6
  },
  chipActive: { borderColor: '#FF6B00', backgroundColor: '#FFF7ED' },
  chipIcon: { fontSize: 15 },
  chipText: { fontSize: 12.5, color: '#4B5563', fontWeight: '600' },
  chipTextActive: { color: '#FF6B00', fontWeight: '800' },

  submitButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  logoutLink: { alignItems: 'center', marginTop: 14 },
  logoutText: { color: '#EF4444', fontSize: 13.5, fontWeight: '600' }
});
