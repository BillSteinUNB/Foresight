import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider, useApp } from './context/AppContext';
import TabNavigator from './navigation/TabNavigator';
import AddTransaction from './components/AddTransaction';
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

const AppContent: React.FC = () => {
  const { addTransaction, updateTransaction, isHydrated, preferences } = useApp();
  const { session, isInitialized: authInitialized, initialize: initializeAuth } = useAuthStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

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

  // Lock app when it goes to background (if biometric is enabled)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && preferences.biometricEnabled && biometricAvailable) {
        setIsLocked(true);
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
    setIsAddModalOpen(false);
  }, [addTransaction]);

  const handleOpenModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsAddModalOpen(false), []);

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
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.mint,
            background: colors.black,
            card: colors.surface200,
            text: colors.white,
            border: colors.surface300,
            notification: colors.danger,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' as const },
            medium: { fontFamily: 'System', fontWeight: '500' as const },
            bold: { fontFamily: 'System', fontWeight: '700' as const },
            heavy: { fontFamily: 'System', fontWeight: '900' as const },
          },
        }}
      >
        <TabNavigator onAddPress={handleOpenModal} />
      </NavigationContainer>

      <AddTransaction
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
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
    </View>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ErrorBoundary name="Root">
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
});

export default App;
