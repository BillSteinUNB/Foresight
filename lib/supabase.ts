import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://pwxjtxihricohdasjmiv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eGp0eGlocmljb2hkYXNqbWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTczNzQsImV4cCI6MjA4Mjg3MzM3NH0.ueq_3OHb5FMvUK4_ulyPSV34CFenspOeoAAf4vh_N44';

/**
 * Custom storage adapter using expo-secure-store for native platforms
 * and localStorage for web (development).
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Supabase client configured for React Native with secure token storage.
 * 
 * Features:
 * - Uses expo-secure-store for secure auth token persistence
 * - Auto-refreshes tokens
 * - Detects session from secure storage on app launch
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native (no URL to detect)
  },
});

export { SUPABASE_URL };
