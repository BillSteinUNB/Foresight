import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SavingsGoal } from '../types';
import { GOALS as INITIAL_GOALS } from '../mockData';
import { zustandStorage, getStorageKey } from './storage';

interface GoalState {
  goals: SavingsGoal[];
  isHydrated: boolean;
}

interface GoalActions {
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  setGoals: (goals: SavingsGoal[]) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type GoalStore = GoalState & GoalActions;

const generateId = (): string => {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      // State
      goals: [...INITIAL_GOALS],
      isHydrated: false,

      // Actions
      addGoal: (goal) => {
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      depositToGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
              : g
          ),
        }));
      },

      withdrawFromGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: Math.max(g.currentAmount - amount, 0) }
              : g
          ),
        }));
      },

      setGoals: (goals) => {
        set({ goals });
      },

      reset: () => {
        set({ goals: [...INITIAL_GOALS] });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('goals'),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        goals: state.goals,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors
export const selectTotalSaved = (state: GoalStore) =>
  state.goals.reduce((sum, g) => sum + g.currentAmount, 0);

export const selectTotalTarget = (state: GoalStore) =>
  state.goals.reduce((sum, g) => sum + g.targetAmount, 0);

export const selectOverallProgress = (state: GoalStore) => {
  const total = state.goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const saved = state.goals.reduce((sum, g) => sum + g.currentAmount, 0);
  return total > 0 ? saved / total : 0;
};

export const selectGoalById = (id: string) => (state: GoalStore) =>
  state.goals.find((g) => g.id === id);

export const selectCompletedGoals = (state: GoalStore) =>
  state.goals.filter((g) => g.currentAmount >= g.targetAmount);

export const selectActiveGoals = (state: GoalStore) =>
  state.goals.filter((g) => g.currentAmount < g.targetAmount);
