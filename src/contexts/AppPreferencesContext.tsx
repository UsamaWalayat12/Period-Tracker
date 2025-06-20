import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n'; // Import your i18n instance

export type ThemeType = 'light' | 'dark' | 'system';
export type LanguageType = 'en' | 'fr' | 'es' | 'de' | 'pt';

interface AppPreferencesContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  compactView: boolean;
  setCompactView: (compact: boolean) => void;
  trackingOption1?: boolean;
  setTrackingOption1?: (value: boolean) => void;
  trackingOption2?: boolean;
  setTrackingOption2?: (value: boolean) => void;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  // Default values (could be loaded from localStorage or Firebase on app load)
  const [theme, setTheme] = useState<ThemeType>('system');
  const [language, setLanguage] = useState<LanguageType>('en');
  const [compactView, setCompactView] = useState(false);
  const [trackingOption1, setTrackingOption1] = useState(false);
  const [trackingOption2, setTrackingOption2] = useState(false);

  // Optionally, persist to localStorage for fast reloads
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language); // Update i18n instance when language changes
  }, [language]);
  useEffect(() => {
    localStorage.setItem('compactView', compactView ? '1' : '0');
  }, [compactView]);
  useEffect(() => {
    localStorage.setItem('trackingOption1', trackingOption1 ? '1' : '0');
  }, [trackingOption1]);
  useEffect(() => {
    localStorage.setItem('trackingOption2', trackingOption2 ? '1' : '0');
  }, [trackingOption2]);

  // Optionally, load from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null;
    const storedLang = localStorage.getItem('language') as LanguageType | null;
    const storedCompact = localStorage.getItem('compactView');
    const storedTrackingOption1 = localStorage.getItem('trackingOption1');
    const storedTrackingOption2 = localStorage.getItem('trackingOption2');
    if (storedTheme) setTheme(storedTheme);
    if (storedLang) {
      setLanguage(storedLang);
      i18n.changeLanguage(storedLang); // Initialize i18n with stored language
    }
    if (storedCompact) setCompactView(storedCompact === '1');
    if (storedTrackingOption1) setTrackingOption1(storedTrackingOption1 === '1');
    if (storedTrackingOption2) setTrackingOption2(storedTrackingOption2 === '1');
  }, []);

  return (
    <AppPreferencesContext.Provider value={{
      theme, setTheme,
      language, setLanguage,
      compactView, setCompactView,
      trackingOption1, setTrackingOption1,
      trackingOption2, setTrackingOption2,
    }}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return ctx;
} 