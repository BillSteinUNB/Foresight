import { PersistedAppState } from './types';

/**
 * Migration functions that transform state from version N to N+1
 * Each migration takes the entire app state and returns the migrated state
 */
export const migrations: Record<number, (state: PersistedAppState) => PersistedAppState> = {
  // Migration from v1 to v2: Add notes/receiptUri to transactions, billReminder to preferences, reminderNotificationIds to bills
  1: (state) => {
    return {
      ...state,
      transactions: state.transactions.map(tx => ({
        ...tx,
        notes: (tx as any).notes ?? undefined,
        receiptUri: (tx as any).receiptUri ?? undefined,
      })),
      bills: state.bills.map(bill => ({
        ...bill,
        reminderNotificationIds: (bill as any).reminderNotificationIds ?? [],
      })),
      preferences: {
        ...state.preferences,
        billReminder: (state.preferences as any).billReminder ?? {
          enabled: state.preferences.notifications.billReminders,
          daysBeforeDue: 3,
          timeOfDay: { hour: 9, minute: 0 },
        },
      },
    };
  },
};

/**
 * Run all necessary migrations to bring state to current version
 */
export const runMigrations = (
  envelope: any,
  currentSchemaVersion: number
): PersistedAppState => {
  let state = envelope.data;
  let version = envelope.schemaVersion;

  // Run migrations until we reach current version
  while (version < currentSchemaVersion) {
    const migration = migrations[version];

    if (!migration) {
      console.warn(`No migration found for version ${version}`);
      // Skip to current version to prevent infinite loop
      version = currentSchemaVersion;
      break;
    }

    try {
      console.log(`Running migration from version ${version} to ${version + 1}`);
      state = migration(state);
      version += 1;
    } catch (error) {
      console.error(`Migration from version ${version} failed:`, error);
      // Fall back to mock data on migration failure
      throw new Error(`Migration failed at version ${version}`);
    }
  }

  return state;
};
