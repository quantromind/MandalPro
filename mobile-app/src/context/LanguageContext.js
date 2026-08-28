import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/locales/en.json';
import mr from '../i18n/locales/mr.json';

const translations = { en, mr };
const STORAGE_KEY = 'mandalpro_language';
const PROMPTED_KEY = 'mandalpro_language_prompted';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [isReady, setIsReady] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(true); // default true until loaded
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem(STORAGE_KEY);
        const prompted = await AsyncStorage.getItem(PROMPTED_KEY);
        if (storedLang === 'mr' || storedLang === 'en') {
          setLanguageState(storedLang);
        } else {
          setLanguageState('en');
        }
        setHasPrompted(prompted === 'true');
      } catch (e) {
        setLanguageState('en');
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang) => {
    if (lang !== 'en' && lang !== 'mr') return;
    setLanguageState(lang);
    setShowLanguageModal(false);
    setHasPrompted(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      await AsyncStorage.setItem(PROMPTED_KEY, 'true');
    } catch (e) {
      // ignore
    }
  }, []);

  const dismissLanguageModal = useCallback(async () => {
    setShowLanguageModal(false);
    setHasPrompted(true);
    try {
      await AsyncStorage.setItem(PROMPTED_KEY, 'true');
    } catch (e) {
      // ignore
    }
  }, []);

  const promptFirstTime = useCallback(() => {
    if (!hasPrompted) {
      setShowLanguageModal(true);
    }
  }, [hasPrompted]);

  const t = useCallback((path, params = {}) => {
    if (!path) return '';
    const keys = path.split('.');
    
    // 1. Try current language
    let current = translations[language];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }

    // 2. Fallback to English if missing
    if (current === undefined || current === null) {
      let fallback = translations.en;
      for (const k of keys) {
        if (fallback && typeof fallback === 'object' && k in fallback) {
          fallback = fallback[k];
        } else {
          fallback = undefined;
          break;
        }
      }
      current = fallback !== undefined ? fallback : path;
    }

    if (typeof current !== 'string') {
      return path;
    }

    // 3. Interpolate parameters (e.g. {{name}} or {name})
    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      const regex1 = new RegExp(`{{\\s*${pKey}\\s*}}`, 'g');
      const regex2 = new RegExp(`{\\s*${pKey}\\s*}`, 'g');
      result = result.replace(regex1, String(pVal)).replace(regex2, String(pVal));
    }

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isReady,
        showLanguageModal,
        setShowLanguageModal,
        dismissLanguageModal,
        hasPrompted,
        promptFirstTime
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

export default LanguageContext;
