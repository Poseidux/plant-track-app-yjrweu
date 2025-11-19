
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '@/utils/storage';
import { getColors } from '@/styles/commonStyles';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    const savedMode = await StorageService.getThemeMode();
    setThemeModeState(savedMode === 'dark' ? 'dark' : 'light');
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const actualMode = mode === 'auto' ? (systemColorScheme || 'light') : mode;
    await StorageService.saveThemeMode(actualMode);
  };

  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const colors = getColors(isDark);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
