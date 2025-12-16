
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '@/utils/storage';
import { getColors } from '@/styles/commonStyles';
import { APP_THEMES, AppTheme } from '@/constants/Themes';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
  selectedTheme: string;
  setSelectedTheme: (themeId: string) => Promise<void>;
  currentTheme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  // FIXED: Default to 'light' instead of 'dark'
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [selectedTheme, setSelectedThemeState] = useState<string>('default');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const [savedMode, savedTheme] = await Promise.all([
        StorageService.getThemeMode(),
        StorageService.getSelectedTheme(),
      ]);
      console.log('Loaded theme mode:', savedMode, 'theme:', savedTheme);
      setThemeModeState(savedMode);
      setSelectedThemeState(savedTheme);
    } catch (error) {
      console.error('Error loading theme settings:', error);
      // FIXED: Default to 'light' mode
      setThemeModeState('light');
      setSelectedThemeState('default');
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

  const setSelectedTheme = async (themeId: string) => {
    try {
      setSelectedThemeState(themeId);
      await StorageService.saveSelectedTheme(themeId);
      console.log('Saved selected theme:', themeId);
      
      const theme = APP_THEMES.find(t => t.id === themeId);
      if (theme && theme.forcedMode) {
        await setThemeMode(theme.forcedMode);
      }
    } catch (error) {
      console.error('Error saving selected theme:', error);
    }
  };

  const currentTheme = APP_THEMES.find(t => t.id === selectedTheme) || APP_THEMES[0];
  
  const isDark = currentTheme.forcedMode 
    ? currentTheme.forcedMode === 'dark'
    : (themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark'));
  
  const colors = selectedTheme === 'default' 
    ? getColors(isDark)
    : currentTheme.colors;

  if (!isLoaded) {
    // FIXED: Default to light mode while loading
    const defaultColors = getColors(false);
    const defaultTheme = APP_THEMES[0];
    return (
      <ThemeContext.Provider value={{ 
        themeMode: 'light', 
        setThemeMode, 
        colors: defaultColors, 
        isDark: false,
        selectedTheme: 'default',
        setSelectedTheme,
        currentTheme: defaultTheme,
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      setThemeMode, 
      colors, 
      isDark,
      selectedTheme,
      setSelectedTheme,
      currentTheme,
    }}>
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
