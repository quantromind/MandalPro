import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
  Image, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageModal from '../components/LanguageModal';
import client from '../api/client';

export default function ProfileScreen({ navigation }) {
  const { user, mandal, logout, refreshProfile, updateMandal } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Mandal Profile Details State matching reference screenshot
  const [mandalName, setMandalName] = useState(mandal?.name || '');
  const [establishedYear, setEstablishedYear] = useState(String(mandal?.establishedYear || '2023'));
  const [address, setAddress] = useState(mandal?.address || '');
  const [upiId, setUpiId] = useState(mandal?.upiId || '');
  const [logoPreview, setLogoPreview] = useState(mandal?.logoBase64 || mandal?.logoUrl || '');
  const [savingMandal, setSavingMandal] = useState(false);

  useEffect(() => {
    if (mandal) {
      setMandalName(mandal.name || '');
      setEstablishedYear(String(mandal.establishedYear || '2023'));
      setAddress(mandal.address || '');
      setUpiId(mandal.upiId || '');
      setLogoPreview(mandal.logoBase64 || mandal.logoUrl || '');
    }
  }, [mandal]);

  const handleSaveMandal = async () => {
    try {
      setSavingMandal(true);
      const payload = {
        name: mandalName.trim(),
        establishedYear: establishedYear.trim(),
        address: address.trim(),
        upiId: upiId.trim(),
      };
      if (logoPreview && logoPreview.startsWith('data:')) {
        payload.logoBase64 = logoPreview;
      }
      try {
        const { data } = await client.patch('/mandal', payload);
        await updateMandal(data || payload);
      } catch (err1) {
        const { data } = await client.put('/mandal', payload);
        await updateMandal(data || payload);
      }
      Alert.alert(
        language === 'mr' ? 'यशस्वी!' : 'Success!',
        language === 'mr' ? 'मंडळ माहिती अद्ययावत केली! ✅' : 'Mandal details updated successfully! ✅'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update mandal details.');
    } finally {
      setSavingMandal(false);
    }
  };

  // Member Management State (For President)
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMobile, setMemberMobile] = useState('');
  const [memberRole, setMemberRole] = useState('volunteer');

  const MEMBER_ROLES = [
    { id: 'volunteer', label: t('profile.roles.volunteer') },
    { id: 'treasurer', label: t('profile.roles.treasurer') },
    { id: 'secretary', label: t('profile.roles.secretary') }
  ];

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState('warning'); // 'warning' | 'otp'
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isPresident = user?.role === 'president' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const handleOpenDeleteModal = () => {
    setDeleteStep('warning');
    setDeleteOtp('');
    setShowDeleteModal(true);
  };

  const handleRequestDeleteOtp = async () => {
    try {
      setSendingDeleteOtp(true);
      const { data } = await client.post('/auth/delete-account/send-otp');
      Alert.alert('Verification Code Sent', data.message || `A 6-digit code has been sent to ${user?.email}`);
      setDeleteStep('otp');
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setSendingDeleteOtp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOtp.trim() || deleteOtp.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setDeletingAccount(true);
      await client.post('/auth/delete-account', { code: deleteOtp.trim() });
      setShowDeleteModal(false);
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => logout()
          }
        ]
      );
    } catch (err) {
      Alert.alert('Deletion Failed', err.response?.data?.message || 'Failed to delete account. Please check the OTP.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const loadMembers = async () => {
    if (!isPresident) return;
    try {
      setLoadingMembers(true);
      const { data } = await client.get('/members');
      setMembers(data);
    } catch (err) {
      // ignore
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

        setLogoPreview(base64Uri);
        setUploadingLogo(true);
        try {
          await client.put('/mandal', { logoBase64: base64Uri });
          await updateMandal({ logoBase64: base64Uri });
        } catch (e) {
          try {
            await client.patch('/mandal', { logoBase64: base64Uri });
            await updateMandal({ logoBase64: base64Uri });
          } catch (e2) {
            // ignore
          }
        }
        Alert.alert('Success!', t('profile.logoUpdated') || 'Logo updated!');
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
        t('profile.memberAdded'),
        t('profile.memberAddedDesc', { name: memberName.trim(), email: memberEmail.trim().toLowerCase() })
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
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header matching user screenshot ── */}
        <View style={styles.headerSection}>
          <Text style={styles.screenMainTitle}>
            🚩 Mandal Profile (मंडळ प्रोफाइल)
          </Text>
          <Text style={styles.screenMainSub}>
            Mandal Branding & Details & Digital ID Cards
          </Text>
        </View>

        {/* ── Mandal Details Card matching user screenshot ── */}
        <View style={styles.mandalDetailsCard}>
          <Text style={styles.cardHeaderTitle}>🏛️ Mandal Details</Text>

          {/* Official Mandal Logo */}
          <Text style={styles.fieldLabel}>
            🚩 Official Mandal Logo (Printed on receipts)
          </Text>
          <TouchableOpacity
            style={styles.logoUploadBox}
            onPress={pickLogo}
            activeOpacity={0.8}
            disabled={uploadingLogo}
          >
            <View style={styles.logoCircleWrapper}>
              {logoPreview ? (
                <Image
                  source={{ uri: logoPreview }}
                  style={styles.logoCircleImg}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoCircleImg}
                  resizeMode="contain"
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>
                {logoPreview ? 'Custom logo selected ✓' : 'Upload custom logo'}
              </Text>
              <Text style={styles.uploadSub}>
                Click to select PNG, JPG or WEBP
              </Text>
            </View>

            <View style={styles.browseBtn}>
              {uploadingLogo ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Text style={styles.browseBtnText}>📁 Browse</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Mandal Name */}
          <Text style={styles.fieldLabel}>Mandal Name</Text>
          <TextInput
            style={styles.inputField}
            value={mandalName}
            onChangeText={setMandalName}
            placeholder="Mandal Name"
            placeholderTextColor="#94A3B8"
            editable={isPresident}
          />

          {/* Established Year */}
          <Text style={styles.fieldLabel}>🚩 Established Year</Text>
          <TextInput
            style={styles.inputField}
            value={establishedYear}
            onChangeText={setEstablishedYear}
            placeholder="e.g. 2023"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            editable={isPresident}
          />

          {/* Address */}
          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={[styles.inputField, styles.textAreaField]}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Shivaji Chowk, Pune"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            editable={isPresident}
          />

          {/* UPI ID */}
          <Text style={styles.fieldLabel}>💳 UPI ID (For Instant QR Code & Payments)</Text>
          <TextInput
            style={styles.inputField}
            value={upiId}
            onChangeText={setUpiId}
            placeholder="e.g. mandal@upi"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            editable={isPresident}
          />

          {/* Save Mandal Details Button */}
          {isPresident && (
            <TouchableOpacity
              style={styles.saveMandalBtn}
              onPress={handleSaveMandal}
              activeOpacity={0.88}
              disabled={savingMandal}
            >
              {savingMandal ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveMandalBtnText}>
                  💾 {language === 'mr' ? 'माहिती जतन करा' : 'Save Mandal Details'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* ── Profile Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'M'}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{user?.name || 'Mandal User'}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
          
          <View style={[styles.rolePill, isPresident ? styles.rolePillPresident : styles.rolePillMember]}>
            <Text style={[styles.rolePillText, isPresident ? styles.rolePillTextPresident : styles.rolePillTextMember]}>
              {user?.role === 'president' ? t('dashboard.presidentWorkspace') : t('dashboard.committeeMember')}
            </Text>
          </View>
          
          {user?.mobile ? (
            <View style={styles.heroPhoneRow}>
              <Text style={styles.phoneIcon}>📞</Text>
              <Text style={styles.heroPhoneText}>{user.mobile}</Text>
            </View>
          ) : null}
        </View>

        {/* Member Permissions & Info Box (For Non-President Members) */}
        {!isPresident && mandal && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{t('profile.mandalDetails')}</Text>
                <Text style={styles.sectionSub}>{t('profile.authorizedAccess')}</Text>
              </View>
              <View style={styles.memberAccessBadge}>
                <Text style={styles.memberAccessBadgeText}>{t('common.active')} ✓</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>{t('profile.mandalName')}</Text>
              <Text style={styles.value}>{mandal.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Account Access</Text>
              <Text style={[styles.value, { color: '#15803D', fontWeight: '800' }]}>{t('profile.freeMemberAccess')}</Text>
            </View>

            <View style={styles.memberPerksBox}>
              <Text style={styles.perksTitle}>{t('profile.enabledPermissions')}</Text>
              <Text style={styles.perkItem}>{t('profile.perm1')}</Text>
              <Text style={styles.perkItem}>{t('profile.perm2')}</Text>
              <Text style={styles.perkItem}>{t('profile.perm3')}</Text>
              <Text style={styles.perkItem}>{t('profile.perm4')}</Text>
            </View>
          </View>
        )}

        {/* President Management: Team Members */}
        {isPresident && (
          <View style={styles.card}>
            {/* Clean Section Header without overcrowding */}
            <View style={styles.teamHeaderContainer}>
              <View style={styles.teamTitleBadgeRow}>
                <Text style={styles.sectionTitle}>{t('profile.teamMembers')}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {members.length === 1
                      ? t('profile.singleMemberCount', { count: 1 })
                      : t('profile.memberCount', { count: members.length })}
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>{t('profile.addMemberOtpSub')}</Text>
            </View>

            {/* Dedicated, unconstrained Add Member Action Banner */}
            <TouchableOpacity
              style={styles.addMemberBanner}
              onPress={() => setShowMemberModal(true)}
              activeOpacity={0.82}
            >
              <View style={styles.addMemberBannerIconBox}>
                <Text style={styles.addMemberBannerIcon}>＋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addMemberBannerTitle}>{t('profile.addMember')}</Text>
                <Text style={styles.addMemberBannerSub}>
                  {language === 'mr'
                    ? 'नवीन कार्यकारी सदस्यांना मोफत OTP द्वारे जोडा'
                    : 'Invite committee members & collectors via OTP'}
                </Text>
              </View>
              <View style={styles.addMemberArrowPill}>
                <Text style={styles.addMemberArrowText}>➔</Text>
              </View>
            </TouchableOpacity>

            {loadingMembers ? (
              <ActivityIndicator color="#F97316" style={{ marginVertical: 20 }} />
            ) : members.length > 0 ? (
              <View style={{ width: '100%', marginTop: 6 }}>
                {members.map((m) => (
                  <View key={m._id} style={styles.memberListItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{m.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberEmail}>{m.email}</Text>
                      <View style={styles.memberRoleTagContainer}>
                        <Text style={styles.memberRoleTag}>
                          {m.role === 'president' ? t('chat.president') : m.role === 'treasurer' ? t('chat.treasurer') : m.role === 'secretary' ? t('chat.secretary') : t('chat.volunteer')}
                        </Text>
                      </View>
                    </View>
                    {m.role !== 'president' && (
                      <TouchableOpacity
                        style={styles.removeMemberBtn}
                        onPress={() => handleRemoveMember(m._id, m.name)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.removeMemberBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMembersBox}>
                <Text style={styles.noMembersText}>{t('profile.noMembersYet')}</Text>
              </View>
            )}
          </View>
        )}



        {/* President Management: Subscription & Upgrade Plan */}
        {isPresident && mandal && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.sectionTitle}>{t('profile.subscriptionPlan')}</Text>
                <Text style={styles.sectionSub}>{t('profile.manageFeaturesLimits')}</Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: mandal.plan === 'Premium' ? '#EDE9FE' : mandal.plan === 'Pro' ? '#FFEDD5' : '#F1F5F9' }]}>
                <Text style={[styles.planBadgeText, { color: mandal.plan === 'Premium' ? '#6C4DD9' : mandal.plan === 'Pro' ? '#F97316' : '#475569' }]}>
                  {mandal.plan || 'Basic'} Plan
                </Text>
              </View>
            </View>

            <View style={styles.planStatusCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>{t('common.status')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: mandal.planStatus === 'Active' ? '#10B981' : '#EF4444' }}>
                  ● {mandal.planStatus === 'Active' ? t('common.active') : mandal.planStatus || t('common.active')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>{t('profile.configuredEvents')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#172554' }}>
                  {t('profile.eventTypesCount', { count: mandal.eventTypes?.length || 1 })}
                </Text>
              </View>
              {mandal.planRenewsAt && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>{t('profile.renewalDate')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#172554' }}>
                    {new Date(mandal.planRenewsAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.upgradePlanBtn}
              onPress={() => navigation?.navigate('Subscription')}
              activeOpacity={0.88}
            >
              <Text style={styles.upgradePlanBtnText}>{t('profile.upgradePlan')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── App Preferences / Language Section ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>{t('profile.appPreferences')}</Text>
              <Text style={styles.sectionSub}>{t('language.languageDescription')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.languageSettingRow}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.75}
          >
            <View style={styles.languageLeft}>
              <Text style={styles.languageIcon}>🌐</Text>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.languageTitle}>{t('language.appLanguage')}</Text>
                <Text style={styles.languageCurrent}>
                  {language === 'mr' ? 'मराठी (Marathi)' : 'English (English)'}
                </Text>
              </View>
            </View>
            <View style={styles.languagePill}>
              <Text style={styles.languagePillText}>{t('language.switchLanguage')} →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>{t('profile.logoutAccount')}</Text>
        </TouchableOpacity>

        {!isSuperAdmin && (
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>{t('profile.dangerZone')}</Text>
            <Text style={styles.dangerText}>
              {t('profile.dangerDesc')}
            </Text>
            <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleOpenDeleteModal} activeOpacity={0.8}>
              <Text style={styles.deleteAccountBtnText}>{t('profile.deleteAccountBtn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Add Member Modal ── */}
        <Modal visible={showMemberModal} animationType="slide" transparent={true} onRequestClose={() => setShowMemberModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.modalHeading}>{t('profile.addTeamMember')}</Text>
              <Text style={styles.modalSubheading}>
                {t('profile.addMemberSubheading')}
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                <Text style={styles.inputLabel}>{t('profile.memberFullName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#9ca3af"
                  value={memberName}
                  onChangeText={setMemberName}
                />

                <Text style={styles.inputLabel}>{t('profile.memberEmailForOtp')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. rahul@gmail.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                />

                <Text style={styles.inputLabel}>{t('register.mobileOptional')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={memberMobile}
                  onChangeText={setMemberMobile}
                />

                <Text style={styles.inputLabel}>{t('profile.role')}</Text>
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
                  <Text style={styles.submitBtnText}>{t('profile.addMemberToMandal')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMemberModal(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Account Deletion Modal ── */}
        <Modal visible={showDeleteModal} animationType="slide" transparent={true} onRequestClose={() => setShowDeleteModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.modalHeading, { color: '#DC2626' }]}>{t('profile.deleteAccountTitle')}</Text>
              
              {deleteStep === 'warning' ? (
                <View>
                  <Text style={styles.modalSubheading}>
                    {isPresident
                      ? `Warning: Deleting your account will permanently wipe "${mandal?.name || 'your Mandal'}" and ALL related donations, receipts, expenses, chats, and members from the database.`
                      : 'Warning: Deleting your account will permanently remove your profile and access from the database.'}
                  </Text>
                  
                  <View style={styles.warningBox}>
                    <Text style={styles.warningBoxText}>
                      An OTP will be sent to your registered email ({user?.email}) to confirm your identity.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.dangerSubmitBtn, sendingDeleteOtp && { opacity: 0.7 }]}
                    onPress={handleRequestDeleteOtp}
                    disabled={sendingDeleteOtp}
                  >
                    {sendingDeleteOtp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>{t('profile.sendVerificationCode')}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalSubheading}>
                    {t('profile.enterSixDigitOtpSentTo', { email: user?.email || '' })}
                  </Text>

                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={deleteOtp}
                    onChangeText={setDeleteOtp}
                    autoFocus={true}
                  />

                  <TouchableOpacity style={styles.resendLink} onPress={handleRequestDeleteOtp} disabled={sendingDeleteOtp}>
                    <Text style={styles.resendLinkText}>Didn't receive code? Resend OTP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dangerSubmitBtn, (deletingAccount || deleteOtp.length < 6) && { opacity: 0.7 }]}
                    onPress={handleConfirmDelete}
                    disabled={deletingAccount || deleteOtp.length < 6}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>{t('profile.confirmDeleteAccount')}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)} disabled={deletingAccount}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>

      {/* Language Modal */}
      <LanguageModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 130,
  },

  /* ── Page Header matching user screenshot ── */
  headerSection: {
    marginBottom: 16,
    paddingTop: 4,
  },
  screenMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  screenMainSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },

  /* ── Mandal Details Card matching user screenshot ── */
  mandalDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 8,
  },
  logoUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    gap: 12,
  },
  logoCircleWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoCircleImg: {
    width: 48,
    height: 48,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  browseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  browseBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  textAreaField: {
    minHeight: 74,
    textAlignVertical: 'top',
    fontSize: 14,
    fontWeight: '500',
  },
  saveMandalBtn: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  saveMandalBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },

  /* ── Profile Hero Card ── */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F97316',
  },
  heroName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#172554',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  rolePillPresident: {
    backgroundColor: '#FEF3C7',
  },
  rolePillMember: {
    backgroundColor: '#DCFCE7',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rolePillTextPresident: {
    color: '#B45309',
  },
  rolePillTextMember: {
    color: '#15803D',
  },
  heroPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  phoneIcon: {
    fontSize: 13,
  },
  heroPhoneText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  /* ── General Section Cards ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#172554',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.05)',
  },
  countBadge: {
    backgroundColor: '#FFF1E7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 11,
  },
  teamHeaderContainer: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.05)',
  },
  teamTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  addMemberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  addMemberBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  addMemberBannerIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: Platform.OS === 'ios' ? -1 : -2,
  },
  addMemberBannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#9A3412',
  },
  addMemberBannerSub: {
    fontSize: 11,
    color: '#C2410C',
    marginTop: 1,
    fontWeight: '500',
  },
  addMemberArrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addMemberArrowText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '900',
  },
  addMemberBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 10,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addMemberBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  memberAccessBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberAccessBadgeText: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 11,
  },

  /* ── Team Member List ── */
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.04)',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#172554',
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#172554',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  memberRoleTagContainer: {
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  memberRoleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
  },
  removeMemberBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMemberBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  noMembersBox: {
    padding: 16,
    backgroundColor: '#F8F7F4',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  noMembersText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },

  memberPerksBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 6,
  },
  perkItem: {
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500',
  },

  /* ── Mandal Logo & Details ── */
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E7',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
  },
  mandalLogoPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  mandalLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  uploadBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.04)',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  value: {
    fontSize: 13.5,
    color: '#172554',
    fontWeight: '700',
  },

  /* ── Subscription Card ── */
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  planStatusCard: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  upgradePlanBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  upgradePlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  info: {
    fontSize: 13.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 19,
  },

  /* ── Logout & Danger Zone ── */
  logoutBtn: {
    backgroundColor: '#172554',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  dangerText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
    marginBottom: 14,
  },
  deleteAccountBtn: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  deleteAccountBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  warningBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    marginVertical: 14,
  },
  warningBoxText: {
    fontSize: 12.5,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  dangerSubmitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '800',
    color: '#DC2626',
    paddingVertical: 14,
  },
  resendLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendLinkText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ── Modals ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 37, 84, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 4,
  },
  modalSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#172554',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    fontSize: 14.5,
    color: '#172554',
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleChip: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  roleChipActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  roleChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  languageSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 8
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  languageIcon: {
    fontSize: 24
  },
  languageTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#172554'
  },
  languageCurrent: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
    marginTop: 2
  },
  languagePill: {
    backgroundColor: '#FFF1E7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDBA74'
  },
  languagePillText: {
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 12
  }
});
