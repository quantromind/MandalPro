import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const QUEUE_KEY = 'mandalpro_pending_donations';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Save a donation locally with a temp id + idempotency key when offline
export const queueDonation = async (donation) => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  const entry = { ...donation, tempId: genId(), idempotencyKey: genId(), syncStatus: 'Pending' };
  queue.push(entry);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
};

export const getQueue = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
};

// Replays the queue against the server; server dedupes via idempotencyKey
export const syncQueue = async () => {
  const queue = await getQueue();
  const remaining = [];
  const synced = [];

  for (const item of queue) {
    try {
      const { tempId, syncStatus, ...payload } = item;
      const { data } = await client.post('/donations', payload);
      synced.push({ tempId, receipt: data });
    } catch (err) {
      remaining.push(item); // keep for retry, e.g. still offline or a real conflict
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced, remaining };
};
