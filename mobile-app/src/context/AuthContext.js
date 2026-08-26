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
    try {
      const rawUser = await AsyncStorage.getItem('mandalpro_user');
      const rawMandal = await AsyncStorage.getItem('mandalpro_mandal');
      const rawToken = await AsyncStorage.getItem('mandalpro_token');
      if (rawUser) setUser(JSON.parse(rawUser));
      if (rawMandal) setMandal(JSON.parse(rawMandal));
      if (rawToken) {
        // Silently sync latest user and mandal data from server
        refreshProfile();
      }
    } catch (e) {
      console.log('Error reading storage', e);
    } finally {
      setLoading(false);
    }
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
    if (data.mandal) {
      await AsyncStorage.setItem('mandalpro_mandal', JSON.stringify(data.mandal));
      setMandal(data.mandal);
    }
    setUser(data.user);
    return data;
  };

  const loginWithOtp = async (email, code) => {
    const { data } = await client.post('/auth/login-otp', { email, code });
    await AsyncStorage.setItem('mandalpro_token', data.token);
    await AsyncStorage.setItem('mandalpro_user', JSON.stringify(data.user));
    
    let mandalData = data.mandal || null;
    if (!mandalData && data.user?.mandalId) {
      try {
        const mandalRes = await client.get('/mandal');
        if (mandalRes.data) mandalData = mandalRes.data;
      } catch (e) {
        console.log('[AuthContext] Could not fetch mandal after OTP login', e);
      }
    }

    if (mandalData) {
      await AsyncStorage.setItem('mandalpro_mandal', JSON.stringify(mandalData));
      setMandal(mandalData);
    }
    
    // Set user after mandal is prepared so RootNavigator renders the correct screen immediately
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    await AsyncStorage.setItem('mandalpro_token', data.token);
    await AsyncStorage.setItem('mandalpro_user', JSON.stringify(data.user));
    if (data.mandal) {
      await AsyncStorage.setItem('mandalpro_mandal', JSON.stringify(data.mandal));
      setMandal(data.mandal);
    }
    setUser(data.user);
    return data;
  };

  const refreshProfile = async () => {
    try {
      const userRes = await client.get('/auth/me');
      if (userRes.data) {
        const userData = {
          id: userRes.data.id || userRes.data._id,
          name: userRes.data.name,
          email: userRes.data.email,
          mobile: userRes.data.mobile,
          role: userRes.data.role,
          mandalId: userRes.data.mandalId
        };
        await AsyncStorage.setItem('mandalpro_user', JSON.stringify(userData));
        setUser(userData);

        if (userRes.data.mandal) {
          await persistMandal(userRes.data.mandal);
        } else if (userData.mandalId) {
          try {
            const mandalRes = await client.get('/mandal');
            if (mandalRes.data) await persistMandal(mandalRes.data);
          } catch (mErr) {
            console.log('Failed to fetch mandal in refreshProfile', mErr);
          }
        }
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
