import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
}

const STORAGE_KEY = 'toptruyenaudio:theme:v1';

const getInitialPreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const clean = saved.replace(/['"]/g, '').toUpperCase();
      if (clean === 'LIGHT' || clean === 'DARK' || clean === 'SYSTEM') {
        return clean as ThemePreference;
      }
    }
    const legacy = localStorage.getItem('app_user_preferences');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && parsed.theme) {
        const t = String(parsed.theme).toUpperCase();
        if (t === 'LIGHT' || t === 'DARK' || t === 'SYSTEM') {
          return t as ThemePreference;
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse theme preference', e);
  }
  return 'DARK';
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme: ResolvedTheme =
    preference === 'SYSTEM' ? systemTheme : preference === 'DARK' ? 'dark' : 'light';

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    try {
      localStorage.setItem(STORAGE_KEY, newPref);
      const legacyRaw = localStorage.getItem('app_user_preferences');
      const legacyObj = legacyRaw ? JSON.parse(legacyRaw) : {};
      legacyObj.theme = newPref.toLowerCase();
      localStorage.setItem('app_user_preferences', JSON.stringify(legacyObj));
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
