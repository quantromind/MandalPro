import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user, mandal, logout } = useAuth();

  const isPresident = user?.role === 'president' || user?.role === 'superadmin' || user?.role === 'treasurer';
  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    try {
      const { data } = await client.get('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      // ignore — likely offline
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Namaste, {user?.name?.split(' ')[0]} 🪔</Text>
          <Text style={styles.mandalSub}>{mandal?.name || 'Mandal Member'} • {user?.role === 'president' ? 'President' : 'Member'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutPill} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {isPresident ? (
        <>
          <View style={styles.cardsRow}>
            <View style={[styles.card, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.cardLabel}>Collections</Text>
              <Text style={[styles.cardValue, { color: '#15803d' }]}>{inr(summary?.totalCollections)}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.cardLabel}>Expenses</Text>
              <Text style={[styles.cardValue, { color: '#b91c1c' }]}>{inr(summary?.totalExpenses)}</Text>
            </View>
          </View>
          <View style={styles.cardsRow}>
            <View style={[styles.card, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.cardLabel}>Pending Approvals</Text>
              <Text style={[styles.cardValue, { color: '#b45309' }]}>{summary?.pendingApprovals ?? '0'}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#e0e7ff' }]}>
              <Text style={styles.cardLabel}>Active Events</Text>
              <Text style={[styles.cardValue, { color: '#4338ca' }]}>{summary?.activeEvents ?? '—'}</Text>
            </View>
          </View>
        </>
      ) : (
        /* Member Summary */
        <View style={styles.cardsRow}>
          <View style={[styles.card, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.cardLabel}>Mandal Total Collections</Text>
            <Text style={[styles.cardValue, { color: '#15803d' }]}>{inr(summary?.totalCollections)}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.cardLabel}>Pending Approvals</Text>
            <Text style={[styles.cardValue, { color: '#b45309' }]}>{summary?.pendingApprovals ?? '0'}</Text>
          </View>
        </View>
      )}

      {/* Quick Action Buttons */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      
      {/* 1. New Collection (Add Donor) */}
      <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Collection')} activeOpacity={0.85}>
        <Text style={styles.primaryActionIcon}>➕</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryActionText}>New Collection (Add Donor)</Text>
          <Text style={styles.primaryActionSub}>Record donation & generate WhatsApp receipt</Text>
        </View>
      </TouchableOpacity>

      {/* 2. View Receipts */}
      <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Receipts')} activeOpacity={0.8}>
        <Text style={styles.actionIcon}>🧾</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.secondaryActionText}>View & Share Receipts</Text>
          <Text style={styles.secondaryActionSub}>Search past receipts and share via WhatsApp</Text>
        </View>
      </TouchableOpacity>

      {/* 3. Request Expense / View Expenses */}
      <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Expenses')} activeOpacity={0.8}>
        <Text style={styles.actionIcon}>💸</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.secondaryActionText}>{isPresident ? 'Expenses & Approvals' : 'Request Expense / Bills'}</Text>
          <Text style={styles.secondaryActionSub}>{isPresident ? 'Record expenses or approve member requests' : 'Submit expense reimbursement or bill for approval'}</Text>
        </View>
      </TouchableOpacity>

      {/* 4. Events (For President) */}
      {isPresident && (
        <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Events')} activeOpacity={0.8}>
          <Text style={styles.actionIcon}>🎪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryActionText}>Events & Tasks</Text>
            <Text style={styles.secondaryActionSub}>Manage Mandal festival events and schedules</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Info Banner for Members */}
      {!isPresident && (
        <View style={styles.memberInfoBox}>
          <Text style={styles.memberInfoIcon}>ℹ️</Text>
          <Text style={styles.memberInfoText}>
            You are logged in as an authorized committee member. You can collect donations, generate official receipts, and submit expense requests directly to the Mandal President.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 4 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#17233C' },
  mandalSub: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  logoutPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 14, marginBottom: 10 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardLabel: { fontSize: 11.5, color: '#4B5563', marginBottom: 6, fontWeight: '600' },
  cardValue: { fontSize: 20, fontWeight: '800' },
  primaryAction: {
    backgroundColor: '#FF6B00', padding: 16, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 10,
    shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4
  },
  primaryActionIcon: { fontSize: 24 },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  primaryActionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  secondaryAction: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
  },
  actionIcon: { fontSize: 24 },
  secondaryActionText: { color: '#17233C', fontWeight: '700', fontSize: 15 },
  secondaryActionSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  memberInfoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderWidth: 1,
    borderColor: '#BFDBFE', borderRadius: 12, padding: 14, gap: 10,
    marginTop: 10, marginBottom: 30
  },
  memberInfoIcon: { fontSize: 18 },
  memberInfoText: { color: '#1E40AF', fontSize: 12.5, lineHeight: 18, flex: 1, fontWeight: '500' }
});
