import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await client.get('/events');
      setEvents(data);
    } catch (err) {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No events yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontWeight: '700', fontSize: 16 },
  type: { color: '#6b7280', marginTop: 2 },
  status: { color: '#d9480f', fontWeight: '600', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 }
});
