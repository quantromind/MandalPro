import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../i18n/locales/en.json';
import mr from '../i18n/locales/mr.json';

const translations = { en, mr };
const STORAGE_KEY = 'mandalpro_language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'mr' || stored === 'en' ? stored : 'mr'; // default Marathi or stored
    } catch {
      return 'mr';
    }
  });

  const setLanguage = useCallback((lang) => {
    if (lang !== 'en' && lang !== 'mr') return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error(e);
    }
  }, []);

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

    // 2. Fallback to English
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

    // 3. Interpolate parameters e.g. {{name}} or {name}
    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      const regex1 = new RegExp(`{{\\s*${pKey}\\s*}}`, 'g');
      const regex2 = new RegExp(`{\\s*${pKey}\\s*}`, 'g');
      result = result.replace(regex1, String(pVal)).replace(regex2, String(pVal));
    }

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
