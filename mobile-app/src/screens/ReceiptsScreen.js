import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { getQueue, syncQueue } from '../utils/offlineQueue';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [pending, setPending] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { mandal, user } = useAuth();

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
    ...pending.map((p) => ({ ...p, _id: p.tempId, receiptNumber: 'Pending sync', status: 'Pending' })),
    ...receipts
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={combined}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setSelectedReceipt(item)}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.donor}>{item.donorName}</Text>
                <Text style={styles.receiptNo}>#{item.receiptNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{inr(item.amount)}</Text>
                <View style={[styles.statusBadge, item.status === 'Pending' && styles.statusPending]}>
                  <Text style={[styles.statusText, item.status === 'Pending' && styles.statusTextPending]}>
                    {item.status || 'Issued'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.metaText}>
                {item.donorMobile ? `📱 ${item.donorMobile} · ` : ''}
                {item.paymentMode ? `💳 ${item.paymentMode.toUpperCase()}` : ''}
                {item.purpose ? ` · 🎯 ${item.purpose}` : ''}
              </Text>
              <Text style={styles.viewText}>View & Share 📲</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No receipts issued yet</Text>
            <Text style={styles.emptySubtitle}>All issued donation receipts will appear here.</Text>
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
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  donor: { fontWeight: '700', fontSize: 16, color: '#17233C' },
  receiptNo: { color: '#6B7280', fontSize: 12, marginTop: 3, fontWeight: '500' },
  amount: { fontWeight: '800', fontSize: 17, color: '#FF6B00' },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)'
  },
  statusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700'
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
    borderTopColor: '#F3F4F6'
  },
  metaText: { fontSize: 12, color: '#6B7280', flex: 1 },
  viewText: { fontSize: 12, color: '#25D366', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#17233C', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }
});
