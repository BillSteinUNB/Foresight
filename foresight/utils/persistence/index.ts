import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PersistedAppState,
  PersistedEnvelope,
  STORAGE_KEY,
  PERSISTENCE_SCHEMA_VERSION,
} from './types';
import { runMigrations } from './migrations';

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
