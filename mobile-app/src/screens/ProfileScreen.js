import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
  Image, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const MEMBER_ROLES = [
  { id: 'volunteer', label: 'Volunteer / Collector' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'secretary', label: 'Secretary' }
];

export default function ProfileScreen() {
  const { user, mandal, logout, refreshProfile, updateMandal } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Member Management State (For President)
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [memberRole, setMemberRole] = useState('volunteer');

  const isPresident = user?.role === 'president' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const loadMembers = async () => {
    if (!isPresident) return;
    try {
      setLoadingMembers(true);
      const { data } = await client.get('/members');
      setMembers(data);
    } catch (err) {
      console.log('Error loading members', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      if (isPresident) loadMembers();
    }, [isPresident])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    if (isPresident) await loadMembers();
    setRefreshing(false);
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

        setUploadingLogo(true);
        await client.put('/mandal', { logoBase64: base64Uri });
        await updateMandal({ logoBase64: base64Uri });
        Alert.alert('Success!', 'Mandal logo updated! It will now be printed on all digital receipts.');
      }
    } catch (err) {
      Alert.alert('Upload Error', err.response?.data?.message || 'Failed to update logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberName.trim() || !memberEmail.trim()) {
      Alert.alert('Missing Fields', 'Member name and email address are required.');
      return;
    }

    if (!memberEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setAddingMember(true);
    try {
      await client.post('/members', {
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        mobile: memberMobile.trim() || undefined,
        role: memberRole
      });

      setShowMemberModal(false);
      setMemberName('');
      setMemberEmail('');
      setMemberMobile('');
      setMemberRole('volunteer');
      Alert.alert(
        'Member Added! 🎉',
        `${memberName.trim()} can now download the app and sign in using OTP sent to ${memberEmail.trim().toLowerCase()} for free without paying.`
      );
      loadMembers();
    } catch (err) {
      Alert.alert('Error Adding Member', err.response?.data?.message || 'Could not add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (id, name) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name} from this Mandal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/members/${id}`);
              Alert.alert('Removed', `${name} has been removed.`);
              loadMembers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove member.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ padding: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      
      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{user?.name}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <View style={[styles.badge, isPresident ? styles.badgePresident : styles.badgeMember]}>
          <Text style={[styles.badgeText, isPresident ? styles.badgeTextPresident : styles.badgeTextMember]}>
            {user?.role === 'president' ? '👑 MANDAL PRESIDENT' : '🛡️ MANDAL MEMBER / COLLECTOR'}
          </Text>
        </View>
        
        {user?.mobile ? (
          <Text style={styles.info}>📞 {user.mobile}</Text>
        ) : null}
      </View>

      {/* Member Permissions & Info Box (For Non-President Members) */}
      {!isPresident && mandal && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mandal Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Mandal Name</Text>
            <Text style={styles.value}>{mandal.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Account Access</Text>
            <Text style={[styles.value, { color: '#10B981', fontWeight: '700' }]}>Free Member Access ✓</Text>
          </View>

          <View style={styles.memberPerksBox}>
            <Text style={styles.perksTitle}>Your Enabled Permissions:</Text>
            <Text style={styles.perkItem}>• Record new collections & add donors</Text>
            <Text style={styles.perkItem}>• Generate official digital WhatsApp receipts</Text>
            <Text style={styles.perkItem}>• Submit expense reimbursement requests & bills</Text>
            <Text style={styles.perkItem}>• Track approval status of submitted requests</Text>
          </View>
        </View>
      )}

      {/* President Management: Team Members */}
      {isPresident && (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <Text style={styles.sectionSub}>Add members to log in via OTP for free</Text>
            </View>
            <TouchableOpacity
              style={styles.addMemberBtn}
              onPress={() => setShowMemberModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addMemberBtnText}>+ Add Member</Text>
            </TouchableOpacity>
          </View>

          {loadingMembers ? (
            <ActivityIndicator color="#FF6B00" style={{ marginVertical: 20 }} />
          ) : members.length > 0 ? (
            <View style={{ width: '100%', marginTop: 8 }}>
              {members.map((m) => (
                <View key={m._id} style={styles.memberListItem}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.name?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberEmail}>{m.email}</Text>
                    <Text style={styles.memberRoleTag}>
                      {m.role === 'president' ? '👑 President' : m.role === 'treasurer' ? '💰 Treasurer' : m.role === 'secretary' ? '📝 Secretary' : '🛡️ Volunteer / Collector'}
                    </Text>
                  </View>
                  {m.role !== 'president' && (
                    <TouchableOpacity
                      style={styles.removeMemberBtn}
                      onPress={() => handleRemoveMember(m._id, m.name)}
                    >
                      <Text style={styles.removeMemberBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noMembersBox}>
              <Text style={styles.noMembersText}>No members added yet. Tap "+ Add Member" to add collectors.</Text>
            </View>
          )}
        </View>
      )}

      {/* President Management: Branding & Mandal Info */}
      {isPresident && mandal && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mandal Branding & Details</Text>

          {/* Logo Management */}
          <View style={styles.logoSection}>
            {mandal.logoBase64 || mandal.logoUrl ? (
              <Image
                source={{ uri: mandal.logoBase64 || mandal.logoUrl }}
                style={styles.mandalLogoPreview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.mandalLogoPlaceholder}>
                <Text style={styles.placeholderIcon}>🪔</Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 16 }}>
              <TouchableOpacity
                style={[styles.uploadBtn, uploadingLogo && { opacity: 0.7 }]}
                onPress={pickLogo}
                disabled={uploadingLogo}
                activeOpacity={0.8}
              >
                {uploadingLogo ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>
                    {mandal.logoBase64 ? '📷 Change Logo' : '📷 Add Mandal Logo'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.logoHint}>Printed on all receipts & WhatsApp messages</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{mandal.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Subscription Plan</Text>
            <Text style={styles.value}>{mandal.plan}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Plan Status</Text>
            <Text style={[styles.value, { color: mandal.planStatus === 'Active' ? '#10B981' : '#EF4444' }]}>
              {mandal.planStatus}
            </Text>
          </View>
          
          {mandal.planRenewsAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Renews On</Text>
              <Text style={styles.value}>{new Date(mandal.planRenewsAt).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      )}

      {isSuperAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>System Administrator</Text>
          <Text style={styles.info}>You have full access to all system features and can manage all Mandals from the web dashboard.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* ── Add Member Modal ── */}
      <Modal visible={showMemberModal} animationType="slide" transparent={true} onRequestClose={() => setShowMemberModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>Add Team Member</Text>
            <Text style={styles.modalSubheading}>
              Added members can sign in to the mobile app for free using an email OTP.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Member Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#9ca3af"
                value={memberName}
                onChangeText={setMemberName}
              />

              <Text style={styles.inputLabel}>Email Address (For OTP Login) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. rahul@gmail.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={memberEmail}
                onChangeText={setMemberEmail}
              />

              <Text style={styles.inputLabel}>Mobile Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={10}
                value={memberMobile}
                onChangeText={setMemberMobile}
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleChipsRow}>
                {MEMBER_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleChip, memberRole === r.id && styles.roleChipActive]}
                    onPress={() => setMemberRole(r.id)}
                  >
                    <Text style={[styles.roleChipText, memberRole === r.id && styles.roleChipTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, addingMember && { opacity: 0.7 }]}
              onPress={handleAddMember}
              disabled={addingMember}
            >
              {addingMember ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Add Member to Mandal →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMemberModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F6',
  },
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
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'center'
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B00',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17233C',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 10
  },
  badgePresident: { backgroundColor: '#FEF3C7' },
  badgeMember: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 11.5, fontWeight: '800' },
  badgeTextPresident: { color: '#B45309' },
  badgeTextMember: { color: '#15803D' },
  info: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17233C',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  addMemberBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  addMemberBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700'
  },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151'
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#17233C'
  },
  memberEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1
  },
  memberRoleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B00',
    marginTop: 2
  },
  removeMemberBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeMemberBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700'
  },
  noMembersBox: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6
  },
  noMembersText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center'
  },
  memberPerksBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    marginTop: 12
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6
  },
  perkItem: {
    fontSize: 12.5,
    color: '#15803D',
    lineHeight: 18,
    fontWeight: '500'
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  mandalLogoPreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  mandalLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 26,
  },
  uploadBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  logoHint: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 4,
    lineHeight: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 30
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 14
  },
  modalHeading: { fontSize: 20, fontWeight: '800', color: '#17233C', marginBottom: 4 },
  modalSubheading: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 12, fontSize: 14.5, color: '#17233C'
  },
  roleChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  roleChip: {
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16
  },
  roleChipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  roleChipText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  roleChipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 18
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' }
});
