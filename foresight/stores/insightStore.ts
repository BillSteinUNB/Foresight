import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Insight } from '../types';
import { INSIGHTS } from '../mockData';

interface InsightState {
  insights: Insight[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addInsight: (insight: Omit<Insight, 'id'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissInsight: (id: string) => void;
  
  // Computed
  getUnreadInsights: () => Insight[];
  getUnreadCount: () => number;
  getInsightsByType: (type: Insight['type']) => Insight[];

  // Utilities
  clearError: () => void;
  resetToDefault: () => void;
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set, get) => ({
      insights: INSIGHTS,
      isLoading: false,
      error: null,

      addInsight: (insightData) => {
        const newInsight: Insight = {
          ...insightData,
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          insights: [newInsight, ...state.insights],
          error: null,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, isRead: true } : i
          ),
          error: null,
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          insights: state.insights.map((i) => ({ ...i, isRead: true })),
          error: null,
        }));
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.filter((i) => i.id !== id),
          error: null,
        }));
      },

      getUnreadInsights: () => {
        return get().insights.filter((i) => !i.isRead);
      },

      getUnreadCount: () => {
        return get().insights.filter((i) => !i.isRead).length;
      },

      getInsightsByType: (type) => {
        return get().insights.filter((i) => i.type === type);
      },

      clearError: () => set({ error: null }),
      
      resetToDefault: () => set({ insights: INSIGHTS, error: null }),
    }),
    {
      name: 'foresight-insights',
      version: 1,
    }
  )
);

