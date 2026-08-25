import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Local development IP for Expo Go testing
const LOCAL_API_URL = 'http://10.30.168.210:5000/api';

// Production backend on Render for standalone APK builds
const PROD_API_URL = 'https://mandalpro.onrender.com/api';

// Detect if running in Expo Go (Development) or Standalone APK (Production)
const isExpoGo =
  Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient ||
  Constants?.appOwnership === 'expo' ||
  (typeof __DEV__ !== 'undefined' && __DEV__ && Constants?.appOwnership !== 'standalone');

export const API_URL = isExpoGo ? LOCAL_API_URL : PROD_API_URL;

console.log(`[MandalPro API] Environment: ${isExpoGo ? 'Expo Go (Local)' : 'Standalone APK (Production)'} | BaseURL: ${API_URL}`);

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('mandalpro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
