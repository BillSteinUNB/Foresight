import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Transaction, SavingsGoal, Bill, Insight, User, UserPreferences } from '../types';
import { 
  TRANSACTIONS as INITIAL_TRANSACTIONS, 
  GOALS as INITIAL_GOALS, 
  BILLS as INITIAL_BILLS,
  INSIGHTS as INITIAL_INSIGHTS,
  USER as INITIAL_USER,
  USER_PREFERENCES as INITIAL_PREFERENCES
} from '../mockData';

interface AppContextType {
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  // Goals
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  
  // Bills
  bills: Bill[];
  markBillPaid: (id: string) => void;
  
  // Insights
  insights: Insight[];
  dismissInsight: (id: string) => void;
  markInsightRead: (id: string) => void;
  
  // User
  user: User;
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationPreference: (key: keyof UserPreferences['notifications'], value: boolean) => void;
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
  const [user] = useState<User>(INITIAL_USER);
  const [preferences, setPreferences] = useState<UserPreferences>({...INITIAL_PREFERENCES});

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
  const markBillPaid = useCallback((id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: true } : b));
  }, []);

  // Insight actions
  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  }, []);

  const markInsightRead = useCallback((id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
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
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    bills,
    markBillPaid,
    insights,
    dismissInsight,
    markInsightRead,
    user,
    preferences,
    updatePreferences,
    updateNotificationPreference,
  }), [
    transactions,
    addTransaction,
    deleteTransaction,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    bills,
    markBillPaid,
    insights,
    dismissInsight,
    markInsightRead,
    user,
    preferences,
    updatePreferences,
    updateNotificationPreference,
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
