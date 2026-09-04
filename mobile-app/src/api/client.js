import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Production backend URL on Hostinger VPS (works on all devices & 4G/5G mobile data)
const PROD_API_URL = 'https://aplamandal.quantromind.com/api';

// Set to true only if you want Expo Go development client to point to local PC (port 5000)
const USE_LOCAL_BACKEND = false;

let LOCAL_API_URL = 'http://192.168.1.13:5000/api';
try {
  const debuggerHost = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost || Constants?.manifest?.debuggerHost;
  const devHostIp = debuggerHost ? debuggerHost.split(':')[0] : '192.168.1.13';
  LOCAL_API_URL = `http://${devHostIp}:5000/api`;
} catch (e) {
  // Safe fallback
}

// Strictly detect Expo Go app client (StoreClient) vs installed Standalone APK
const isExpoGo =
  Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient ||
  Constants?.appOwnership === 'expo';

// Standalone APKs (production & preview builds) ALWAYS use PROD_API_URL
export const API_URL = (USE_LOCAL_BACKEND && isExpoGo) ? LOCAL_API_URL : PROD_API_URL;

const client = axios.create({
  baseURL: API_URL,
  timeout: 45000, // 45s to accommodate Render free-tier cold starts
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('mandalpro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
