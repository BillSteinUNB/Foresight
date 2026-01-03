import React, { createContext, useContext, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { Transaction, SavingsGoal, Bill, Insight, User, UserPreferences, TransactionUpdate, CategoryBudget, BudgetCategory, SubscriptionOverlap } from '../types';
import { getRecurringTransactionIds, detectRecurringPatterns, RecurringPattern } from '../utils/recurring';
import { detectSubscriptions, detectOverlaps, Subscription } from '../utils/subscriptions';
import { calculateSafeToSpend, getSafeToSpendBreakdown } from '../utils/safeToSpend';
import { calculateFinancialHealthScore, getHealthScoreBreakdown, getImprovementSuggestions, HealthScoreBreakdown } from '../utils/healthScore';
import { generatePredictiveInsights, GeneratedInsight, PredictiveInsightInput } from '../utils/predictiveInsights';
import {
  formatCurrency,
  formatCurrencySimple,
  convertCurrency,
  convertAndFormat,
  getExchangeRate,
  SUPPORTED_CURRENCIES,
  Currency,
} from '../utils/currency';

// Import Zustand stores
import { useTransactionStore } from '../stores/useTransactionStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useBillStore } from '../stores/useBillStore';
import { useInsightStore } from '../stores/useInsightStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useUserStore } from '../stores/useUserStore';

type NewBillInput = Omit<Bill, 'id' | 'status' | 'isPaid'> & { isPaid?: boolean };
type UpdateBillPatch = Partial<Pick<Bill, 'name' | 'amount' | 'dueDate' | 'isPaid'>>;
type NewBudgetInput = Omit<CategoryBudget, 'id' | 'currentSpent'>;
type UpdateBudgetPatch = Partial<Pick<CategoryBudget, 'monthlyLimit' | 'alertThreshold' | 'isActive'>>;

interface AppContextType {
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  updateTransaction: (id: string, updates: TransactionUpdate) => void;
  updateTransactionsCategory: (ids: string[], category: BudgetCategory) => void;

  // Recurring Transactions
  recurringTransactionIds: Set<string>;
  recurringPatterns: RecurringPattern[];

  // Subscriptions
  subscriptions: Subscription[];
  subscriptionOverlaps: SubscriptionOverlap[];
  totalMonthlySubscriptions: number;
  totalYearlySubscriptions: number;

  // Goals
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;

  // Bills
  bills: Bill[];
  addBill: (bill: NewBillInput) => void;
  updateBill: (id: string, updates: UpdateBillPatch) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => void;

  // Insights
  insights: Insight[];
  dismissInsight: (id: string) => void;
  markInsightRead: (id: string) => void;

  // Category Budgets
  budgets: CategoryBudget[];
  addBudget: (budget: NewBudgetInput) => void;
  updateBudget: (id: string, updates: UpdateBudgetPatch) => void;
  deleteBudget: (id: string) => void;
  getCategorySpending: (category: BudgetCategory) => number;
  budgetsWithSpending: CategoryBudget[]; // Computed budgets with currentSpent filled in

  // User
  user: User;
  preferences: UserPreferences;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationPreference: (key: keyof UserPreferences['notifications'], value: boolean) => void;

  // Safe-to-Spend
  safeToSpend: number;
  safeToSpendBreakdown: {
    monthlyIncome: number;
    unpaidBills: number;
    recommendedSavings: number;
    budgetedExpenses: number;
    safeToSpend: number;
  };

  // Financial Health Score V2
  healthScoreBreakdown: HealthScoreBreakdown;
  healthScoreSuggestions: string[];

  // Predictive Insights
  predictiveInsightsInput: PredictiveInsightInput;

  // Currency helpers
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatCurrencySimple: (amount: number, currencyCode?: string) => string;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  convertAndFormat: (amount: number, fromCurrency: string, toCurrency: string) => Promise<string>;
  supportedCurrencies: Currency[];
  currentCurrency: string;

  // Persistence state
  isHydrated: boolean;
  persistenceError: Error | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider bridges Zustand stores to React Context
 * This maintains backward compatibility with existing useApp() calls
 * while leveraging Zustand's performance benefits
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // === Zustand Store Subscriptions ===
  
  // Transaction store
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const deleteTransactions = useTransactionStore((state) => state.deleteTransactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const updateTransactionsCategory = useTransactionStore((state) => state.updateTransactionsCategory);
  const transactionsHydrated = useTransactionStore((state) => state.isHydrated);

  // Goal store
  const goals = useGoalStore((state) => state.goals);
  const addGoal = useGoalStore((state) => state.addGoal);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const goalsHydrated = useGoalStore((state) => state.isHydrated);

  // Bill store
  const bills = useBillStore((state) => state.bills);
  const addBillStore = useBillStore((state) => state.addBill);
  const updateBillStore = useBillStore((state) => state.updateBill);
  const deleteBillStore = useBillStore((state) => state.deleteBill);
  const markBillPaidStore = useBillStore((state) => state.markBillPaid);
  const billsHydrated = useBillStore((state) => state.isHydrated);

  // Insight store
  const insights = useInsightStore((state) => state.insights);
  const dismissInsight = useInsightStore((state) => state.dismissInsight);
  const markInsightRead = useInsightStore((state) => state.markInsightRead);
  const insightsHydrated = useInsightStore((state) => state.isHydrated);

  // Budget store
  const budgets = useBudgetStore((state) => state.budgets);
  const addBudget = useBudgetStore((state) => state.addBudget);
  const updateBudget = useBudgetStore((state) => state.updateBudget);
  const deleteBudget = useBudgetStore((state) => state.deleteBudget);
  const budgetsHydrated = useBudgetStore((state) => state.isHydrated);

  // User store
  const user = useUserStore((state) => state.user);
  const preferences = useUserStore((state) => state.preferences);
  const updateUserStore = useUserStore((state) => state.updateUser);
  const updatePreferences = useUserStore((state) => state.updatePreferences);
  const updateNotificationPreference = useUserStore((state) => state.updateNotificationPreference);
  const userHydrated = useUserStore((state) => state.isHydrated);

  // === Computed Values ===

  // Hydration is complete when all stores are hydrated
  const isHydrated = transactionsHydrated && goalsHydrated && billsHydrated && 
                     insightsHydrated && budgetsHydrated && userHydrated;

  // Recurring transaction detection (memoized)
  const recurringTransactionIds = useMemo(() => {
    return getRecurringTransactionIds(transactions);
  }, [transactions]);

  const recurringPatterns = useMemo(() => {
    return detectRecurringPatterns(transactions);
  }, [transactions]);

  // Subscription detection (memoized)
  const subscriptions = useMemo(() => {
    return detectSubscriptions(transactions);
  }, [transactions]);

  const subscriptionOverlaps = useMemo(() => {
    return detectOverlaps(subscriptions);
  }, [subscriptions]);

  const totalMonthlySubscriptions = useMemo(() => {
    return subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  }, [subscriptions]);

  const totalYearlySubscriptions = useMemo(() => {
    return subscriptions.reduce((sum, s) => sum + s.yearlyAmount, 0);
  }, [subscriptions]);

  // Category spending calculator
  const getCategorySpending = useCallback((category: BudgetCategory): number => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          txDate >= startOfMonth &&
          txDate <= endOfMonth
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Computed budgets with current spending
  const budgetsWithSpending = useMemo(() => {
    return budgets.map(b => ({
      ...b,
      currentSpent: getCategorySpending(b.category),
    }));
  }, [budgets, getCategorySpending]);

  // === Safe-to-Spend Calculation ===
  
  // Calculate monthly income
  const now = useMemo(() => new Date(), []);
  const startOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const endOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59), [now]);
  
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return t.type === 'income' && txDate >= startOfMonth && txDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfMonth, endOfMonth]);
  
  // Calculate unpaid bills
  const unpaidBills = useMemo(() => {
    return bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);
  
  // Calculate remaining to save for goals
  const remainingToSave = useMemo(() => {
    return goals
      .filter(g => g.currentAmount < g.targetAmount)
      .reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);
  }, [goals]);
  
  const recommendedSavings = useMemo(() => remainingToSave / 12, [remainingToSave]);
  
  // Calculate total budgeted expenses
  const budgetedExpenses = useMemo(() => {
    return budgets.filter(b => b.isActive).reduce((sum, b) => sum + b.monthlyLimit, 0);
  }, [budgets]);
  
  // Calculate safe-to-spend
  const safeToSpend = useMemo(() => {
    return calculateSafeToSpend(monthlyIncome, unpaidBills, recommendedSavings, budgetedExpenses);
  }, [monthlyIncome, unpaidBills, recommendedSavings, budgetedExpenses]);
  
  const safeToSpendBreakdown = useMemo(() => ({
    monthlyIncome,
    unpaidBills,
    recommendedSavings,
    budgetedExpenses,
    safeToSpend,
  }), [monthlyIncome, unpaidBills, recommendedSavings, budgetedExpenses, safeToSpend]);

  // Current currency
  const currentCurrency = useMemo(() => preferences.currency, [preferences.currency]);

  // Currency helper functions
  const formatCurrencyFn = useCallback(
    (amount: number, currencyCode?: string) => {
      return formatCurrency(amount, currencyCode || currentCurrency);
    },
    [currentCurrency]
  );

  const formatCurrencySimpleFn = useCallback(
    (amount: number, currencyCode?: string) => {
      return formatCurrencySimple(amount, currencyCode || currentCurrency);
    },
    [currentCurrency]
  );

  const convertCurrencyFn = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      return convertCurrency(amount, fromCurrency, toCurrency);
    },
    []
  );

  const convertAndFormatFn = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      return convertAndFormat(amount, fromCurrency, toCurrency);
    },
    []
  );

  // === Wrapper functions for bill operations (to pass reminder prefs) ===
  
  const addBill = useCallback((bill: NewBillInput) => {
    addBillStore(bill, preferences.billReminder);
  }, [addBillStore, preferences.billReminder]);

  const updateBillAction = useCallback((id: string, updates: UpdateBillPatch) => {
    updateBillStore(id, updates, preferences.billReminder);
  }, [updateBillStore, preferences.billReminder]);

  const deleteBill = useCallback((id: string) => {
    deleteBillStore(id);
  }, [deleteBillStore]);

  const markBillPaid = useCallback((id: string) => {
    markBillPaidStore(id);
  }, [markBillPaidStore]);

  // === Financial Health Score Calculation ===
  
  // Calculate monthly expenses (excluding income transactions)
  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return t.type === 'expense' && txDate >= startOfMonth && txDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfMonth, endOfMonth]);

  // Calculate financial health score
  const financialHealthScore = useMemo(() => {
    return calculateFinancialHealthScore({
      monthlyIncome,
      monthlyExpenses,
      budgets: budgetsWithSpending,
      bills,
    });
  }, [monthlyIncome, monthlyExpenses, budgetsWithSpending, bills]);

  // Calculate health score breakdown (V2 - with detailed factor scores)
  const healthScoreBreakdown = useMemo(() => {
    return getHealthScoreBreakdown({
      monthlyIncome,
      monthlyExpenses,
      budgets: budgetsWithSpending,
      bills,
    });
  }, [monthlyIncome, monthlyExpenses, budgetsWithSpending, bills]);

  // Get improvement suggestions based on breakdown
  const healthScoreSuggestions = useMemo(() => {
    return getImprovementSuggestions(healthScoreBreakdown);
  }, [healthScoreBreakdown]);

  // Prepare predictive insights input for consumers
  const currentBalance = useMemo(() => user.balance || 0, [user.balance]);
  
  const predictiveInsightsInput = useMemo((): PredictiveInsightInput => ({
    transactions,
    bills,
    budgets: budgetsWithSpending,
    goals,
    monthlyIncome,
    currentBalance,
  }), [transactions, bills, budgetsWithSpending, goals, monthlyIncome, currentBalance]);

  // Update user store with calculated score when it changes
  useEffect(() => {
    if (isHydrated && user.financialHealthScore !== financialHealthScore) {
      updateUserStore({ financialHealthScore });
    }
  }, [isHydrated, financialHealthScore, user.financialHealthScore, updateUserStore]);

  // Update user store with calculated safeToSpend when it changes
  useEffect(() => {
    if (isHydrated && user.safeToSpend !== safeToSpend) {
      updateUserStore({ safeToSpend });
    }
  }, [isHydrated, safeToSpend, user.safeToSpend, updateUserStore]);

  // === Wrapper functions for user operations ===
  
  const updateUser = useCallback((updates: Partial<User>) => {
    updateUserStore(updates);
  }, [updateUserStore]);

  // === Context Value ===

  const value = useMemo(() => ({
    // Transactions
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    updateTransaction,
    updateTransactionsCategory,
    
    // Recurring
    recurringTransactionIds,
    recurringPatterns,
    
    // Subscriptions
    subscriptions,
    subscriptionOverlaps,
    totalMonthlySubscriptions,
    totalYearlySubscriptions,
    
    // Goals
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    
    // Bills
    bills,
    addBill,
    updateBill: updateBillAction,
    deleteBill,
    markBillPaid,
    
    // Insights
    insights,
    dismissInsight,
    markInsightRead,
    
    // Budgets
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategorySpending,
    budgetsWithSpending,
    
    // User
    user,
    preferences,
    updateUser,
    updatePreferences,
    updateNotificationPreference,
    
    // Safe-to-Spend
    safeToSpend,
    safeToSpendBreakdown,

    // Financial Health Score V2
    healthScoreBreakdown,
    healthScoreSuggestions,

    // Predictive Insights
    predictiveInsightsInput,
    
    // Currency helpers
    formatCurrency: formatCurrencyFn,
    formatCurrencySimple: formatCurrencySimpleFn,
    convertCurrency: convertCurrencyFn,
    convertAndFormat: convertAndFormatFn,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    currentCurrency,
    
    // Persistence state
    isHydrated,
    persistenceError: null, // Zustand handles errors internally
  }), [
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    updateTransaction,
    updateTransactionsCategory,
    recurringTransactionIds,
    recurringPatterns,
    subscriptions,
    subscriptionOverlaps,
    totalMonthlySubscriptions,
    totalYearlySubscriptions,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    bills,
    addBill,
    updateBillAction,
    deleteBill,
    markBillPaid,
    insights,
    dismissInsight,
    markInsightRead,
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategorySpending,
    budgetsWithSpending,
    user,
    preferences,
    updateUser,
    updatePreferences,
    updateNotificationPreference,
    safeToSpend,
    safeToSpendBreakdown,
    healthScoreBreakdown,
    healthScoreSuggestions,
    predictiveInsightsInput,
    currentCurrency,
    isHydrated,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to access app state and actions
 * Maintains backward compatibility while using Zustand stores internally
 */
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
