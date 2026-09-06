import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production backend URL on Hostinger VPS (used for installed standalone APKs)
const PROD_API_URL = 'https://aplamandal.quantromind.com/api';

// Always use production backend — ensures OTP email works in both Expo dev and standalone APK
export const API_URL = PROD_API_URL;
console.log(`[AplaMandal API] -> ${API_URL}`);

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
