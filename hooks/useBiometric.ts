import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { canUseBiometrics, authenticate, checkBiometricCapability, getBiometricTypeName } from '../utils/biometrics';

interface UseBiometricOptions {
  biometricEnabled: boolean;
  onBiometricUpdate: (enabled: boolean) => void;
}

interface UseBiometricReturn {
  biometricAvailable: boolean;
  biometricName: string;
  handleBiometricToggle: () => Promise<void>;
  checkBiometrics: () => Promise<void>;
}

export const useBiometric = (options: UseBiometricOptions): UseBiometricReturn => {
  const { biometricEnabled, onBiometricUpdate } = options;
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');

  // Check biometric availability on mount
  const checkBiometrics = useCallback(async () => {
    const capability = await checkBiometricCapability();
    setBiometricAvailable(capability.isAvailable && capability.isEnrolled);
    setBiometricName(getBiometricTypeName(capability.biometricTypes));
  }, []);

  const handleBiometricToggle = useCallback(async () => {
    // If trying to enable biometrics
    if (!biometricEnabled) {
      // First check if available
      const isAvailable = await canUseBiometrics();
      if (!isAvailable) {
        Alert.alert(
          'Biometrics Unavailable',
          'Please set up Face ID or Touch ID in your device settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Verify with biometric before enabling
      const result = await authenticate({
        promptMessage: `Enable ${biometricName} for Foresight`,
      });

      if (result.success) {
        onBiometricUpdate(true);
      } else if (result.error && result.error !== 'Authentication cancelled') {
        Alert.alert('Authentication Failed', result.error);
      }
    } else {
      // Disabling - confirm with biometric first
      const result = await authenticate({
        promptMessage: `Disable ${biometricName} for Foresight`,
      });

      if (result.success) {
        onBiometricUpdate(false);
      } else if (result.error && result.error !== 'Authentication cancelled') {
        Alert.alert('Authentication Failed', result.error);
      }
    }
  }, [biometricEnabled, biometricName, onBiometricUpdate]);

  return {
    biometricAvailable,
    biometricName,
    handleBiometricToggle,
    checkBiometrics,
  };
};
