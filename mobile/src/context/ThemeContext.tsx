import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { COLORS as LIGHT_COLORS } from '../constants';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBg: string;
  secondary: string;
  background: string;
  surface: string;
  white: string;
  muted: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  borderStrong: string;
  card: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
}

export const DARK_COLORS: ThemeColors = {
  primary: '#FB923C',
  primaryDark: '#F97316',
  primaryLight: '#4A2A12',
  primaryBg: '#231A12',
  secondary: '#E5E7EB',

  background: '#0B0F14',
  surface: '#141A21',
  white: '#141A21',
  muted: '#1B232D',

  text: '#F8FAFC',
  textSecondary: '#B6C0CC',
  textLight: '#8994A3',

  border: '#24303D',
  borderStrong: '#304052',
  card: '#141A21',

  success: '#22C55E',
  successBg: '#10251A',
  error: '#F87171',
  errorBg: '#2A1517',
  warning: '#FBBF24',
  warningBg: '#2A2210',
  info: '#60A5FA',
  infoBg: '#122033',
};

export const LIGHT_THEME_COLORS: ThemeColors = { ...LIGHT_COLORS };

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') setMode(stored);
      } catch {
        // ignore
      }
    })();
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const setTheme = (m: ThemeMode) => {
    setMode(m);
    SecureStore.setItemAsync(STORAGE_KEY, m).catch(() => {});
  };

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_THEME_COLORS;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark: mode === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
