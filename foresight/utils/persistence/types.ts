import { Transaction, SavingsGoal, Bill, Insight, User, UserPreferences, CategoryBudget } from '../../types';

/**
 * Core app state structure that gets persisted
 */
export type PersistedAppState = {
  transactions: Transaction[];
  goals: SavingsGoal[];
  bills: Bill[];
  insights: Insight[];
  budgets?: CategoryBudget[]; // Optional for backwards compatibility
  user: User;
  preferences: UserPreferences;
};

/**
 * Envelope format with metadata for versioning and tracking
 */
export type PersistedEnvelope = {
  schemaVersion: number;
  lastUpdated: number; // Date.now() timestamp
  data: PersistedAppState;
};

// Current schema version - increment when making breaking changes
export const PERSISTENCE_SCHEMA_VERSION = 2;

// AsyncStorage key
export const STORAGE_KEY = '@foresight/appState';
