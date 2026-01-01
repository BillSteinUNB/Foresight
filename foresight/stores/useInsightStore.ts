import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Insight } from '../types';
import { INSIGHTS as INITIAL_INSIGHTS } from '../mockData';
import { zustandStorage, getStorageKey } from './storage';

interface InsightState {
  insights: Insight[];
  isHydrated: boolean;
}

interface InsightActions {
  addInsight: (insight: Omit<Insight, 'id'>) => void;
  dismissInsight: (id: string) => void;
  markInsightRead: (id: string) => void;
  markAllRead: () => void;
  clearAllInsights: () => void;
  setInsights: (insights: Insight[]) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type InsightStore = InsightState & InsightActions;

const generateId = (): string => {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useInsightStore = create<InsightStore>()(
  persist(
    (set, get) => ({
      // State
      insights: [...INITIAL_INSIGHTS],
      isHydrated: false,

      // Actions
      addInsight: (insight) => {
        const newInsight: Insight = {
          ...insight,
          id: generateId(),
          isRead: false,
        };
        set((state) => ({
          insights: [newInsight, ...state.insights],
        }));
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.filter((i) => i.id !== id),
        }));
      },

      markInsightRead: (id) => {
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, isRead: true } : i
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          insights: state.insights.map((i) => ({ ...i, isRead: true })),
        }));
      },

      clearAllInsights: () => {
        set({ insights: [] });
      },

      setInsights: (insights) => {
        set({ insights });
      },

      reset: () => {
        set({ insights: [...INITIAL_INSIGHTS] });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('insights'),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        insights: state.insights,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors
export const selectUnreadInsights = (state: InsightStore) =>
  state.insights.filter((i) => !i.isRead);

export const selectUnreadCount = (state: InsightStore) =>
  state.insights.filter((i) => !i.isRead).length;

export const selectInsightsByType = (type: Insight['type']) => (state: InsightStore) =>
  state.insights.filter((i) => i.type === type);

export const selectInsightById = (id: string) => (state: InsightStore) =>
  state.insights.find((i) => i.id === id);

export const selectAlertInsights = (state: InsightStore) =>
  state.insights.filter((i) => i.type === 'alert');

export const selectPositiveInsights = (state: InsightStore) =>
  state.insights.filter((i) => i.type === 'positive');
