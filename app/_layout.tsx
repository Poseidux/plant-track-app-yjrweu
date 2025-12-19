
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_LOG_DAY_KEY = '@active_log_day';

// Helper to get local date string in America/Toronto timezone
const getLocalDateString = (date: Date = new Date()): string => {
  // Convert to America/Toronto timezone
  const torontoDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const year = torontoDate.getFullYear();
  const month = String(torontoDate.getMonth() + 1).padStart(2, '0');
  const day = String(torontoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('RootLayout mounted');
    console.log('Platform:', Platform.OS);
    
    // Check for day rollover on app start
    checkDayRollover();
    
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      console.log('RootLayout unmounting');
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('App state changed from', appState.current, 'to', nextAppState);
    
    // When app comes to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App returned to foreground - checking for day rollover');
      await checkDayRollover();
    }
    
    appState.current = nextAppState;
  };

  const checkDayRollover = async () => {
    try {
      const currentLogDay = getLocalDateString();
      console.log('Current Log Day (Toronto):', currentLogDay);
      
      // Get the saved Active Log Day
      const savedActiveLogDay = await AsyncStorage.getItem(ACTIVE_LOG_DAY_KEY);
      console.log('Saved Active Log Day:', savedActiveLogDay);
      
      if (!savedActiveLogDay) {
        // First time opening the app - set the current day as active
        console.log('No saved Active Log Day - setting current day as active');
        await AsyncStorage.setItem(ACTIVE_LOG_DAY_KEY, currentLogDay);
        return;
      }
      
      if (savedActiveLogDay !== currentLogDay) {
        // Day has changed! Perform rollover
        console.log('DAY ROLLOVER DETECTED!');
        console.log('Previous day:', savedActiveLogDay);
        console.log('New day:', currentLogDay);
        
        // Update the Active Log Day to the new day
        await AsyncStorage.setItem(ACTIVE_LOG_DAY_KEY, currentLogDay);
        
        console.log('Day rollover complete - new Active Log Day set to:', currentLogDay);
        console.log('The tracker will now show an empty log for the new day');
      } else {
        console.log('Same day - no rollover needed');
      }
    } catch (error) {
      console.error('Error checking day rollover:', error);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="App Error">
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="formsheet" options={{ presentation: 'formSheet' }} />
          <Stack.Screen 
            name="transparent-modal" 
            options={{ 
              presentation: 'transparentModal',
              animation: 'fade',
            }} 
          />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
