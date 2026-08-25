import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ApprovalsScreen() {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const canApprove = user?.role === 'president' || user?.role === 'treasurer';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      const { data } = await client.get('/expenses');
      // Filter for submitted / pending items first
      const pending = data.filter(e => e.status === 'Submitted');
      setExpenses(pending);
    } catch (err) {
      console.log('Failed to load pending approvals', err);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleApprove = async (id, category, amt) => {
    Alert.alert(
      'Approve Expense',
      `Approve ${category} of ${inr(amt)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await client.patch(`/expenses/${id}/approve`);
              Alert.alert('Approved', 'Expense has been approved successfully.');
              load();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not approve expense.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.vendor}>Vendor: {item.vendor || 'General'}</Text>
              </View>
              <Text style={styles.amount}>{inr(item.amount)}</Text>
            </View>

            {item.description ? (
              <Text style={styles.desc}>{item.description}</Text>
            ) : null}

            <View style={styles.cardFooter}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⏳ Pending Approval</Text>
              </View>
              {canApprove && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item._id, item.category, item.amount)}
                >
                  <Text style={styles.approveBtnText}>✓ Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No expenses are currently waiting for your approval.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  category: { fontSize: 16, fontWeight: '700', color: '#17233C' },
  vendor: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: '#FF6B00' },
  desc: { fontSize: 13, color: '#4B5563', marginTop: 8, fontStyle: 'italic' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 14, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12
  },
  badgeText: { color: '#D97706', fontSize: 12, fontWeight: '700' },
  approveBtn: {
    backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 2
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#17233C', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }
});
