import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, BudgetCategory } from '../types';
import { TRANSACTIONS } from '../mockData';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  
  // Computed/Filters
  getTransactionsByType: (type: 'expense' | 'income') => Transaction[];
  getTransactionsByCategory: (category: BudgetCategory) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTotalByType: (type: 'expense' | 'income') => number;
  getRecentTransactions: (count: number) => Transaction[];
  
  // Utilities
  clearError: () => void;
  resetToDefault: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: TRANSACTIONS,
      isLoading: false,
      error: null,

      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
          error: null,
        }));
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
          error: null,
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
          error: null,
        }));
      },

      getTransactionById: (id) => {
        return get().transactions.find((t) => t.id === id);
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((t) => t.type === type);
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter((t) => t.category === category);
      },

      getTransactionsByDateRange: (startDate, endDate) => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return get().transactions.filter((t) => {
          const txDate = new Date(t.date).getTime();
          return txDate >= start && txDate <= end;
        });
      },

      getTotalByType: (type) => {
        return get()
          .transactions.filter((t) => t.type === type)
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getRecentTransactions: (count) => {
        return [...get().transactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, count);
      },

      clearError: () => set({ error: null }),
      
      resetToDefault: () => set({ transactions: TRANSACTIONS, error: null }),
    }),
    {
      name: 'foresight-transactions',
      version: 1,
    }
  )
);

