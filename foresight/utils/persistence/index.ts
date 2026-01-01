import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PersistedAppState,
  PersistedEnvelope,
  STORAGE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
} from './types';
import { runMigrations } from './migrations';

/**
 * Legacy storage keys that should be cleaned up on app startup
 * These keys were used in previous versions of the app
 */
const LEGACY_STORAGE_KEYS = [
  '@foresight/transactions',
  '@foresight/goals',
  '@foresight/bills',
  '@foresight/insights',
  '@foresight/budget',
  '@foresight/user',
  '@foresight/preferences',
  '@foresight/auth',
  'foresight_transactions',
  'foresight_goals',
  'foresight_bills',
  'foresight_user',
  'foresight_app_state',
  'async_storage_key',
  'react-native-async-storage_legacy',
];

/**
 * Clean up legacy storage keys from previous app versions
 * This helps prevent conflicts with the new unified persistence system
 */
export const cleanupLegacyStorage = async (): Promise<{
  cleaned: number;
  errors: string[];
}> => {
  const results = {
    cleaned: 0,
    errors: [] as string[],
  };

  try {
    const allKeys = await AsyncStorage.getAllKeys();

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      if (allKeys.includes(legacyKey)) {
        try {
          await AsyncStorage.removeItem(legacyKey);
          console.log(`Cleaned up legacy storage key: ${legacyKey}`);
          results.cleaned += 1;
        } catch (error) {
          const errorMessage = `Failed to clean up ${legacyKey}: ${error}`;
          console.warn(errorMessage);
          results.errors.push(errorMessage);
        }
      }
    }

    console.log(`Legacy cleanup complete: ${results.cleaned} keys removed`);
  } catch (error) {
    console.error('Error during legacy storage cleanup:', error);
    results.errors.push(`Cleanup error: ${error}`);
  }

  return results;
};

/**
 * Initialize persistence system with cleanup of legacy data
 * Should be called once on app startup
 */
export const initializePersistence = async (): Promise<{
  legacyCleanup: { cleaned: number; errors: string[] };
  persistedState: PersistedAppState | null;
}> => {
  // Clean up legacy storage first
  const legacyCleanup = await cleanupLegacyStorage();

  // Then load the current persisted state
  const persistedState = await loadPersistedState();

  return { legacyCleanup, persistedState };
};

/**
 * Load persisted state from AsyncStorage
 * Returns null if no data exists or if data is corrupted
 */
export const loadPersistedState = async (): Promise<PersistedAppState | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      console.log('No persisted data found (first run)');
      return null;
    }

    const envelope: PersistedEnvelope = JSON.parse(stored);

    // Validate envelope structure
    if (!envelope || typeof envelope !== 'object') {
      console.warn('Invalid persisted data format');
      await clearPersistedState();
      return null;
    }

    if (!envelope.schemaVersion || !envelope.data) {
      console.warn('Invalid envelope structure');
      await clearPersistedState();
      return null;
    }

    console.log(
      `Loaded persisted data (schema version ${envelope.schemaVersion}, updated ${new Date(
        envelope.lastUpdated
      ).toISOString()})`
    );

    // Run migrations if needed
    if (envelope.schemaVersion < PERSISTENCE_SCHEMA_VERSION) {
      console.log(
        `Migrating from schema version ${envelope.schemaVersion} to ${PERSISTENCE_SCHEMA_VERSION}`
      );
      try {
        const migratedData = runMigrations(envelope, PERSISTENCE_SCHEMA_VERSION);

        // Save migrated data immediately
        const updatedEnvelope: PersistedEnvelope = {
          schemaVersion: PERSISTENCE_SCHEMA_VERSION,
          lastUpdated: Date.now(),
          data: migratedData,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEnvelope));
        console.log('Migration completed and saved');

        return migratedData;
      } catch (error) {
        console.error('Migration failed, falling back to initial data:', error);
        await clearPersistedState();
        return null;
      }
    }

    // Validate that all required fields exist
    const requiredFields: (keyof PersistedAppState)[] = [
      'transactions',
      'goals',
      'bills',
      'insights',
      'user',
      'preferences',
    ];

    for (const field of requiredFields) {
      if (!(field in envelope.data)) {
        console.warn(`Missing required field: ${field}`);
        await clearPersistedState();
        return null;
      }
    }

    return envelope.data;
  } catch (error) {
    console.error('Error loading persisted state:', error);
    // Clear corrupted data and return null (will fallback to mock data)
    try {
      await clearPersistedState();
    } catch (clearError) {
      console.error('Error clearing corrupted data:', clearError);
    }
    return null;
  }
};

/**
 * Save app state to AsyncStorage
 * Wraps data in envelope with metadata
 */
export const savePersistedState = async (state: PersistedAppState): Promise<void> => {
  try {
    const envelope: PersistedEnvelope = {
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      lastUpdated: Date.now(),
      data: state,
    };

    const serialized = JSON.stringify(envelope);

    console.log(`Saving app state (${serialized.length} bytes)`);

    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Error saving persisted state:', error);
    throw error;
  }
};

/**
 * Clear all persisted data
 * Useful for logout or data reset
 */
export const clearPersistedState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Cleared persisted data');
  } catch (error) {
    console.error('Error clearing persisted state:', error);
    throw error;
  }
};

/**
 * Get metadata about persisted data without loading full state
 */
export const getPersistenceInfo = async (): Promise<{
  exists: boolean;
  schemaVersion?: number;
  lastUpdated?: number;
  size?: number;
} | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { exists: false };
    }

    const envelope: PersistedEnvelope = JSON.parse(stored);

    return {
      exists: true,
      schemaVersion: envelope.schemaVersion,
      lastUpdated: envelope.lastUpdated,
      size: stored.length,
    };
  } catch (error) {
    console.error('Error getting persistence info:', error);
    return null;
  }
};
