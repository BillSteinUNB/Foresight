/**
 * Zustand Stores - Barrel Export
 * 
 * Re-exports all stores and selectors for convenient importing.
 * 
 * Usage:
 *   import { useTransactionStore, selectTotalIncome } from '../stores';
 */

// Storage utilities
export { zustandStorage, getStorageKey, STORAGE_PREFIX } from './storage';

// Transaction store
export {
  useTransactionStore,
  selectTransactionsByType,
  selectTransactionsByCategory,
  selectTransactionsByDateRange,
  selectTotalIncome,
  selectTotalExpenses,
  selectCurrentMonthSpending,
} from './useTransactionStore';

// Goal store
export {
  useGoalStore,
  selectTotalSaved,
  selectTotalTarget,
  selectOverallProgress,
  selectGoalById,
  selectCompletedGoals,
  selectActiveGoals,
} from './useGoalStore';

// Bill store
export {
  useBillStore,
  selectUnpaidBills,
  selectPaidBills,
  selectOverdueBills,
  selectUpcomingBills,
  selectTotalUnpaidAmount,
  selectBillById,
  selectBillsByStatus,
} from './useBillStore';

// Insight store
export {
  useInsightStore,
  selectUnreadInsights,
  selectUnreadCount,
  selectInsightsByType,
  selectInsightById,
  selectAlertInsights,
  selectPositiveInsights,
} from './useInsightStore';

// Budget store
export {
  useBudgetStore,
  selectActiveBudgets,
  selectBudgetByCategory,
  selectBudgetById,
  selectOverBudgetCategories,
  selectNearLimitCategories,
  selectTotalBudgeted,
  selectTotalSpentFromBudgets,
} from './useBudgetStore';

// User store
export {
  useUserStore,
  selectUser,
  selectPreferences,
  selectNotificationSettings,
  selectBillReminderPrefs,
  selectIsBiometricEnabled,
  selectIsPrivacyMode,
  selectTheme,
  selectCurrency,
  selectLocale,
} from './useUserStore';

/**
 * Load demo data into all stores.
 * Useful for testing, demos, or a "Demo Mode" toggle.
 */
export const loadAllDemoData = (): void => {
  const { useTransactionStore } = require('./useTransactionStore');
  const { useGoalStore } = require('./useGoalStore');
  const { useBillStore } = require('./useBillStore');
  const { useInsightStore } = require('./useInsightStore');
  const { useUserStore } = require('./useUserStore');

  useTransactionStore.getState().loadDemoData();
  useGoalStore.getState().loadDemoData();
  useBillStore.getState().loadDemoData();
  useInsightStore.getState().loadDemoData();
  useUserStore.getState().loadDemoData();
};

/**
 * Reset all stores to empty/default state.
 * Clears all user data.
 */
export const resetAllStores = (): void => {
  const { useTransactionStore } = require('./useTransactionStore');
  const { useGoalStore } = require('./useGoalStore');
  const { useBillStore } = require('./useBillStore');
  const { useInsightStore } = require('./useInsightStore');
  const { useBudgetStore } = require('./useBudgetStore');
  const { useUserStore } = require('./useUserStore');

  useTransactionStore.getState().reset();
  useGoalStore.getState().reset();
  useBillStore.getState().reset();
  useInsightStore.getState().reset();
  useBudgetStore.getState().reset();
  useUserStore.getState().reset();
};
