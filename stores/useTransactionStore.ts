import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, TransactionUpdate } from '../types';
import { zustandStorage, getStorageKey } from './storage';

interface TransactionState {
  transactions: Transaction[];
  isHydrated: boolean;
}

interface TransactionActions {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  updateTransaction: (id: string, updates: TransactionUpdate) => void;
  updateTransactionsCategory: (ids: string[], category: Transaction['category']) => void;
  setTransactions: (transactions: Transaction[]) => void;
  loadDemoData: () => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type TransactionStore = TransactionState & TransactionActions;

const generateId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      // State - initialize with empty array for new users
      transactions: [],
      isHydrated: false,

      // Actions
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      deleteTransactions: (ids) => {
        const idsSet = new Set(ids);
        set((state) => ({
          transactions: state.transactions.filter((t) => !idsSet.has(t.id)),
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, id: t.id } : t
          ),
        }));
      },

      updateTransactionsCategory: (ids, category) => {
        const idsSet = new Set(ids);
        set((state) => ({
          transactions: state.transactions.map((t) =>
            idsSet.has(t.id) ? { ...t, category } : t
          ),
        }));
      },

      setTransactions: (transactions) => {
        set({ transactions });
      },

      loadDemoData: () => {
        // Dynamically import mock data only when needed for demo mode
        import('../mockData').then(({ TRANSACTIONS }) => {
          set({ transactions: [...TRANSACTIONS] });
        });
      },

      reset: () => {
        set({ transactions: [] });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('transactions'),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        transactions: state.transactions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors for computed values
export const selectTransactionsByType = (type: 'income' | 'expense') => (state: TransactionStore) =>
  state.transactions.filter((t) => t.type === type);

export const selectTransactionsByCategory = (category: string) => (state: TransactionStore) =>
  state.transactions.filter((t) => t.category === category);

export const selectTransactionsByDateRange = (startDate: Date, endDate: Date) => (state: TransactionStore) =>
  state.transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate;
  });

export const selectTotalIncome = (state: TransactionStore) =>
  state.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

export const selectTotalExpenses = (state: TransactionStore) =>
  state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

export const selectCurrentMonthSpending = (category?: string) => (state: TransactionStore) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return state.transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      const inRange = txDate >= startOfMonth && txDate <= endOfMonth;
      const isExpense = t.type === 'expense';
      const matchesCategory = category ? t.category === category : true;
      return inRange && isExpense && matchesCategory;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};
