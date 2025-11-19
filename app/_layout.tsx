
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
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
  );
}
