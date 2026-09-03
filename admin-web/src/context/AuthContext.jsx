import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mandalpro_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [activeMandal, setActiveMandalState] = useState(() => {
    const raw = localStorage.getItem('mandalpro_mandal');
    return raw ? JSON.parse(raw) : null;
  });

  const persistUser = (u) => {
    localStorage.setItem('mandalpro_user', JSON.stringify(u));
    setUser(u);
  };

  const persistMandal = (m) => {
    localStorage.setItem('mandalpro_mandal', JSON.stringify(m));
    setActiveMandalState(m);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('mandalpro_token', data.token);
    persistUser(data.user);
    if (data.mandal) persistMandal(data.mandal);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('mandalpro_token', data.token);
    persistUser(data.user);
    if (data.mandal) persistMandal(data.mandal);
    return data.user;
  };

  const setActiveMandal = (mandal) => persistMandal(mandal);

  const updateUser = (updates) => persistUser({ ...user, ...updates });

  const logout = () => {
    localStorage.removeItem('mandalpro_token');
    localStorage.removeItem('mandalpro_user');
    localStorage.removeItem('mandalpro_mandal');
    setUser(null);
    setActiveMandalState(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeMandal, mandal: activeMandal, login, register, logout, setActiveMandal, setMandal: setActiveMandal, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
