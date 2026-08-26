import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Pooja & Aarti',
  'Decoration',
  'Sound & Lights',
  'Food & Prasad',
  'Visarjan / Procession',
  'Tent & Stage',
  'Security & Safety',
  'Misc / Other'
];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');

  const { user } = useAuth();
  const canApprove = user?.role === 'president' || user?.role === 'treasurer' || user?.role === 'superadmin';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      const { data } = await client.get('/expenses');
      setExpenses(data);
    } catch (err) {
      console.log('Error loading expenses', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isPresident = user?.role === 'president' || user?.role === 'superadmin';
  const isMember = !isPresident;

  const handleCreateRequest = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/expenses', {
        category,
        amount: numAmount,
        vendor: vendor.trim() || undefined,
        description: description.trim() || undefined,
        status: isPresident ? 'Approved' : 'Submitted'
      });
      setShowModal(false);
      setAmount('');
      setVendor('');
      setDescription('');
      Alert.alert(
        isPresident ? 'Expense Recorded! ✅' : 'Request Submitted! ✅',
        isPresident
          ? 'The expense has been successfully recorded in the Mandal account.'
          : 'Your expense request has been submitted for President approval.'
      );
      load();
    } catch (err) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Failed to save expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, cat, amt) => {
    Alert.alert(
      'Approve Expense',
      `Approve ${cat} of ${inr(amt)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve ✓',
          onPress: async () => {
            try {
              await client.patch(`/expenses/${id}/approve`);
              Alert.alert('Approved', 'Expense request has been approved.');
              load();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to approve');
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return { text: '✓ Approved', bg: '#DCFCE7', color: '#15803D' };
      case 'Submitted':
        return { text: '⏳ Pending Approval', bg: '#FEF3C7', color: '#B45309' };
      case 'Paid':
        return { text: '💵 Paid', bg: '#E0E7FF', color: '#4338CA' };
      case 'Rejected':
        return { text: '✕ Rejected', bg: '#FEE2E2', color: '#B91C1C' };
      default:
        return { text: status || 'Draft', bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Action */}
      <View style={styles.topBar}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.topTitle}>{isPresident ? 'Expenses & Approvals' : 'Expense Requests'}</Text>
          <Text style={styles.topSub}>{isPresident ? 'Record expenses or approve requests' : 'Bills & Reimbursements'}</Text>
        </View>
        <TouchableOpacity style={styles.requestBtn} onPress={() => setShowModal(true)} activeOpacity={0.88}>
          <Text style={styles.requestBtnText}>{isPresident ? '+ Add Expense' : '+ Request Expense'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCategoryRow}>
                  <View style={styles.categoryIconCircle}>
                    <Text style={{ fontSize: 16 }}>💸</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    {item.vendor && <Text style={styles.cardVendor}>Payee: {item.vendor}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardAmount}>{inr(item.amount)}</Text>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>
              </View>

              {item.description ? (
                <View style={styles.descBox}>
                  <Text style={styles.cardDesc}>"{item.description}"</Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                
                {canApprove && item.status === 'Submitted' && (
                  <TouchableOpacity
                    style={styles.approveActionBtn}
                    onPress={() => handleApprove(item._id, item.category, item.amount)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.approveActionText}>Approve Request ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>💸</Text>
            </View>
            <Text style={styles.emptyTitle}>No expenses recorded yet</Text>
            <Text style={styles.emptySubtitle}>All recorded expenses and member bill requests will appear here.</Text>
          </View>
        }
      />

      {/* Record / Request Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>
              {isPresident ? 'Record Mandal Expense' : 'New Expense Request'}
            </Text>
            <Text style={styles.modalSubheading}>
              {isPresident
                ? 'Record a verified expense directly into the Mandal balance'
                : 'Submit a bill or payment request for President approval'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Category Chips */}
              <Text style={styles.inputLabel}>Select Category *</Text>
              <View style={styles.categoryChipsRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.inputLabel}>Expense Amount (₹) *</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="₹ 0"
                placeholderTextColor="#CBD5E1"
                keyboardType="number-pad"
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              />

              {/* Vendor */}
              <Text style={styles.inputLabel}>Vendor / Payee Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Flowers, City Sound"
                placeholderTextColor="#94A3B8"
                value={vendor}
                onChangeText={setVendor}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Purpose / Note (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="e.g. Visarjan garland and flowers advance payment"
                placeholderTextColor="#94A3B8"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </ScrollView>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCreateRequest}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isPresident ? 'Record Expense (Approved) ✓' : 'Submit Expense Request →'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#172554', letterSpacing: -0.2 },
  topSub: { fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '500' },
  requestBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  requestBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12.5 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCategoryRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardCategory: { fontSize: 15.5, fontWeight: '800', color: '#172554' },
  cardVendor: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  cardAmount: { fontSize: 18, fontWeight: '800', color: '#EF4444', marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 10.5, fontWeight: '800' },
  descBox: {
    backgroundColor: '#F8F7F4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  cardDesc: { fontSize: 12.5, color: '#475569', fontStyle: 'italic', lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.04)'
  },
  cardDate: { fontSize: 11.5, color: '#94A3B8', fontWeight: '600' },
  approveActionBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  approveActionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11.5 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#172554', marginBottom: 4 },
  emptySubtitle: { fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 37, 84, 0.45)',
    justifyContent: 'flex-end'
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
    elevation: 10
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16
  },
  modalHeading: { fontSize: 20, fontWeight: '800', color: '#172554', marginBottom: 4 },
  modalSubheading: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  inputLabel: { fontSize: 12.5, fontWeight: '700', color: '#172554', marginBottom: 6, marginTop: 12 },
  categoryChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  catChip: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  catChipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  catChipText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  catChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    fontSize: 14.5,
    color: '#172554'
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.03)',
    borderColor: 'rgba(249, 115, 22, 0.25)'
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
    elevation: 4
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15.5 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' }
});
