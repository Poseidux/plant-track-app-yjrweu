
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = "https://lsgsamzbqgxxxepqndai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ3NhbXpicWd4eHhlcHFuZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTQyMjQsImV4cCI6MjA4MDAzMDIyNH0.-n_TkHDPuZ6aSipv7usaR98jdDRbUcvmeKZyzjNpFVc";

// Platform-specific storage adapter with SSR guards
const storage = Platform.OS === 'web' 
  ? {
      getItem: async (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    }
  : AsyncStorage;

// Lazy-initialized Supabase client to prevent server-side errors
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  // Additional SSR guard - don't initialize on server
  if (typeof window === 'undefined' && Platform.OS === 'web') {
    console.log('Supabase client initialization skipped - SSR context detected');
    return null as any;
  }

  if (!_supabaseClient) {
    console.log('Initializing Supabase client...');
    _supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: storage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Disable auto-initialization to prevent SSR issues
        flowType: 'pkce',
      },
    });
    console.log('Supabase client initialized successfully');
  }
  return _supabaseClient;
}

// Export lazy-loaded client using a Proxy to defer initialization
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(target, prop) {
    const client = getSupabaseClient();
    
    // Return no-op functions during SSR
    if (!client) {
      console.log('Supabase client not available (SSR context)');
      return () => Promise.resolve(null);
    }
    
    const value = client[prop as keyof typeof client];
    
    // Bind methods to the client instance
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});
