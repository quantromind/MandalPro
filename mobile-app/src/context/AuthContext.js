import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [mandal, setMandal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = async () => {
    const rawUser = await AsyncStorage.getItem('mandalpro_user');
    const rawMandal = await AsyncStorage.getItem('mandalpro_mandal');
    if (rawUser) setUser(JSON.parse(rawUser));
    if (rawMandal) setMandal(JSON.parse(rawMandal));
    setLoading(false);
  };

  const persistMandal = async (m) => {
    if (m) await AsyncStorage.setItem('mandalpro_mandal', JSON.stringify(m));
    else await AsyncStorage.removeItem('mandalpro_mandal');
    setMandal(m);
  };

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    await AsyncStorage.setItem('mandalpro_token', data.token);
    await AsyncStorage.setItem('mandalpro_user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.mandal) await persistMandal(data.mandal);
    return data;
  };

  const loginWithOtp = async (email, code) => {
    const { data } = await client.post('/auth/login-otp', { email, code });
    await AsyncStorage.setItem('mandalpro_token', data.token);
    await AsyncStorage.setItem('mandalpro_user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.mandal) await persistMandal(data.mandal);
    return data;
  };

  const register = async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    await AsyncStorage.setItem('mandalpro_token', data.token);
    await AsyncStorage.setItem('mandalpro_user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.mandal) await persistMandal(data.mandal);
    return data;
  };

  const refreshProfile = async () => {
    try {
      const [userRes, mandalRes] = await Promise.all([
        client.get('/auth/me'),
        mandal ? client.get('/mandal') : Promise.resolve({ data: null })
      ]);
      if (userRes.data) {
        await AsyncStorage.setItem('mandalpro_user', JSON.stringify(userRes.data));
        setUser(userRes.data);
      }
      if (mandalRes.data) {
        await persistMandal(mandalRes.data);
      }
    } catch (err) {
      console.log('Failed to refresh profile', err);
    }
  };

  const updateMandal = async (updates) => {
    const updated = { ...mandal, ...updates };
    await persistMandal(updated);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['mandalpro_token', 'mandalpro_user', 'mandalpro_mandal']);
    setUser(null);
    setMandal(null);
  };

  return (
    <AuthContext.Provider value={{ user, mandal, loading, login, loginWithOtp, register, logout, updateMandal, persistMandal, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
