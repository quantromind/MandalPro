import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

import { useLanguage } from '../context/LanguageContext';

export default function ApprovalsScreen() {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const canApprove = user?.role === 'president' || user?.role === 'treasurer';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      const { data } = await client.get('/expenses');
      // Filter for submitted / pending items first
      const pending = data.filter(e => e.status === 'Submitted');
      setExpenses(pending);
    } catch (err) {
      // ignore
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleApprove = async (id, category, amt) => {
    Alert.alert(
      t('approvals.approveExpense'),
      `${t('approvals.approveExpense')} ${category} of ${inr(amt)}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: `${t('approvals.approve')} ✓`,
          onPress: async () => {
            try {
              await client.patch(`/expenses/${id}/approve`);
              Alert.alert(t('approvals.approved'), 'Expense has been approved successfully.');
              load();
            } catch (err) {
              Alert.alert(t('common.error'), err.response?.data?.message || 'Could not approve expense.');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCategoryRow}>
                <View style={styles.categoryIconCircle}>
                  <Text style={{ fontSize: 16 }}>⏳</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.vendor}>{t('expenses.payee')}: {item.vendor || 'General'}</Text>
                </View>
              </View>
              <Text style={styles.amount}>{inr(item.amount)}</Text>
            </View>

            {item.description ? (
              <View style={styles.descBox}>
                <Text style={styles.desc}>"{item.description}"</Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⏳ {t('approvals.pendingApproval')}</Text>
              </View>
              {canApprove && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item._id, item.category, item.amount)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveBtnText}>{t('approvals.approveRequest')} ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🎉</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('approvals.allCaughtUp')}</Text>
            <Text style={styles.emptySubtitle}>{t('approvals.noExpensesPending')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F4' },
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  category: { fontSize: 16, fontWeight: '800', color: '#172554' },
  vendor: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  amount: { fontSize: 18, fontWeight: '800', color: '#EF4444' },
  descBox: {
    backgroundColor: '#F8F7F4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  desc: { fontSize: 12.5, color: '#475569', fontStyle: 'italic', lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.04)'
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6
  },
  badgeText: { color: '#B45309', fontSize: 11, fontWeight: '800' },
  approveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  approveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 20 },
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
  emptySubtitle: { fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 20 }
});
