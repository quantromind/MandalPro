import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { getQueue, syncQueue } from '../utils/offlineQueue';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

import { useLanguage } from '../context/LanguageContext';

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [pending, setPending] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { mandal, user } = useAuth();
  const { t } = useLanguage();

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const load = async () => {
    await syncQueue();
    try {
      const { data } = await client.get('/donations');
      setReceipts(data);
    } catch (err) {}
    setPending(await getQueue());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const combined = [
    ...pending.map((p) => ({ ...p, _id: p.tempId, receiptNumber: t('receipts.pendingSync'), status: 'Pending' })),
    ...receipts
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={combined}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.78}
            onPress={() => setSelectedReceipt(item)}
          >
            <View style={styles.cardTop}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{item.donorName ? item.donorName[0].toUpperCase() : '🙏'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.donor}>{item.donorName}</Text>
                <Text style={styles.receiptNo}>{t('receipts.receiptNo', { number: item.receiptNumber })}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{inr(item.amount)}</Text>
                <View style={[styles.statusBadge, item.status === 'Pending' && styles.statusPending]}>
                  <Text style={[styles.statusText, item.status === 'Pending' && styles.statusTextPending]}>
                    {item.status === 'Pending' ? `⏳ ${t('common.pending')}` : `✓ ${t('receipts.issued')}`}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.metaText} numberOfLines={1}>
                {item.donorMobile ? `📱 ${item.donorMobile} ` : ''}
                {item.paymentMode ? `· 💳 ${item.paymentMode.toUpperCase()} ` : ''}
                {item.purpose ? `· 🎯 ${item.purpose}` : ''}
              </Text>
              <View style={styles.sharePill}>
                <Text style={styles.viewText}>{t('receipts.shareWhatsApp')} 📲</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🧾</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('receipts.noReceiptsYet')}</Text>
            <Text style={styles.emptySubtitle}>{t('receipts.noReceiptsSubtitle')}</Text>
          </View>
        }
      />

      {/* Digital Receipt Modal with WhatsApp Sharing */}
      <ReceiptModal
        visible={!!selectedReceipt}
        receipt={selectedReceipt}
        mandal={mandal}
        collectorName={user?.name}
        onClose={() => setSelectedReceipt(null)}
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#F97316' },
  donor: { fontWeight: '800', fontSize: 15.5, color: '#172554' },
  receiptNo: { color: '#64748B', fontSize: 11.5, marginTop: 2, fontWeight: '600' },
  amount: { fontWeight: '800', fontSize: 17.5, color: '#F97316' },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)'
  },
  statusText: {
    fontSize: 10.5,
    color: '#059669',
    fontWeight: '800'
  },
  statusTextPending: {
    color: '#D97706'
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 37, 84, 0.04)'
  },
  metaText: { fontSize: 12, color: '#64748B', flex: 1, fontWeight: '500' },
  sharePill: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8
  },
  viewText: { fontSize: 11.5, color: '#15803D', fontWeight: '800' },
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
