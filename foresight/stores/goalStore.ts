import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavingsGoal } from '../types';
import { GOALS } from '../mockData';

interface GoalState {
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  
  // Money operations
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  
  // Computed
  getGoalById: (id: string) => SavingsGoal | undefined;
  getGoalProgress: (id: string) => number;
  getTotalSaved: () => number;
  getTotalTarget: () => number;

  // Utilities
  clearError: () => void;
  resetToDefault: () => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: GOALS,
      isLoading: false,
      error: null,

      addGoal: (goalData) => {
        const newGoal: SavingsGoal = {
          ...goalData,
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
          error: null,
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
          error: null,
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          error: null,
        }));
      },

      depositToGoal: (id, amount) => {
        if (amount <= 0) {
          set({ error: 'Deposit amount must be positive' });
          return;
        }
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
              : g
          ),
          error: null,
        }));
      },

      withdrawFromGoal: (id, amount) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal) {
          set({ error: 'Goal not found' });
          return;
        }
        if (amount <= 0) {
          set({ error: 'Withdrawal amount must be positive' });
          return;
        }
        if (amount > goal.currentAmount) {
          set({ error: 'Insufficient funds in goal' });
          return;
        }
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount - amount }
              : g
          ),
          error: null,
        }));
      },

      getGoalById: (id) => {
        return get().goals.find((g) => g.id === id);
      },

      getGoalProgress: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal || goal.targetAmount === 0) return 0;
        return (goal.currentAmount / goal.targetAmount) * 100;
      },

      getTotalSaved: () => {
        return get().goals.reduce((sum, g) => sum + g.currentAmount, 0);
      },

      getTotalTarget: () => {
        return get().goals.reduce((sum, g) => sum + g.targetAmount, 0);
      },

      clearError: () => set({ error: null }),
      
      resetToDefault: () => set({ goals: GOALS, error: null }),
    }),
    {
      name: 'foresight-goals',
      version: 1,
    }
  )
);

