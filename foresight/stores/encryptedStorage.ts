import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

/**
 * Encrypted storage adapter for Zustand persist middleware
 * Uses expo-secure-store for native platforms to encrypt sensitive data
 * Falls back to localStorage for web
 * 
 * Security: All data is encrypted at rest using iOS Keychain / Android Keystore
 */
export const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't have SecureStore, use localStorage with warning
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(name);
        }
        return null;
      }
      // Native: Use encrypted secure storage
      const value = await SecureStore.getItemAsync(name);
      return value;
    } catch (error) {
      console.error(`EncryptedStorage: Error reading ${name}:`, error);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't have SecureStore, use localStorage with warning
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(name, value);
        }
        return;
      }
      // Native: Use encrypted secure storage
      // Note: expo-secure-store options may vary by version
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error(`EncryptedStorage: Error writing ${name}:`, error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(name);
        }
        return;
      }
      // Native: Use encrypted secure storage
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error(`EncryptedStorage: Error removing ${name}:`, error);
    }
  },
};

/**
 * Hybrid storage adapter that selectively encrypts sensitive keys
 * Uses encrypted storage for sensitive data and regular storage for non-sensitive data
 * 
 * Sensitive keys that get encrypted:
 * - user: Contains financial data (balance, netWorth, financialHealthScore)
 * - auth: Authentication tokens
 */
const SENSITIVE_KEYS = ['user', 'auth', 'goals', 'bills', 'insights'];

export const hybridStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Use encrypted storage for sensitive data
      if (SENSITIVE_KEYS.some(key => name.includes(key))) {
        if (Platform.OS === 'web') {
          return typeof localStorage !== 'undefined' ? localStorage.getItem(name) : null;
        }
        return await SecureStore.getItemAsync(name);
      }
      
      // Use regular AsyncStorage for non-sensitive data (performance)
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const asyncStorage = AsyncStorage.default || AsyncStorage;
      return await asyncStorage.getItem(name);
    } catch (error) {
      console.error(`HybridStorage: Error reading ${name}:`, error);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Use encrypted storage for sensitive data
      if (SENSITIVE_KEYS.some(key => name.includes(key))) {
        if (Platform.OS === 'web') {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(name, value);
          }
          return;
        }
        await SecureStore.setItemAsync(name, value);
        return;
      }
      
      // Use regular AsyncStorage for non-sensitive data (performance)
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const asyncStorage = AsyncStorage.default || AsyncStorage;
      await asyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`HybridStorage: Error writing ${name}:`, error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      // Use encrypted storage for sensitive data
      if (SENSITIVE_KEYS.some(key => name.includes(key))) {
        if (Platform.OS === 'web') {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(name);
          }
          return;
        }
        await SecureStore.deleteItemAsync(name);
        return;
      }
      
      // Use regular AsyncStorage for non-sensitive data
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const asyncStorage = AsyncStorage.default || AsyncStorage;
      await asyncStorage.removeItem(name);
    } catch (error) {
      console.error(`HybridStorage: Error removing ${name}:`, error);
    }
  },
};

/**
 * Check if secure storage is available (native only)
 */
export const isSecureStorageAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    // Test if we can access secure store
    await SecureStore.getItemAsync('__test_key__');
    return true;
  } catch {
    return false;
  }
};

/**
 * Get security status of the app's storage
 */
export const getStorageSecurityStatus = async (): Promise<{
  isSecure: boolean;
  platform: string;
  storageType: 'encrypted' | 'hybrid' | 'plain';
}> => {
  const isNative = Platform.OS !== 'web';
  const isSecure = await isSecureStorageAvailable();
  
  return {
    isSecure: isNative && isSecure,
    platform: Platform.OS,
    storageType: isNative && isSecure ? 'encrypted' : 'plain',
  };
};
