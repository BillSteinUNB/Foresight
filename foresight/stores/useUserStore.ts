import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserPreferences, NotificationSettings, BillReminderPreferences } from '../types';
import { getStorageKey } from './storage';
import { encryptedStorage } from './encryptedStorage';
import { DEFAULT_BILL_REMINDER_PREFS } from '../utils/notifications';

// Default user state for new users (empty/production defaults)
const DEFAULT_USER: User = {
  name: '',
  safeToSpend: 0,
  balance: 0,
  financialHealthScore: 0,
  currency: 'USD',
  netWorth: 0,
  memberSince: new Date().getFullYear(),
};

// Default preferences for new users
const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'USD',
  locale: 'en-US',
  notifications: {
    pushEnabled: true,
    emailEnabled: false,
    billReminders: true,
    spendingAlerts: true,
    weeklyDigest: false,
    insightAlerts: true,
  },
  privacyMode: false,
  biometricEnabled: false,
  theme: 'dark',
  aiInsightsEnabled: true,
};

interface UserState {
  user: User;
  preferences: UserPreferences;
  isHydrated: boolean;
}

interface UserActions {
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotificationPreference: (key: keyof NotificationSettings, value: boolean) => void;
  updateBillReminderPrefs: (updates: Partial<BillReminderPreferences>) => void;
  toggleBiometric: (enabled: boolean) => void;
  togglePrivacyMode: (enabled: boolean) => void;
  setTheme: (theme: UserPreferences['theme']) => void;
  loadDemoData: () => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State - initialize with production defaults for new users
      user: { ...DEFAULT_USER },
      preferences: { ...DEFAULT_PREFERENCES },
      isHydrated: false,

      // Actions
      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      updateNotificationPreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: {
              ...state.preferences.notifications,
              [key]: value,
            },
          },
        }));
      },

      updateBillReminderPrefs: (updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            billReminder: {
              ...(state.preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS),
              ...updates,
            },
          },
        }));
      },

      toggleBiometric: (enabled) => {
        set((state) => ({
          preferences: { ...state.preferences, biometricEnabled: enabled },
        }));
      },

      togglePrivacyMode: (enabled) => {
        set((state) => ({
          preferences: { ...state.preferences, privacyMode: enabled },
        }));
      },

      setTheme: (theme) => {
        set((state) => ({
          preferences: { ...state.preferences, theme },
        }));
      },

      loadDemoData: () => {
        // Dynamically import mock data only when needed for demo mode
        import('../mockData').then(({ USER, USER_PREFERENCES }) => {
          set({
            user: { ...USER },
            preferences: { ...USER_PREFERENCES },
          });
        });
      },

      reset: () => {
        set({
          user: { ...DEFAULT_USER },
          preferences: { ...DEFAULT_PREFERENCES },
        });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('user'),
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors
export const selectUser = (state: UserStore) => state.user;

export const selectPreferences = (state: UserStore) => state.preferences;

export const selectNotificationSettings = (state: UserStore) =>
  state.preferences.notifications;

export const selectBillReminderPrefs = (state: UserStore) =>
  state.preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS;

export const selectIsBiometricEnabled = (state: UserStore) =>
  state.preferences.biometricEnabled;

export const selectIsPrivacyMode = (state: UserStore) =>
  state.preferences.privacyMode;

export const selectTheme = (state: UserStore) =>
  state.preferences.theme;

export const selectCurrency = (state: UserStore) =>
  state.preferences.currency;

export const selectLocale = (state: UserStore) =>
  state.preferences.locale;
