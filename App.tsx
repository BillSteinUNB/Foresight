import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, AppState, AppStateStatus, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider, useApp } from './context/AppContext';
import TabNavigator from './navigation/TabNavigator';
import AddTransaction from './components/AddTransaction';
import SimpleTransactionModal from './components/SimpleTransactionModal';
import BiometricLock from './components/BiometricLock';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import { useAuthStore } from './stores/useAuthStore';
import { syncService } from './lib/syncService';
import { initSentry } from './lib/sentry';
import { Transaction } from './types';
import { colors, spacing, typography } from './theme';
import { canUseBiometrics } from './utils/biometrics';
import { cleanupLegacyStorage } from './utils/persistence';
import { scheduleBillReminder, DEFAULT_BILL_REMINDER_PREFS } from './utils/notifications';
import { useBillStore } from './stores/useBillStore';

// Prevent splash from auto-hiding so we control when it disappears
SplashScreen.preventAutoHideAsync();

// Initialize Sentry for crash reporting
initSentry();

// Clean up legacy storage keys from previous app versions
cleanupLegacyStorage().then((result) => {
  if (result.cleaned > 0) {
    console.log(`Cleaned up ${result.cleaned} legacy storage keys`);
  }
});

// Light theme colors for system theming
const lightThemeColors = {
  primary: colors.mint,
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  border: '#E5E5E5',
  notification: colors.danger,
};

// Dark theme colors for system theming
const darkThemeColors = {
  primary: colors.mint,
  background: colors.black,
  card: colors.surface200,
  text: colors.white,
  border: colors.surface300,
  notification: colors.danger,
};

// Function to create navigation theme based on color scheme
const createNavigationTheme = (colorScheme: 'light' | 'dark'): Theme => ({
  dark: colorScheme === 'dark',
  colors: colorScheme === 'dark' ? darkThemeColors : lightThemeColors,
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
});

const AppContent: React.FC = () => {
  const colorScheme = useColorScheme() || 'dark';
  const navigationTheme = useMemo(() => createNavigationTheme(colorScheme), [colorScheme]);

  const { addTransaction, updateTransaction, isHydrated, preferences } = useApp();
  const { session, isInitialized: authInitialized, initialize: initializeAuth } = useAuthStore();
  const bills = useBillStore((state) => state.bills);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Hide splash screen when app is ready (all stores + auth initialized)
  useEffect(() => {
    const hideSplash = async () => {
      if (isHydrated && authInitialized) {
        // Small delay to ensure smooth transition
        await SplashScreen.hideAsync();
      }
    };
    hideSplash();
  }, [isHydrated, authInitialized]);

  // Sync data from cloud after successful login
  useEffect(() => {
    const syncFromCloud = async () => {
      if (session?.user?.id && isHydrated && !hasSynced) {
        console.log('Syncing data from cloud...');
        const result = await syncService.pullAll(session.user.id);
        if (result.success) {
          console.log('Cloud sync completed');
        } else {
          console.warn('Cloud sync failed:', result.error);
        }
        setHasSynced(true);
      }
    };

    syncFromCloud();
  }, [session, isHydrated, hasSynced]);

  // Re-schedule bill reminders after store hydration
  // This fixes the bug where reminders disappear after app restart
  useEffect(() => {
    const hydrateReminders = async () => {
      if (!isHydrated) return;

      // Get the user's reminder preferences or use defaults
      const reminderPrefs = preferences.billReminder || DEFAULT_BILL_REMINDER_PREFS;
      
      if (!reminderPrefs.enabled) {
        return;
      }

      // Get all unpaid bills that don't have scheduled reminders
      const unpaidBills = bills.filter((bill) => !bill.isPaid);
      
      let reScheduledCount = 0;
      
      for (const bill of unpaidBills) {
        // Only re-schedule if the bill doesn't already have notification IDs
        // or if the existing notifications are in the past
        const needsReschedule = !bill.reminderNotificationIds?.length;
        
        if (needsReschedule) {
          try {
            const notificationIds = await scheduleBillReminder(bill, reminderPrefs);
            if (notificationIds.length > 0) {
              // Update the bill store with the new notification IDs
              // Note: We need to use the store directly since we're outside the component
              useBillStore.setState((state) => ({
                bills: state.bills.map((b) =>
                  b.id === bill.id
                    ? { ...b, reminderNotificationIds: notificationIds }
                    : b
                ),
              }));
              reScheduledCount++;
            }
          } catch (error) {
            console.warn(`Failed to re-schedule reminder for bill ${bill.id}:`, error);
          }
        }
      }

      if (reScheduledCount > 0) {
        console.log(`Re-scheduled ${reScheduledCount} bill reminders after hydration`);
      }
    };

    hydrateReminders();
  }, [isHydrated, bills, preferences.billReminder]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!session) {
      setHasSynced(false);
    }
  }, [session]);

  // Check if biometrics are available and enabled
  useEffect(() => {
    const checkBiometrics = async () => {
      if (preferences.biometricEnabled) {
        const available = await canUseBiometrics();
        setBiometricAvailable(available);
        // If biometrics enabled and available, show lock screen
        setIsLocked(available);
      } else {
        // Biometrics disabled, skip lock
        setIsLocked(false);
        setBiometricAvailable(false);
      }
    };

    if (isHydrated) {
      checkBiometrics();
    }
  }, [isHydrated, preferences.biometricEnabled]);

  // Lock app and show privacy overlay when it goes to background/inactive (prevents screenshot leakage)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Show privacy overlay when app goes to inactive (app switcher, etc.)
      if (nextAppState === 'inactive') {
        setShowPrivacyOverlay(true);
      }
      // Hide privacy overlay and lock app when app goes to background
      if (nextAppState === 'background') {
        setShowPrivacyOverlay(false);
        if (preferences.biometricEnabled && biometricAvailable) {
          setIsLocked(true);
        }
      }
      // Hide privacy overlay when app becomes active again
      if (nextAppState === 'active') {
        setShowPrivacyOverlay(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [preferences.biometricEnabled, biometricAvailable]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const handleAddTransaction = useCallback((newTx: Partial<Transaction>) => {
    addTransaction({
      amount: newTx.amount || 0,
      type: newTx.type || 'expense',
      date: newTx.date || new Date().toISOString(),
      merchantName: newTx.merchantName || 'Unknown',
      category: newTx.category || 'other',
      merchantLogo: newTx.merchantLogo,
      status: newTx.status,
    });
  }, [addTransaction]);

  const handleOpenModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsAddModalOpen(false), []);
  const handleOpenSimpleModal = useCallback(() => setIsSimpleModalOpen(true), []);
  const handleCloseSimpleModal = useCallback(() => setIsSimpleModalOpen(false), []);

  // Show loading screen while hydrating from persistence
  if (!isHydrated || !authInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.loadingText}>Loading Foresight...</Text>
      </View>
    );
  }

  // Show auth screen if not logged in
  if (!session) {
    return <AuthScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <TabNavigator onAddPress={handleOpenSimpleModal} />
      </NavigationContainer>

      <AddTransaction
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddTransaction}
        onUpdate={updateTransaction}
      />

      <SimpleTransactionModal
        visible={isSimpleModalOpen}
        onClose={handleCloseSimpleModal}
        onAdd={handleAddTransaction}
        onUpdate={updateTransaction}
      />

      {/* Biometric Lock Screen */}
      {preferences.biometricEnabled && biometricAvailable && (
        <BiometricLock
          isLocked={isLocked}
          onUnlock={handleUnlock}
        />
      )}

      {/* Privacy Overlay - prevents sensitive data from appearing in app switcher screenshots */}
      {showPrivacyOverlay && (
        <View style={styles.privacyOverlay}>
          <View style={styles.privacyContent}>
            <Text style={styles.privacyText}>Foresight</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const App: React.FC = () => {
  // Handler to reset navigation to home when error boundary is triggered
  const handleGoHome = useCallback(() => {
    // The actual navigation reset would be handled by the navigation state
    // being reinitialized when the error boundary resets
    console.log('Go Home triggered from ErrorBoundary');
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary name="Root" onGoHome={handleGoHome}>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSizes.base,
    color: colors.neutral400,
  },
  privacyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface100,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default App;
