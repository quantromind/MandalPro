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
        <TouchableOpacity style={styles.requestBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Text style={styles.requestBtnText}>{isPresident ? '+ Add Expense' : '+ Request Expense'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <Text style={styles.cardVendor}>Vendor: {item.vendor || 'General'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardAmount}>{inr(item.amount)}</Text>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.cardDesc}>"{item.description}"</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                </Text>
                {item.status === 'Submitted' && canApprove && (
                  <TouchableOpacity
                    style={styles.approveActionBtn}
                    onPress={() => handleApprove(item._id, item.category, item.amount)}
                  >
                    <Text style={styles.approveActionText}>✓ Approve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>No expenses recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              {isPresident
                ? 'Tap "+ Add Expense" to record Mandal expenses.'
                : 'Tap "+ Request Expense" to submit bills or reimbursement requests.'}
            </Text>
          </View>
        }
      />

      {/* ── Add / Request Expense Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                  >
                    <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount */}
              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="₹ 0"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              />

              {/* Vendor */}
              <Text style={styles.inputLabel}>Vendor / Payee Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Flowers, City Sound"
                placeholderTextColor="#9ca3af"
                value={vendor}
                onChangeText={setVendor}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Purpose / Note (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="e.g. Visarjan garland and flowers advance payment"
                placeholderTextColor="#9ca3af"
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
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isPresident ? 'Record Expense (Approved) ✓' : 'Submit Expense Request →'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#17233C' },
  topSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  requestBtn: {
    backgroundColor: '#FF6B00', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 2
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardCategory: { fontSize: 16, fontWeight: '700', color: '#17233C' },
  cardVendor: { fontSize: 12.5, color: '#6B7280', marginTop: 3 },
  cardAmount: { fontSize: 17, fontWeight: '800', color: '#FF6B00', marginBottom: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: '#4B5563', marginTop: 8, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  cardDate: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  approveActionBtn: {
    backgroundColor: '#10B981', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8
  },
  approveActionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#17233C', marginBottom: 4 },
  emptySubtitle: { fontSize: 13.5, color: '#6B7280', textAlign: 'center', lineHeight: 18 },

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
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  categoryChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  catChip: {
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16
  },
  catChipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  catChipText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  catChipTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 12, fontSize: 14.5, color: '#17233C'
  },
  amountInput: { fontSize: 18, fontWeight: '700', color: '#FF6B00' },
  submitBtn: {
    backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 18
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' }
});
