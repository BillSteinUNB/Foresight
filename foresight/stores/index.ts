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
