import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Custom storage adapter for Zustand persist middleware
 * Uses AsyncStorage for React Native persistence
 */
export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      console.error(`Error reading ${name} from storage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`Error writing ${name} to storage:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`Error removing ${name} from storage:`, error);
    }
  },
};

/**
 * Storage key prefix for all Zustand stores
 */
export const STORAGE_PREFIX = '@foresight';

/**
 * Generate a storage key for a specific store
 */
export const getStorageKey = (storeName: string): string => {
  return `${STORAGE_PREFIX}/${storeName}`;
};
