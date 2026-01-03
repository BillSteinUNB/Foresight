import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { SUPPORTED_CURRENCIES, Currency, getCurrencyInfo } from '../utils/currency';

interface UseCurrencyOptions {
  currentCurrency: string;
  onCurrencyUpdate: (currency: string) => void;
}

interface UseCurrencyReturn {
  currencies: Currency[];
  currentCurrencyInfo: Currency;
  showCurrencyModal: boolean;
  setShowCurrencyModal: (show: boolean) => void;
  handleCurrencySelect: (currencyCode: string) => void;
}

export const useCurrency = (options: UseCurrencyOptions): UseCurrencyReturn => {
  const { currentCurrency, onCurrencyUpdate } = options;
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const currencies = SUPPORTED_CURRENCIES;
  const currentCurrencyInfo = getCurrencyInfo(currentCurrency);

  const handleCurrencySelect = useCallback(
    (currencyCode: string) => {
      onCurrencyUpdate(currencyCode);
      setShowCurrencyModal(false);
    },
    [onCurrencyUpdate]
  );

  return {
    currencies,
    currentCurrencyInfo,
    showCurrencyModal,
    setShowCurrencyModal,
    handleCurrencySelect,
  };
};

// Hook for net worth management
interface UseNetWorthOptions {
  currentNetWorth: number;
  onNetWorthUpdate: (amount: number) => void;
}

interface UseNetWorthReturn {
  netWorthInput: string;
  setNetWorthInput: (value: string) => void;
  showNetWorthModal: boolean;
  setShowNetWorthModal: (show: boolean) => void;
  handleSaveNetWorth: () => void;
  openNetWorthModal: () => void;
}

export const useNetWorth = (options: UseNetWorthOptions): UseNetWorthReturn => {
  const { currentNetWorth, onNetWorthUpdate } = options;
  const [netWorthInput, setNetWorthInput] = useState('');
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);

  const handleSaveNetWorth = useCallback(() => {
    const amount = parseFloat(netWorthInput.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number.');
      return;
    }
    onNetWorthUpdate(amount);
    setShowNetWorthModal(false);
  }, [netWorthInput, onNetWorthUpdate]);

  const openNetWorthModal = useCallback(() => {
    setNetWorthInput(currentNetWorth.toString());
    setShowNetWorthModal(true);
  }, [currentNetWorth]);

  return {
    netWorthInput,
    setNetWorthInput,
    showNetWorthModal,
    setShowNetWorthModal,
    handleSaveNetWorth,
    openNetWorthModal,
  };
};
