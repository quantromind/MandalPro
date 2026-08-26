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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
    >
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'president' ? '👑 PRESIDENT WORKSPACE' : '👥 COMMITTEE MEMBER'}
            </Text>
          </View>
          <Text style={styles.greeting}>Namaste, {user?.name?.split(' ')[0]} 🪔</Text>
          <Text style={styles.mandalSub}>{mandal?.name || 'Apla Mandal'} • Active Session</Text>
        </View>
        <TouchableOpacity style={styles.logoutPill} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Section: Metrics & Summary */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionHeader}>Financial Overview</Text>
        <Text style={styles.sectionSub}>Live Mandal statistics</Text>
      </View>

      {/* Summary Cards */}
      {isPresident ? (
        <>
          <View style={styles.cardsRow}>
            {/* Collections */}
            <View style={[styles.card, styles.cardCollection]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>💰</Text>
                <View style={[styles.trendBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.trendText, { color: '#15803D' }]}>↑ Inflow</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Collections</Text>
              <Text style={[styles.cardValue, { color: '#15803D' }]}>{inr(summary?.totalCollections)}</Text>
            </View>

            {/* Expenses */}
            <View style={[styles.card, styles.cardExpense]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>💸</Text>
                <View style={[styles.trendBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.trendText, { color: '#B91C1C' }]}>↓ Outflow</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Expenses</Text>
              <Text style={[styles.cardValue, { color: '#B91C1C' }]}>{inr(summary?.totalExpenses)}</Text>
            </View>
          </View>

          <View style={styles.cardsRow}>
            {/* Pending Approvals */}
            <View style={[styles.card, styles.cardPending]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>⏳</Text>
                <View style={[styles.trendBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.trendText, { color: '#B45309' }]}>Pending</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Approvals</Text>
              <Text style={[styles.cardValue, { color: '#B45309' }]}>{summary?.pendingApprovals ?? '0'}</Text>
            </View>

            {/* Active Events */}
            <View style={[styles.card, styles.cardEvents]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardIcon}>🎪</Text>
                <View style={[styles.trendBadge, { backgroundColor: '#E0E7FF' }]}>
                  <Text style={[styles.trendText, { color: '#4338CA' }]}>Active</Text>
                </View>
              </View>
              <Text style={styles.cardLabel}>Festivals & Events</Text>
              <Text style={[styles.cardValue, { color: '#172554' }]}>{summary?.activeEvents ?? '—'}</Text>
            </View>
          </View>
        </>
      ) : (
        /* Member Summary */
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.cardCollection]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>💰</Text>
              <View style={[styles.trendBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.trendText, { color: '#15803D' }]}>Total</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Mandal Collections</Text>
            <Text style={[styles.cardValue, { color: '#15803D' }]}>{inr(summary?.totalCollections)}</Text>
          </View>

          <View style={[styles.card, styles.cardPending]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardIcon}>⏳</Text>
              <View style={[styles.trendBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.trendText, { color: '#B45309' }]}>Pending</Text>
              </View>
            </View>
            <Text style={styles.cardLabel}>Pending Approvals</Text>
            <Text style={[styles.cardValue, { color: '#B45309' }]}>{summary?.pendingApprovals ?? '0'}</Text>
          </View>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <Text style={styles.sectionSub}>Frequently used tools</Text>
      </View>
      
      {/* 1. Featured Primary Action: New Collection (Add Donor) */}
      <TouchableOpacity
        style={styles.featuredActionCard}
        onPress={() => navigation.navigate('Collection')}
        activeOpacity={0.88}
      >
        {/* Subtle decorative glow circle in corner */}
        <View style={styles.featuredDecorCircle} />
        <View style={styles.featuredDecorCircleSmall} />

        <View style={styles.featuredCardTopRow}>
          <View style={styles.featuredIconBox}>
            <Text style={styles.featuredIconText}>➕</Text>
          </View>
          <View style={styles.featuredArrowCircle}>
            <Text style={styles.featuredArrowText}>→</Text>
          </View>
        </View>

        <View style={styles.featuredCardContent}>
          <Text style={styles.featuredActionTitle}>New Collection (Add Donor)</Text>
          <Text style={styles.featuredActionSub}>Record donation & generate WhatsApp receipt</Text>
        </View>
      </TouchableOpacity>

      {/* 2 & 3. Responsive 2-Column Action Cards */}
      <View style={styles.actionGridRow}>
        {/* 2. View & Share Receipts */}
        <TouchableOpacity
          style={[styles.gridActionCard, styles.cardBlueBorder]}
          onPress={() => navigation.navigate('Receipts')}
          activeOpacity={0.85}
        >
          <View style={styles.gridCardTop}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={styles.gridIcon}>🧾</Text>
            </View>
            <View style={[styles.arrowPill, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
              <Text style={[styles.arrowPillText, { color: '#2563EB' }]}>→</Text>
            </View>
          </View>
          <Text style={styles.gridActionTitle}>View & Share Receipts</Text>
          <Text style={styles.gridActionSub} numberOfLines={2}>
            Search past receipts and share via WhatsApp
          </Text>
        </TouchableOpacity>

        {/* 3. Expenses & Approvals */}
        <TouchableOpacity
          style={[styles.gridActionCard, styles.cardGreenBorder]}
          onPress={() => navigation.navigate('Expenses')}
          activeOpacity={0.85}
        >
          <View style={styles.gridCardTop}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={styles.gridIcon}>💸</Text>
            </View>
            <View style={[styles.arrowPill, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Text style={[styles.arrowPillText, { color: '#15803D' }]}>→</Text>
            </View>
          </View>
          <Text style={styles.gridActionTitle}>
            {isPresident ? 'Expenses & Approvals' : 'Request Expense'}
          </Text>
          <Text style={styles.gridActionSub} numberOfLines={2}>
            {isPresident ? 'Record expenses or approve member requests' : 'Submit expense reimbursement or bill for approval'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Events & Tasks (Wide Card for President) */}
      {isPresident && (
        <TouchableOpacity
          style={styles.wideActionCard}
          onPress={() => navigation.navigate('Events')}
          activeOpacity={0.85}
        >
          <View style={[styles.wideIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Text style={styles.wideIcon}>🎪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.wideActionTitle}>Events & Tasks</Text>
            <Text style={styles.wideActionSub}>Manage Mandal festival events and schedules</Text>
          </View>
          <View style={styles.wideActionPill}>
            <Text style={styles.wideActionPillText}>Schedules →</Text>
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
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  contentContainer: { padding: 16, paddingBottom: 100 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  roleBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  roleBadgeText: { color: '#F97316', fontWeight: '800', fontSize: 10.5, letterSpacing: 0.5 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#172554', letterSpacing: -0.3 },
  mandalSub: { fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: '500' },
  logoutPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  
  sectionTitleRow: { marginTop: 18, marginBottom: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#172554', letterSpacing: -0.2 },
  sectionSub: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },

  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardIcon: { fontSize: 18 },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  trendText: { fontSize: 10, fontWeight: '700' },
  cardLabel: { fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: '600' },
  cardValue: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },

  /* 1. Featured Action (New Collection) */
  featuredActionCard: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5
  },
  featuredDecorCircle: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  featuredDecorCircleSmall: {
    position: 'absolute',
    bottom: -15,
    left: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  featuredCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  featuredIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featuredIconText: { fontSize: 22 },
  featuredArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featuredArrowText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  featuredCardContent: {},
  featuredActionTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17.5,
    letterSpacing: -0.2
  },
  featuredActionSub: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12.5,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500'
  },

  /* 2 & 3. Responsive 2-Column Action Cards */
  actionGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  gridActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between'
  },
  cardBlueBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#3B82F6'
  },
  cardGreenBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#10B981'
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridIcon: { fontSize: 19 },
  arrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrowPillText: { fontSize: 14, fontWeight: '800' },
  gridActionTitle: {
    color: '#172554',
    fontWeight: '800',
    fontSize: 14.5,
    letterSpacing: -0.2,
    marginBottom: 4
  },
  gridActionSub: {
    color: '#64748B',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500'
  },

  /* 4. Wide Action Card (Events & Tasks) */
  wideActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#6366F1',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  wideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wideIcon: { fontSize: 20 },
  wideActionTitle: {
    color: '#172554',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.2
  },
  wideActionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500'
  },
  wideActionPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  wideActionPillText: {
    color: '#4338CA',
    fontWeight: '800',
    fontSize: 11.5
  },

  memberInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 10,
    marginBottom: 20
  },
  memberInfoIcon: { fontSize: 18 },
  memberInfoText: { color: '#1E40AF', fontSize: 12.5, lineHeight: 18, flex: 1, fontWeight: '500' }
});
