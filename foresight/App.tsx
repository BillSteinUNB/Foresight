import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './context/AppContext';
import TabNavigator from './navigation/TabNavigator';
import AddTransaction from './components/AddTransaction';
import { Transaction } from './types';
import { colors, spacing, typography } from './theme';

const AppContent: React.FC = () => {
  const { addTransaction, updateTransaction, isHydrated } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mint} />
        <Text style={styles.loadingText}>Loading Foresight...</Text>
      </View>
    );
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
    </View>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
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
