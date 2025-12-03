
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    console.log('RootLayout mounted');
    console.log('Platform:', Platform.OS);
    
    return () => {
      console.log('RootLayout unmounting');
    };
  }, []);

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
