import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Transaction, SavingsGoal, Bill, Insight, User, UserPreferences, TransactionUpdate, CategoryBudget, BudgetCategory, BillReminderPreferences, DetectedSubscription, SubscriptionOverlap } from '../types';
import {
  TRANSACTIONS as INITIAL_TRANSACTIONS,
  GOALS as INITIAL_GOALS,
  BILLS as INITIAL_BILLS,
  INSIGHTS as INITIAL_INSIGHTS,
  USER as INITIAL_USER,
  USER_PREFERENCES as INITIAL_PREFERENCES
} from '../mockData';
import { loadPersistedState, savePersistedState } from '../utils/persistence';
import { useDebouncedEffect } from '../utils/useDebouncedEffect';
import { getBillStatus } from '../utils/billUtils';
import { scheduleBillReminder, cancelNotifications, DEFAULT_BILL_REMINDER_PREFS } from '../utils/notifications';
import { getRecurringTransactionIds, detectRecurringPatterns, RecurringPattern } from '../utils/recurring';
import { detectSubscriptions, detectOverlaps, Subscription } from '../utils/subscriptions';

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
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationPreference: (key: keyof UserPreferences['notifications'], value: boolean) => void;

  // Persistence state
  isHydrated: boolean;
  persistenceError: Error | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([...INITIAL_TRANSACTIONS]);
  const [goals, setGoals] = useState<SavingsGoal[]>([...INITIAL_GOALS]);
  const [bills, setBills] = useState<Bill[]>([...INITIAL_BILLS]);
  const [insights, setInsights] = useState<Insight[]>([...INITIAL_INSIGHTS]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [user] = useState<User>(INITIAL_USER);
  const [preferences, setPreferences] = useState<UserPreferences>({...INITIAL_PREFERENCES});

  // Persistence state
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<Error | null>(null);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const persistedData = await loadPersistedState();

        if (persistedData) {
          console.log('Hydrating app state from persistence');
          setTransactions(persistedData.transactions);
          setGoals(persistedData.goals);
          setBills(persistedData.bills);
          setInsights(persistedData.insights);
          if (persistedData.budgets) {
            setBudgets(persistedData.budgets);
          }
          // User is not updatable in current design, keep mock user
          setPreferences(persistedData.preferences);
        } else {
          console.log('No persisted data, using mock data');
        }

        setIsHydrated(true);
      } catch (error) {
        console.error('Hydration failed:', error);
        setPersistenceError(error as Error);
        setIsHydrated(true);
      }
    };

    hydrate();
  }, []); // Run once on mount

  // Auto-save on state changes (debounced, 1 second)
  useDebouncedEffect(
    () => {
      if (!isHydrated) return; // Don't save during hydration

      const currentState = {
        transactions,
        goals,
        bills,
        insights,
        budgets,
        user,
        preferences,
      };

      savePersistedState(currentState).catch(error => {
        console.error('Auto-save failed:', error);
        setPersistenceError(error);
      });
    },
    [transactions, goals, bills, insights, budgets, user, preferences, isHydrated],
    1000
  );

  // Transaction actions
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const deleteTransactions = useCallback((ids: string[]) => {
    const idsSet = new Set(ids);
    setTransactions(prev => prev.filter(t => !idsSet.has(t.id)));
  }, []);

  const updateTransaction = useCallback((id: string, updates: TransactionUpdate) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates, id: t.id } : t)
    );
  }, []);

  // Goal actions
  const addGoal = useCallback((goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setGoals(prev => [...prev, newGoal]);
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  // Bill actions
  const addBill = useCallback(async (bill: NewBillInput) => {
    // Validation
    if (!bill.name.trim()) {
      console.warn('Bill name is required');
      return;
    }
    if (!bill.amount || bill.amount <= 0) {
      console.warn('Bill amount must be positive');
      return;
    }
    if (isNaN(new Date(bill.dueDate).getTime())) {
      console.warn('Invalid due date');
      return;
    }

    const newBill: Bill = {
      name: bill.name.trim(),
      amount: bill.amount,
      dueDate: bill.dueDate,
      isPaid: bill.isPaid ?? false,
      status: getBillStatus(bill.dueDate, bill.isPaid),
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Schedule reminder notifications if enabled
    const reminderPrefs = preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS;
    if (reminderPrefs.enabled && !newBill.isPaid) {
      try {
        const notificationIds = await scheduleBillReminder(newBill, reminderPrefs);
        if (notificationIds.length > 0) {
          newBill.reminderNotificationIds = notificationIds;
        }
      } catch (error) {
        console.warn('Failed to schedule bill reminder:', error);
      }
    }

    // Sort bills by due date (earliest first)
    setBills(prev => [...prev, newBill].sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ));
  }, [preferences.billReminder]);

  const updateBill = useCallback(async (id: string, updates: UpdateBillPatch) => {
    const billToUpdate = bills.find(b => b.id === id);
    if (!billToUpdate) return;

    // Cancel existing notifications if due date is changing or bill is being marked paid
    if (billToUpdate.reminderNotificationIds?.length && (updates.dueDate || updates.isPaid)) {
      await cancelNotifications(billToUpdate.reminderNotificationIds);
    }

    setBills(prev =>
      prev.map(b => {
        if (b.id !== id) return b;

        // Apply updates and recompute status
        const updated = { ...b, ...updates };
        const newStatus = getBillStatus(updated.dueDate, updated.isPaid);
        return { ...updated, status: newStatus, reminderNotificationIds: undefined };
      })
    );

    // Reschedule notifications if due date changed and bill isn't paid
    const reminderPrefs = preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS;
    if (updates.dueDate && reminderPrefs.enabled && !updates.isPaid && !billToUpdate.isPaid) {
      try {
        const updatedBill = { ...billToUpdate, ...updates, status: getBillStatus(updates.dueDate, billToUpdate.isPaid) };
        const notificationIds = await scheduleBillReminder(updatedBill, reminderPrefs);
        if (notificationIds.length > 0) {
          setBills(prev => prev.map(b => b.id === id ? { ...b, reminderNotificationIds: notificationIds } : b));
        }
      } catch (error) {
        console.warn('Failed to reschedule bill reminder:', error);
      }
    }
  }, [bills, preferences.billReminder]);

  const deleteBill = useCallback(async (id: string) => {
    const billToDelete = bills.find(b => b.id === id);
    
    // Cancel any scheduled notifications for this bill
    if (billToDelete?.reminderNotificationIds?.length) {
      await cancelNotifications(billToDelete.reminderNotificationIds);
    }
    
    setBills(prev => prev.filter(b => b.id !== id));
  }, [bills]);

  const markBillPaid = useCallback(async (id: string) => {
    const billToMark = bills.find(b => b.id === id);
    
    // Cancel any scheduled notifications since bill is now paid
    if (billToMark?.reminderNotificationIds?.length) {
      await cancelNotifications(billToMark.reminderNotificationIds);
    }
    
    setBills(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const updated = { ...b, isPaid: true, reminderNotificationIds: undefined };
        return { ...updated, status: getBillStatus(updated.dueDate, true) };
      })
    );
  }, [bills]);

  // Insight actions
  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  const markInsightRead = useCallback((id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
  }, []);

  // Budget actions
  const getCategorySpending = useCallback((category: BudgetCategory): number => {
    // Get current month's start and end
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

  // Recurring transaction detection
  const recurringTransactionIds = useMemo(() => {
    return getRecurringTransactionIds(transactions);
  }, [transactions]);

  const recurringPatterns = useMemo(() => {
    return detectRecurringPatterns(transactions);
  }, [transactions]);

  // Subscription detection
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

  const addBudget = useCallback((budget: NewBudgetInput) => {
    // Check if budget for this category already exists
    const exists = budgets.some(b => b.category === budget.category);
    if (exists) {
      console.warn(`Budget for category ${budget.category} already exists`);
      return;
    }

    const newBudget: CategoryBudget = {
      ...budget,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentSpent: 0, // Will be computed
    };
    setBudgets(prev => [...prev, newBudget]);
  }, [budgets]);

  const updateBudget = useCallback((id: string, updates: UpdateBudgetPatch) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  // Preference actions
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const updateNotificationPreference = useCallback((
    key: keyof UserPreferences['notifications'], 
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  }, []);

  // Memoize context value
  const value = useMemo(() => ({
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    updateTransaction,
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
    updateBill,
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
    updatePreferences,
    updateNotificationPreference,
    isHydrated,
    persistenceError,
  }), [
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    updateTransaction,
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
    updateBill,
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
    updatePreferences,
    updateNotificationPreference,
    isHydrated,
    persistenceError,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
