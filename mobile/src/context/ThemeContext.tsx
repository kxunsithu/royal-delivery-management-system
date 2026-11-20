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
  white: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  card: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export const DARK_COLORS: ThemeColors = {
  primary: '#E67701',
  primaryDark: '#B45309',
  primaryLight: '#7C3A00',
  primaryBg: '#2A1F14',
  secondary: '#E5E7EB',
  background: '#111827',
  white: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textLight: '#9CA3AF',
  border: '#374151',
  card: '#1F2937',
  success: '#22C55E',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
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