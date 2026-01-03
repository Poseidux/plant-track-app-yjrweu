
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native';

const SUPABASE_URL = "https://lsgsamzbqgxxxepqndai.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ3NhbXpicWd4eHhlcHFuZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTQyMjQsImV4cCI6MjA4MDAzMDIyNH0.-n_TkHDPuZ6aSipv7usaR98jdDRbUcvmeKZyzjNpFVc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Lazy initialization to avoid build-time errors
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  
  // Only initialize in runtime environment (not during build)
  // Check for both window (web) and Platform.OS (native)
  const isRuntime = (typeof window !== 'undefined') || (Platform.OS !== 'web');
  
  if (!isRuntime) {
    console.warn('Supabase client accessed during build time - deferring initialization');
    return null as any;
  }
  
  _supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  return _supabaseClient;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    const client = getSupabaseClient();
    if (!client) {
      console.warn(`Supabase client not initialized - cannot access property: ${String(prop)}`);
      return undefined;
    }
    return client[prop as keyof ReturnType<typeof createClient<Database>>];
  }
});
