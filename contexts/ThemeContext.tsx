
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { StorageService } from '@/utils/storage';
import { getColors } from '@/styles/commonStyles';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await StorageService.getThemeMode();
      console.log('Loaded theme mode:', savedMode);
      setThemeModeState(savedMode);
    } catch (error) {
      console.error('Error loading theme mode:', error);
      setThemeModeState('light');
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      const actualMode = mode === 'auto' ? (systemColorScheme || 'light') : mode;
      await StorageService.saveThemeMode(actualMode);
      console.log('Saved theme mode:', actualMode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const colors = getColors(isDark);

  // Show a simple loading indicator while theme is loading
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F7' }}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

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
