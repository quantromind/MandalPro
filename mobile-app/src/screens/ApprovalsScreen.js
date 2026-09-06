import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const getCategoryMeta = (category = '') => {
  const cat = String(category).toLowerCase();
  if (cat.includes('pooja') || cat.includes('aarti')) return { icon: '🪔', bg: '#FEF3C7', color: '#D97706' };
  if (cat.includes('decor')) return { icon: '🎨', bg: '#EDE9FE', color: '#7C3AED' };
  if (cat.includes('sound') || cat.includes('light')) return { icon: '🔊', bg: '#E0F2FE', color: '#0284C7' };
  if (cat.includes('food') || cat.includes('prasad')) return { icon: '🍲', bg: '#DCFCE7', color: '#16A34A' };
  if (cat.includes('visarjan') || cat.includes('procession')) return { icon: '🥁', bg: '#FFEDD5', color: '#EA580C' };
  if (cat.includes('tent') || cat.includes('stage')) return { icon: '🎪', bg: '#FCE7F3', color: '#DB2777' };
  if (cat.includes('security') || cat.includes('safety')) return { icon: '🛡️', bg: '#E0E7FF', color: '#4F46E5' };
  return { icon: '💸', bg: '#F1F5F9', color: '#475569' };
};

export default function ApprovalsScreen() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);

  // Reject Modal state
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Bill Image preview modal
  const [previewBillUrl, setPreviewBillUrl] = useState(null);

  const { user } = useAuth();
  const { t, language } = useLanguage();
  const canApprove = user?.role === 'president' || user?.role === 'treasurer' || user?.role === 'superadmin';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const pendingTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const roleLabel = () => {
    if (user?.role === 'president') return language === 'mr' ? 'अध्यक्ष अधिकार' : 'President Role';
    if (user?.role === 'treasurer') return language === 'mr' ? 'खजिनदार अधिकार' : 'Treasurer Role';
    if (user?.role === 'superadmin') return 'Super Admin';
    return language === 'mr' ? 'केवळ पाहणे' : 'View Only';
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return language === 'mr' ? 'आज' : 'Today';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return language === 'mr' ? 'आज' : 'Today';
    if (d.toDateString() === yesterday.toDateString()) return language === 'mr' ? 'काल' : 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const load = async () => {
    try {
      const { data } = await client.get('/expenses');
      const pending = Array.isArray(data) ? data.filter((e) => e.status === 'Submitted') : [];
      setExpenses(pending);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleApprove = (item) => {
    const title = t('approvals.confirmApproveTitle') || 'Approve Expense';
    const msg = (t('approvals.confirmApproveMsg') || 'Approve {{category}} expense of {{amount}}?')
      .replace('{{category}}', item.category || item.title || 'Expense')
      .replace('{{amount}}', inr(item.amount));

    Alert.alert(title, msg, [
      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      {
        text: `${t('approvals.approve') || 'Approve'} ✓`,
        onPress: async () => {
          try {
            setActionId(item._id);
            await client.patch(`/expenses/${item._id}/approve`);
            Alert.alert(
              t('approvals.approved') || 'Approved',
              t('approvals.approvedSuccess') || 'Expense has been approved successfully.'
            );
            load();
          } catch (err) {
            Alert.alert(t('common.error') || 'Error', err.response?.data?.message || 'Could not approve expense.');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const openRejectModal = (item) => {
    setRejectModalItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert(
        language === 'mr' ? 'कृपया कारण लिहा' : 'Reason Required',
        language === 'mr'
          ? 'खर्च नाकारण्यासाठी कृपया एक कारण द्या किंवा निवडा.'
          : 'Please select or type a reason for returning this expense.'
      );
      return;
    }

    try {
      setRejecting(true);
      await client.patch(`/expenses/${rejectModalItem._id}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectModalItem(null);
      Alert.alert(
        t('approvals.rejected') || 'Rejected',
        t('approvals.rejectedSuccess') || 'Expense request has been returned to draft.'
      );
      load();
    } catch (err) {
      Alert.alert(t('common.error') || 'Error', err.response?.data?.message || 'Could not reject expense.');
    } finally {
      setRejecting(false);
    }
  };

  const REASON_CHIPS =
    language === 'mr'
      ? ['पावती जोडलेली नाही', 'खर्चाची दुबार नोंद', 'अर्थसंकल्पापेक्षा जास्त', 'तपशील अपूर्ण']
      : ['Receipt missing', 'Duplicate entry', 'Exceeds budget', 'Incomplete details'];

  const renderHeader = () => {
    if (expenses.length === 0) return null;

    return (
      <View style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>
            {t('approvals.totalPending') || 'TOTAL PENDING'}
          </Text>
          <Text style={styles.summaryAmount}>{inr(pendingTotal)}</Text>
          <Text style={styles.summarySub}>
            {expenses.length}{' '}
            {expenses.length === 1
              ? (t('approvals.requestToReview') || 'request to review')
              : (t('approvals.requestsToReview') || 'requests to review')}
          </Text>
        </View>

        <View style={styles.summaryRight}>
          <View style={[styles.roleChip, canApprove ? styles.roleChipActive : styles.roleChipMuted]}>
            <Text style={styles.roleChipIcon}>{canApprove ? '🛡️' : '👁️'}</Text>
            <Text style={[styles.roleChipText, canApprove ? styles.roleChipTextActive : styles.roleChipTextMuted]}>
              {roleLabel()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F97316']}
              tintColor="#F97316"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => {
            const meta = getCategoryMeta(item.category);
            const isProcessing = actionId === item._id;

            return (
              <View style={styles.card}>
                {/* Top: Category Icon + Title + Vendor + Amount */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: meta.bg }]}>
                    <Text style={styles.categoryEmoji}>{meta.icon}</Text>
                  </View>

                  <View style={styles.cardMiddleInfo}>
                    <Text style={styles.categoryTitle} numberOfLines={1}>
                      {item.category || item.title || 'Expense'}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.vendor || (language === 'mr' ? 'सामान्य' : 'General')} • {formatDateHeader(item.date || item.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.cardAmountWrap}>
                    <Text style={styles.amountText}>{inr(item.amount)}</Text>
                  </View>
                </View>

                {/* Optional Note / Description */}
                {item.description ? (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      💬 {item.description}
                    </Text>
                  </View>
                ) : null}

                {/* Optional Bill preview link */}
                {item.billImageUrl ? (
                  <TouchableOpacity
                    style={styles.billLink}
                    onPress={() => setPreviewBillUrl(item.billImageUrl)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.billLinkText}>📎 {t('approvals.viewBill') || 'View Receipt / Bill'}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Bottom: Status Pill + Approve / Reject Actions */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      ⏳ {t('approvals.pendingReview') || 'Pending Review'}
                    </Text>
                  </View>

                  {canApprove ? (
                    <View style={styles.actionsGroup}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => openRejectModal(item)}
                        disabled={isProcessing}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.rejectBtnText}>
                          {t('approvals.reject') || 'Reject'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(item)}
                        disabled={isProcessing}
                        activeOpacity={0.85}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.approveBtnText}>
                            {t('approvals.approve') || 'Approve'} ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.viewOnlyText}>
                      {t('approvals.viewOnly') || 'View Only'}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {t('approvals.allCaughtUp') || 'All caught up!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t('approvals.noPendingSub') || 'No expenses are currently waiting for your approval.'}
              </Text>
              <TouchableOpacity style={styles.emptyRefreshBtn} onPress={onRefresh} activeOpacity={0.8}>
                <Text style={styles.emptyRefreshText}>
                  🔄 {language === 'mr' ? 'पुन्हा तपासा' : 'Check Again'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Rejection Modal */}
      <Modal
        visible={!!rejectModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('approvals.rejectTitle') || 'Reject Expense Request'}
                </Text>
                <Text style={styles.modalSub}>
                  {rejectModalItem?.category} • {inr(rejectModalItem?.amount)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRejectModalItem(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reasonLabel}>
              {language === 'mr' ? 'कारण निवडा किंवा लिहा:' : 'Select or write a reason:'}
            </Text>

            {/* Quick Chips */}
            <View style={styles.chipRow}>
              {REASON_CHIPS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.reasonChip,
                    rejectReason === chip && styles.reasonChipSelected,
                  ]}
                  onPress={() => setRejectReason(chip)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      rejectReason === chip && styles.reasonChipTextSelected,
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder={
                t('approvals.reasonPlaceholder') || 'E.g., invalid bill receipt, duplicate request, etc.'
              }
              placeholderTextColor="#94A3B8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRejectModalItem(null)}
                disabled={rejecting}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelModalText}>{t('common.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleConfirmReject}
                disabled={rejecting}
                activeOpacity={0.85}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectText}>
                    {t('approvals.reject') || 'Reject Request'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bill Preview Modal */}
      <Modal
        visible={!!previewBillUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewBillUrl(null)}
      >
        <View style={styles.billOverlay}>
          <View style={styles.billCard}>
            <View style={styles.billHeader}>
              <Text style={styles.billTitle}>
                {language === 'mr' ? 'जोडलेली पावती' : 'Attached Receipt'}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewBillUrl(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {previewBillUrl && (
              <Image
                source={{ uri: previewBillUrl }}
                style={styles.billImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  /* Sleek Compact Hero Summary */
  summaryBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  summarySub: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  roleChipMuted: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  roleChipIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  roleChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#1D4ED8',
  },
  roleChipTextMuted: {
    color: '#64748B',
  },

  /* Expense Item Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  cardMiddleInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  cardAmountWrap: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  /* Description Box */
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
  },
  descriptionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Bill preview link */
  billLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  billLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Bottom Actions Row */
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 11.5,
  },
  approveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 78,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11.5,
  },
  viewOnlyText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
    marginBottom: 18,
  },
  emptyRefreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyRefreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  /* Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  reasonChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonChipSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  reasonChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  reasonChipTextSelected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmRejectBtn: {
    flex: 1.3,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmRejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Bill Modal */
  billOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  billCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  billImage: {
    width: '100%',
    height: 350,
    borderRadius: 8,
  },
});
