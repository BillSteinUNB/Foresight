import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CategoryBudget, BudgetCategory } from '../types';
import { zustandStorage, getStorageKey } from './storage';

type NewBudgetInput = Omit<CategoryBudget, 'id' | 'currentSpent'>;
type UpdateBudgetPatch = Partial<Pick<CategoryBudget, 'monthlyLimit' | 'alertThreshold' | 'isActive'>>;

interface BudgetState {
  budgets: CategoryBudget[];
  isHydrated: boolean;
}

interface BudgetActions {
  addBudget: (budget: NewBudgetInput) => void;
  updateBudget: (id: string, updates: UpdateBudgetPatch) => void;
  deleteBudget: (id: string) => void;
  setBudgets: (budgets: CategoryBudget[]) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type BudgetStore = BudgetState & BudgetActions;

const generateId = (): string => {
  return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      // State
      budgets: [],
      isHydrated: false,

      // Actions
      addBudget: (budget) => {
        const { budgets } = get();
        
        // Check if budget for this category already exists
        const exists = budgets.some((b) => b.category === budget.category);
        if (exists) {
          console.warn(`Budget for category ${budget.category} already exists`);
          return;
        }

        const newBudget: CategoryBudget = {
          ...budget,
          id: generateId(),
          currentSpent: 0, // Will be computed from transactions
        };
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      },

      setBudgets: (budgets) => {
        set({ budgets });
      },

      reset: () => {
        set({ budgets: [] });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('budgets'),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        budgets: state.budgets,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors
export const selectActiveBudgets = (state: BudgetStore) =>
  state.budgets.filter((b) => b.isActive);

export const selectBudgetByCategory = (category: BudgetCategory) => (state: BudgetStore) =>
  state.budgets.find((b) => b.category === category);

export const selectBudgetById = (id: string) => (state: BudgetStore) =>
  state.budgets.find((b) => b.id === id);

export const selectOverBudgetCategories = (state: BudgetStore) =>
  state.budgets.filter((b) => b.isActive && b.currentSpent >= b.monthlyLimit);

export const selectNearLimitCategories = (state: BudgetStore) =>
  state.budgets.filter(
    (b) => b.isActive && b.currentSpent >= b.monthlyLimit * b.alertThreshold && b.currentSpent < b.monthlyLimit
  );

export const selectTotalBudgeted = (state: BudgetStore) =>
  state.budgets.filter((b) => b.isActive).reduce((sum, b) => sum + b.monthlyLimit, 0);

export const selectTotalSpentFromBudgets = (state: BudgetStore) =>
  state.budgets.filter((b) => b.isActive).reduce((sum, b) => sum + b.currentSpent, 0);
