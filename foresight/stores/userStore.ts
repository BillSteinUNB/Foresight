import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserPreferences, LinkedAccount } from '../types';
import { USER, USER_PREFERENCES, LINKED_ACCOUNTS } from '../mockData';

interface UserState {
  user: User;
  preferences: UserPreferences;
  linkedAccounts: LinkedAccount[];
  isLoading: boolean;
  error: string | null;

  // User actions
  updateUser: (updates: Partial<User>) => void;
  
  // Preferences actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  toggleNotification: (key: keyof UserPreferences['notifications']) => void;
  setTheme: (theme: UserPreferences['theme']) => void;
  toggleAiInsights: () => void;
  togglePrivacyMode: () => void;
  toggleBiometric: () => void;

  // Linked accounts
  addLinkedAccount: (account: Omit<LinkedAccount, 'id'>) => void;
  removeLinkedAccount: (id: string) => void;
  updateLinkedAccount: (id: string, updates: Partial<LinkedAccount>) => void;
  
  // Computed
  getTotalBalance: () => number;
  getAccountById: (id: string) => LinkedAccount | undefined;
  
  // Financial calculations
  calculateSafeToSpend: (totalBillsDue: number) => number;
  updateFinancialHealth: (transactions: { type: 'expense' | 'income'; amount: number }[]) => void;

  // Utilities
  clearError: () => void;
  resetToDefault: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: USER,
      preferences: USER_PREFERENCES,
      linkedAccounts: LINKED_ACCOUNTS,
      isLoading: false,
      error: null,

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
          error: null,
        }));
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
          error: null,
        }));
      },

      toggleNotification: (key) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: {
              ...state.preferences.notifications,
              [key]: !state.preferences.notifications[key],
            },
          },
          error: null,
        }));
      },

      setTheme: (theme) => {
        set((state) => ({
          preferences: { ...state.preferences, theme },
          error: null,
        }));
      },

      toggleAiInsights: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            aiInsightsEnabled: !state.preferences.aiInsightsEnabled,
          },
          error: null,
        }));
      },

      togglePrivacyMode: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            privacyMode: !state.preferences.privacyMode,
          },
          error: null,
        }));
      },

      toggleBiometric: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            biometricEnabled: !state.preferences.biometricEnabled,
          },
          error: null,
        }));
      },

      addLinkedAccount: (accountData) => {
        const newAccount: LinkedAccount = {
          ...accountData,
          id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          linkedAccounts: [...state.linkedAccounts, newAccount],
          error: null,
        }));
      },

      removeLinkedAccount: (id) => {
        set((state) => ({
          linkedAccounts: state.linkedAccounts.filter((a) => a.id !== id),
          error: null,
        }));
      },

      updateLinkedAccount: (id, updates) => {
        set((state) => ({
          linkedAccounts: state.linkedAccounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
          error: null,
        }));
      },

      getTotalBalance: () => {
        return get().linkedAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      },

      getAccountById: (id) => {
        return get().linkedAccounts.find((a) => a.id === id);
      },

      calculateSafeToSpend: (totalBillsDue) => {
        const totalBalance = get().getTotalBalance();
        const safeToSpend = Math.max(0, totalBalance - totalBillsDue);
        set((state) => ({
          user: { ...state.user, safeToSpend },
        }));
        return safeToSpend;
      },

      updateFinancialHealth: (transactions) => {
        // Simple financial health calculation
        // In a real app, this would be more sophisticated
        const totalIncome = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Basic score: 100 if saving 30%+, scales down from there
        let score = 50; // Base score
        if (totalIncome > 0) {
          const savingsRate = (totalIncome - totalExpenses) / totalIncome;
          if (savingsRate >= 0.3) score = 100;
          else if (savingsRate >= 0.2) score = 85;
          else if (savingsRate >= 0.1) score = 70;
          else if (savingsRate >= 0) score = 55;
          else score = Math.max(20, 50 + savingsRate * 100);
        }
        
        set((state) => ({
          user: { ...state.user, financialHealthScore: Math.round(score) },
        }));
      },

      clearError: () => set({ error: null }),
      
      resetToDefault: () =>
        set({
          user: USER,
          preferences: USER_PREFERENCES,
          linkedAccounts: LINKED_ACCOUNTS,
          error: null,
        }),
    }),
    {
      name: 'foresight-user',
      version: 1,
    }
  )
);

