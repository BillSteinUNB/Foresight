import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './context/AppContext';
import TabNavigator from './navigation/TabNavigator';
import AddTransaction from './components/AddTransaction';
import { Transaction } from './types';
import { colors } from './theme';

const AppContent: React.FC = () => {
  const { addTransaction } = useApp();
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
        }}
      >
        <TabNavigator onAddPress={handleOpenModal} />
      </NavigationContainer>

      <AddTransaction
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddTransaction}
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
});

export default App;
