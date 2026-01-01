import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Biometric authentication utility functions
 * Provides a clean API for Face ID, Touch ID, and Fingerprint authentication
 */

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapability {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricTypes: BiometricType[];
  securityLevel: LocalAuthentication.SecurityLevel;
}

/**
 * Check if biometric authentication is available on this device
 */
export const checkBiometricCapability = async (): Promise<BiometricCapability> => {
  try {
    // Check if hardware supports biometrics
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    
    if (!isAvailable) {
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricTypes: [],
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
      };
    }

    // Check if user has enrolled biometrics
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    // Get supported authentication types
    const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricTypes: BiometricType[] = authTypes.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'facial';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'none';
      }
    }).filter(t => t !== 'none');

    // Get security level
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    return {
      isAvailable: true,
      isEnrolled,
      biometricTypes,
      securityLevel,
    };
  } catch (error) {
    console.error('Error checking biometric capability:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometricTypes: [],
      securityLevel: LocalAuthentication.SecurityLevel.NONE,
    };
  }
};

/**
 * Get a friendly name for the biometric type available
 */
export const getBiometricTypeName = (types: BiometricType[]): string => {
  if (types.includes('facial')) {
    return 'Face ID';
  }
  if (types.includes('fingerprint')) {
    return 'Touch ID';
  }
  if (types.includes('iris')) {
    return 'Iris Scan';
  }
  return 'Biometrics';
};

export interface AuthenticateResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export interface AuthenticateOptions {
  /** Message shown to user during authentication */
  promptMessage?: string;
  /** Text for cancel button (iOS only) */
  cancelLabel?: string;
  /** Allow device passcode as fallback */
  fallbackToPasscode?: boolean;
  /** Disable fallback to device credentials (Android) */
  disableDeviceCredentialsFallback?: boolean;
}

/**
 * Authenticate user with biometrics
 */
export const authenticate = async (
  options: AuthenticateOptions = {}
): Promise<AuthenticateResult> => {
  const {
    promptMessage = 'Authenticate to access Foresight',
    cancelLabel = 'Cancel',
    fallbackToPasscode = true,
    disableDeviceCredentialsFallback = false,
  } = options;

  try {
    // First check capability
    const capability = await checkBiometricCapability();

    if (!capability.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    if (!capability.isEnrolled) {
      return {
        success: false,
        error: 'No biometrics enrolled. Please set up Face ID or Touch ID in your device settings.',
      };
    }

    // Attempt authentication
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      fallbackLabel: fallbackToPasscode ? 'Use Passcode' : undefined,
      disableDeviceFallback: disableDeviceCredentialsFallback,
    });

    if (result.success) {
      return { success: true };
    }

    // Handle various error cases
    if (result.error === 'user_cancel') {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }

    if (result.error === 'user_fallback') {
      // User chose to use passcode instead
      return {
        success: false,
        warning: 'User chose passcode fallback',
      };
    }

    if (result.error === 'lockout') {
      return {
        success: false,
        error: 'Too many failed attempts. Please try again later.',
      };
    }

    if (result.error === 'not_enrolled') {
      return {
        success: false,
        error: 'No biometrics enrolled on this device',
      };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
};

/**
 * Quick check if biometrics can be used (available + enrolled)
 */
export const canUseBiometrics = async (): Promise<boolean> => {
  const capability = await checkBiometricCapability();
  return capability.isAvailable && capability.isEnrolled;
};
