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
  const { t, language } = useLanguage();
  const canApprove = user?.role === 'president' || user?.role === 'treasurer' || user?.role === 'superadmin';

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const pendingTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const roleDisplay = (user?.role || 'President').toUpperCase();

  const load = async () => {
    try {
      const { data } = await client.get('/expenses');
      // Filter for submitted / pending items first
      const pending = data.filter((e) => e.status === 'Submitted');
      setExpenses(pending);
    } catch (err) {
      // ignore
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>🛡️ GOVERNANCE & AUDIT</Text>
          </View>
          <Text style={styles.countPill}>
            {expenses.length} {language === 'mr' ? 'प्रलंबित' : 'pending'}
          </Text>
        </View>
        <Text style={styles.headerTitle}>
          {language === 'mr' ? '⏳ प्रलंबित मंजुऱ्या (Pending Approvals)' : '⏳ Pending Approvals'}
        </Text>
        <Text style={styles.headerSub}>
          {language === 'mr'
            ? 'मंडळाच्या सदस्यांनी पाठवलेले खर्च तपासा व त्वरित मंजुरी द्या'
            : 'Review and authorize expenditure requests submitted by committee members'}
        </Text>
      </View>

      {/* 3 Stat Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCardRow}>
          {/* Stat 1: Pending Count */}
          <View style={[styles.statCardHalf, styles.accentBorderAmber]}>
            <Text style={styles.statCardLabel}>
              ⏳ {language === 'mr' ? 'प्रलंबित अर्ज' : 'Pending Requests'}
            </Text>
            <Text style={[styles.statCardAmount, { color: '#D97706' }]}>{expenses.length}</Text>
            <Text style={styles.statCardSub}>
              {language === 'mr' ? 'मंजुरीची वाट पाहत आहे' : 'Awaiting action'}
            </Text>
          </View>

          {/* Stat 2: Total Pending Amount */}
          <View style={[styles.statCardHalf, styles.accentBorderRed]}>
            <Text style={styles.statCardLabel}>
              💰 {language === 'mr' ? 'एकूण रक्कम' : 'Pending Amount'}
            </Text>
            <Text style={[styles.statCardAmount, { color: '#DC2626' }]}>{inr(pendingTotal)}</Text>
            <Text style={styles.statCardSub}>
              {language === 'mr' ? 'खर्चाचा अंदाज' : 'Total outflow requested'}
            </Text>
          </View>
        </View>

        {/* Stat 3: Authorized Role Banner */}
        <View style={[styles.statCardFull, styles.accentBorderBlue]}>
          <View style={styles.roleBannerRow}>
            <View style={styles.roleIconCircle}>
              <Text style={styles.roleIcon}>🛡️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.roleBannerTitle}>
                {language === 'mr' ? 'अधिकार श्रेणी' : 'Authorized Role'}: {roleDisplay}
              </Text>
              <Text style={styles.roleBannerSub}>
                {canApprove
                  ? (language === 'mr' ? 'तुमच्याकडे थेट खर्च मंजुरीचा अधिकार सक्रिय आहे' : 'Direct approval & audit authorization active')
                  : (language === 'mr' ? 'केवळ पाहण्याचा अधिकार उपलब्ध आहे' : 'View-only access')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} tintColor="#F97316" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCategoryRow}>
                <View style={styles.categoryIconCircle}>
                  <Text style={{ fontSize: 16 }}>💸</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.category}>{item.category || item.title || 'Expense'}</Text>
                  <Text style={styles.vendor}>
                    {t('expenses.payee') || 'Payee'}: {item.vendor || item.payee || 'General'}
                  </Text>
                </View>
              </View>
              <Text style={styles.amount}>-{inr(item.amount)}</Text>
            </View>

            {item.description ? (
              <View style={styles.descBox}>
                <Text style={styles.desc}>"{item.description}"</Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⏳ {t('approvals.pendingApproval') || 'PENDING APPROVAL'}</Text>
              </View>
              {canApprove && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item._id, item.category, item.amount)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveBtnText}>{t('approvals.approveRequest') || 'Approve Request'} ✓</Text>
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
            <Text style={styles.emptyTitle}>
              {language === 'mr' ? 'सर्व मंजुऱ्या पूर्ण! 🎉' : 'All caught up! 🎉'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'mr'
                ? 'अभिनंदन! सध्या कोणत्याही खर्चाची मंजुरी प्रलंबित नाही.'
                : 'Great work! All expense requests have been reviewed and approved.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F4' },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  /* Header */
  headerWrapper: {
    marginBottom: 12,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  countPill: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  /* Stats */
  statsContainer: {
    gap: 10,
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
  statCardFull: {
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
  accentBorderAmber: {
    borderTopWidth: 3.5,
    borderTopColor: '#F59E0B',
  },
  accentBorderRed: {
    borderTopWidth: 3.5,
    borderTopColor: '#EF4444',
  },
  accentBorderBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
  roleBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
    fontSize: 18,
  },
  roleBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  roleBannerSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Card */
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
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  vendor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  amount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#DC2626',
  },
  descBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  desc: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.04)',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  approveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  /* Empty */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 34,
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
    maxWidth: 280,
  },
});
