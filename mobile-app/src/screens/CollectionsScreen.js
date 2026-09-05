import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReceiptModal from '../components/ReceiptModal';

const MODES = ['cash', 'upi', 'card', 'netbanking'];
const QUICK_AMOUNTS = [100, 250, 500, 1000, 2100, 5100];

export default function CollectionsScreen({ navigation }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('all'); // 'all', 'cash', 'upi'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [contributor, setContributor] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Donation');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState('');
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const { mandal, user } = useAuth();
  const { t, language } = useLanguage();

  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';
  const canManage = isPresident;

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      setError(null);
      const { data } = await client.get('/donations');
      if (Array.isArray(data)) {
        setCollections(data);
      }
    } catch (err) {
      setError(t('collections.unableToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Stat calculations
  const totalCollections = collections.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cashCollections = collections
    .filter((item) => (item.paymentMode || '').toLowerCase() === 'cash')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const onlineCollections = collections
    .filter((item) => {
      const m = (item.paymentMode || '').toLowerCase();
      return m === 'upi' || m === 'card' || m === 'netbanking' || m === 'online';
    })
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Filtered collections
  const filteredCollections = collections.filter((item) => {
    const mode = (item.paymentMode || 'cash').toLowerCase();
    if (selectedMode === 'cash' && mode !== 'cash') return false;
    if (selectedMode === 'upi' && mode === 'cash') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (item.donorName || item.contributor || '').toLowerCase().includes(q);
      const purposeMatch = (item.purpose || item.title || '').toLowerCase().includes(q);
      const receiptMatch = (item.receiptNumber || '').toLowerCase().includes(q);
      return nameMatch || purposeMatch || receiptMatch;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingCollection(null);
    setContributor('');
    setTitle('');
    setAmount('');
    setCategory('Donation');
    setPaymentMode('cash');
    setDate(new Date().toISOString().split('T')[0]);
    setMobile('');
    setDescription('');
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setSelectedRecord(null);
    setEditingCollection(item);
    setContributor(item.donorName || item.contributor || '');
    setTitle(item.title || item.purpose || '');
    setAmount(String(item.amount || ''));
    setCategory(item.category || 'Donation');
    setPaymentMode(item.paymentMode || 'cash');
    setDate(item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setMobile(item.donorMobile || '');
    setDescription(item.description || '');
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!contributor.trim() && !title.trim()) {
      errs.contributor = t('collections.enterTitleError');
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = t('collections.validAmountError');
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSubmitting(true);
    const numAmount = Number(amount);
    const payload = {
      donorName: contributor.trim() || title.trim(),
      contributor: contributor.trim(),
      title: title.trim() || contributor.trim() || 'General Donation',
      purpose: title.trim() || contributor.trim() || 'General Donation',
      amount: numAmount,
      category,
      paymentMode,
      date: date || new Date().toISOString(),
      donorMobile: mobile.trim() || undefined,
      description: description.trim() || undefined,
      idempotencyKey: editingCollection ? undefined : `col-${Date.now()}`
    };

    try {
      if (editingCollection) {
        await client.put(`/donations/${editingCollection._id}`, payload);
      } else {
        const { data } = await client.post('/donations', payload);
        // Show receipt modal after generating
        setReceiptToShow(data);
      }
      setShowModal(false);
      load();
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to save collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      t('collections.deleteCollection'),
      t('collections.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/donations/${item._id}`);
              setSelectedRecord(null);
              load();
            } catch (err) {
              Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to delete record.');
            }
          }
        }
      ]
    );
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return t('common.today');
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return t('common.today');
    if (d.toDateString() === yesterday.toDateString()) return t('common.yesterday');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getModeLabel = (m) => {
    switch (m) {
      case 'cash': return `💵 ${t('collections.modes.cash') || 'Cash'}`;
      case 'upi': return `📱 ${t('collections.modes.upi') || 'UPI'}`;
      case 'card': return `💳 ${t('collections.modes.card') || 'Card'}`;
      default: return `🏦 ${t('collections.modes.netbanking') || 'Online'}`;
    }
  };

  const renderHeaderComponents = () => (
    <View>
      {/* 1. Header Section matching Image 1 */}
      <View style={styles.headerSection}>
        <Text style={styles.screenMainTitle}>
          🚩 {language === 'mr' ? 'संकलन' : 'Collections'}
        </Text>
        <Text style={styles.screenMainSub}>
          {language === 'mr'
            ? 'देणगी नोंदी, पावती तयार करा आणि WhatsApp वर शेअर करा'
            : 'Record collections, generate receipts & share via WhatsApp'}
        </Text>

        <TouchableOpacity style={styles.recordDonationBigBtn} onPress={openAddModal} activeOpacity={0.88}>
          <Text style={styles.recordDonationBigBtnText}>
            ✨ ✨ {language === 'mr' ? 'नवीन देणगी नोंदवा' : 'Record New Donation'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Three Full-Width Stacked Stat Cards matching Image 1 */}
      <View style={styles.statsContainer}>
        {/* Card 1: Total Collections */}
        <View style={[styles.statCardFull, styles.accentBorderOrange]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardLabel}>
              💰 {language === 'mr' ? 'एकूण देणगी संकलन' : 'TOTAL COLLECTIONS'}
            </Text>
            <View style={styles.statCountBadge}>
              <Text style={styles.statCountBadgeText}>
                {collections.length} {language === 'mr' ? 'नोंदी' : 'total records'}
              </Text>
            </View>
          </View>
          <Text style={[styles.statCardAmount, { color: '#0F172A' }]}>{inr(totalCollections)}</Text>
          <Text style={styles.statCardSub}>
            {language === 'mr' ? 'एकूण जमा झालेली रक्कम' : 'Verified mandal inflow collections'}
          </Text>
        </View>

        {/* Card 2: Cash Inflow */}
        <View style={[styles.statCardFull, styles.accentBorderGreen]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardLabel}>
              💵 {language === 'mr' ? 'रोख जमा' : 'CASH INFLOW'}
            </Text>
          </View>
          <Text style={[styles.statCardAmount, { color: '#059669' }]}>{inr(cashCollections)}</Text>
          <Text style={styles.statCardSub}>
            {language === 'mr' ? 'थेट रोख संकलन' : 'Hand-to-hand collections'}
          </Text>
        </View>

        {/* Card 3: Online / UPI */}
        <View style={[styles.statCardFull, styles.accentBorderPurple]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardLabel}>
              📱 {language === 'mr' ? 'युपीआय / ऑनलाइन' : 'ONLINE / UPI'}
            </Text>
          </View>
          <Text style={[styles.statCardAmount, { color: '#2563EB' }]}>{inr(onlineCollections)}</Text>
          <Text style={styles.statCardSub}>
            {language === 'mr' ? 'डिजिटल पेमेंट' : 'QR & Bank transfers'}
          </Text>
        </View>
      </View>

      {/* 3. Search Bar and Mode Filter Pills */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'mr' ? 'नाव, हेतू किंवा पावती क्र. शोधा...' : 'Search donor, purpose, receipt #...'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterPillsRow}>
          {[
            { key: 'all', label: language === 'mr' ? 'सर्व' : 'All', icon: '📋' },
            { key: 'cash', label: language === 'mr' ? 'रोख' : 'Cash', icon: '💵' },
            { key: 'upi', label: language === 'mr' ? 'UPI / ऑनलाइन' : 'UPI / Online', icon: '📱' },
          ].map((pill) => {
            const active = selectedMode === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedMode(pill.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {pill.icon} {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Main History List / States */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t('collections.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCollections}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeaderComponents}
          renderItem={({ item, index }) => {
            const avatarColors = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
            const avatarBg = avatarColors[index % avatarColors.length];
            const donorName = item.donorName || item.contributor || item.title || (language === 'mr' ? 'देणगीदार' : 'Donor');
            const donorInitial = donorName ? donorName[0].toUpperCase() : '🙏';
            const isCash = (item.paymentMode || 'cash').toLowerCase() === 'cash';

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelectedRecord(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarBox, { backgroundColor: avatarBg }]}>
                    <Text style={styles.avatarText}>{donorInitial}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {donorName}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {item.purpose || item.title || (language === 'mr' ? 'देणगी' : 'Donation')}
                      </Text>
                      {item.receiptNumber ? (
                        <View style={styles.receiptPill}>
                          <Text style={styles.receiptPillText}>#{item.receiptNumber}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cardAmount}>{inr(item.amount)}</Text>
                    <View style={[styles.modePill, isCash ? styles.modePillCash : styles.modePillUpi]}>
                      <Text style={[styles.modePillText, isCash ? styles.modePillTextCash : styles.modePillTextUpi]}>
                        {isCash ? '💵 CASH' : '📱 UPI'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.cardFooterLeft}>
                    <Text style={styles.cardDate}>{formatDateHeader(item.date || item.createdAt)}</Text>
                    {item.donorMobile ? <Text style={styles.cardMobile}> · 📱 {item.donorMobile}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.cardReceiptActionBtn}
                    onPress={() => setReceiptToShow(item)}
                    activeOpacity={0.78}
                  >
                    <Text style={styles.cardReceiptActionText}>🧾 {language === 'mr' ? 'पावती' : 'Receipt'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>💰</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? (language === 'mr' ? 'कोणतीही देणगी सापडली नाही' : 'No matching donations') : t('collections.noCollectionsYet')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? (language === 'mr' ? 'दुसरा शब्द शोधून पहा किंवा फिल्टर बदला' : 'Try a different search term or filter')
                  : t('collections.noCollectionsSub')}
              </Text>
            </View>
          }
        />
      )}

      {/* 3. Floating Purple Chat Pill Button matching Image 1 */}
      <TouchableOpacity
        style={styles.floatingChatPill}
        onPress={() => navigation?.navigate('ChatTab')}
        activeOpacity={0.85}
        accessibilityLabel="Chat"
      >
        <Text style={styles.floatingChatIcon}>💬</Text>
        <Text style={styles.floatingChatText}>{language === 'mr' ? 'चॅट' : 'Chat'}</Text>
      </TouchableOpacity>

      {/* 4. Details / Actions Modal */}
      <Modal visible={!!selectedRecord} transparent animationType="fade" onRequestClose={() => setSelectedRecord(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedRecord?.donorName || selectedRecord?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.detailClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailAmount}>{inr(selectedRecord?.amount)}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('collections.collectionTitle')}:</Text>
              <Text style={styles.detailValue}>{selectedRecord?.purpose || selectedRecord?.title || 'Donation'}</Text>
            </View>

            {selectedRecord?.receiptNumber ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Receipt #:</Text>
                <Text style={styles.detailValue}>#{selectedRecord.receiptNumber}</Text>
              </View>
            ) : null}

            {selectedRecord?.donorMobile ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile:</Text>
                <Text style={styles.detailValue}>📱 {selectedRecord.donorMobile}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('collections.paymentMode')}:</Text>
              <Text style={styles.detailValue}>{selectedRecord?.paymentMode?.toUpperCase() || 'CASH'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('collections.date')}:</Text>
              <Text style={styles.detailValue}>{selectedRecord ? formatDateHeader(selectedRecord.date || selectedRecord.createdAt) : ''}</Text>
            </View>

            {selectedRecord?.description ? (
              <View style={styles.detailDescBox}>
                <Text style={styles.detailDesc}>{selectedRecord?.description}</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.detailActionRow}>
              <TouchableOpacity
                style={styles.actionBtnReceipt}
                onPress={() => {
                  const r = selectedRecord;
                  setSelectedRecord(null);
                  setReceiptToShow(r);
                }}
              >
                <Text style={styles.actionBtnReceiptText}>🧾 Share</Text>
              </TouchableOpacity>

              {canManage && (
                <TouchableOpacity
                  style={styles.actionBtnEdit}
                  onPress={() => openEditModal(selectedRecord)}
                >
                  <Text style={styles.actionBtnEditText}>✏️ {t('common.edit')}</Text>
                </TouchableOpacity>
              )}

              {canManage && (
                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDelete(selectedRecord)}
                >
                  <Text style={styles.actionBtnDeleteText}>🗑️ {t('common.delete')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Add / Edit Collection Form Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {editingCollection ? t('collections.editCollection') : t('collections.newCollection')}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Contributor Name */}
              <Text style={styles.inputLabel}>{t('collections.contributorName')}</Text>
              <TextInput
                style={[styles.input, formErrors.contributor && styles.inputError]}
                placeholder={t('collections.contributorPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={contributor}
                onChangeText={(text) => {
                  setContributor(text);
                  if (formErrors.contributor) setFormErrors(prev => ({ ...prev, contributor: null }));
                }}
              />
              {formErrors.contributor ? <Text style={styles.errorText}>{formErrors.contributor}</Text> : null}

              {/* Amount */}
              <Text style={styles.inputLabel}>{t('collections.amount')}</Text>
              <TextInput
                style={[styles.input, styles.amountInput, formErrors.amount && styles.inputError]}
                placeholder="₹ 0"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text.replace(/[^0-9]/g, ''));
                  if (formErrors.amount) setFormErrors(prev => ({ ...prev, amount: null }));
                }}
              />
              {formErrors.amount ? <Text style={styles.errorText}>{formErrors.amount}</Text> : null}

              {/* Quick Amount Chips */}
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.quickChip, amount === String(amt) && styles.quickChipActive]}
                    onPress={() => {
                      setAmount(String(amt));
                      if (formErrors.amount) setFormErrors(prev => ({ ...prev, amount: null }));
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.quickChipText, amount === String(amt) && styles.quickChipTextActive]}>
                      ₹{amt.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Purpose / Title */}
              <Text style={styles.inputLabel}>{t('collections.collectionTitle')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('collections.titlePlaceholder')}
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              {/* Payment Mode */}
              <Text style={styles.inputLabel}>{t('collections.paymentMode')}</Text>
              <View style={styles.modeRow}>
                {MODES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, paymentMode === m && styles.modeChipActive]}
                    onPress={() => setPaymentMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeChipText, paymentMode === m && styles.modeChipTextActive]}>
                      {getModeLabel(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date */}
              <Text style={styles.inputLabel}>{t('collections.date')}</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                value={date}
                onChangeText={setDate}
              />

              {/* Mobile */}
              <Text style={styles.inputLabel}>{t('collection.donorMobile')}</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>{t('collections.description')}</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder={t('collections.descriptionPlaceholder')}
                placeholderTextColor="#94A3B8"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </ScrollView>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{t('collections.saveCollection')} ✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 6. Digital Receipt Modal with WhatsApp Sharing */}
      <ReceiptModal
        visible={!!receiptToShow}
        receipt={receiptToShow}
        mandal={mandal}
        collectorName={user?.name}
        onClose={() => setReceiptToShow(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F4' },

  /* 1. Header Section matching Image 1 */
  headerSection: {
    marginBottom: 16,
    paddingTop: 4,
  },
  screenMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  screenMainSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  recordDonationBigBtn: {
    backgroundColor: '#F97316',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordDonationBigBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  floatingChatPill: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
  floatingChatIcon: {
    fontSize: 16,
  },
  floatingChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* 2. Stat Cards */
  statsContainer: {
    marginBottom: 14,
    gap: 10,
  },
  statCardFull: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBorderOrange: {
    borderTopWidth: 3.5,
    borderTopColor: '#F97316',
  },
  accentBorderGreen: {
    borderTopWidth: 3.5,
    borderTopColor: '#10B981',
  },
  accentBorderPurple: {
    borderTopWidth: 3.5,
    borderTopColor: '#8B5CF6',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statCountBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statCountBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#EA580C',
  },
  statCardAmount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginVertical: 4,
  },
  statCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* 3. Search & Filters */
  searchFilterContainer: {
    marginBottom: 14,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* 4. List & Cards */
  listContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 130,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  receiptPillText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
  cardAmount: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#059669',
  },
  modePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 3,
  },
  modePillCash: {
    backgroundColor: '#ECFDF5',
  },
  modePillUpi: {
    backgroundColor: '#F5F3FF',
  },
  modePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  modePillTextCash: {
    color: '#059669',
  },
  modePillTextUpi: {
    color: '#7C3AED',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.04)',
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardMobile: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  cardReceiptActionBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  cardReceiptActionText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '800',
  },

  /* 3. FAB */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 84,
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginTop: -2,
  },

  /* 4. States */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 13,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: { fontSize: 30 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#172554', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },

  /* 5. Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: '#172554',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  quickChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  modeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  modeChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Detail Card Modal */
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172554',
    flex: 1,
  },
  detailClose: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
  },
  detailAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  detailValue: {
    color: '#172554',
    fontWeight: '700',
    fontSize: 13,
  },
  detailDescBox: {
    backgroundColor: '#F8F7F4',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  detailDesc: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionBtnReceipt: {
    flex: 1.2,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnReceiptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  actionBtnEdit: {
    flex: 0.9,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnEditText: {
    color: '#172554',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnDelete: {
    flex: 0.9,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnDeleteText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
});
