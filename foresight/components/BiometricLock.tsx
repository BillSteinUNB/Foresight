import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, typography } from '../theme';
import {
  authenticate,
  checkBiometricCapability,
  getBiometricTypeName,
  BiometricType,
} from '../utils/biometrics';

interface BiometricLockProps {
  /** Whether the lock screen should be shown */
  isLocked: boolean;
  /** Callback when authentication succeeds */
  onUnlock: () => void;
  /** Callback when user wants to skip (if allowed) */
  onSkip?: () => void;
  /** Whether to allow skipping the lock */
  allowSkip?: boolean;
}

const BiometricLock: React.FC<BiometricLockProps> = ({
  isLocked,
  onUnlock,
  onSkip,
  allowSkip = false,
}) => {
  const insets = useSafeAreaInsets();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricTypes, setBiometricTypes] = useState<BiometricType[]>([]);
  const [biometricName, setBiometricName] = useState('Biometrics');

  // Check biometric capability on mount
  useEffect(() => {
    const checkCapability = async () => {
      const capability = await checkBiometricCapability();
      setBiometricTypes(capability.biometricTypes);
      setBiometricName(getBiometricTypeName(capability.biometricTypes));
    };
    checkCapability();
  }, []);

  // Auto-authenticate when lock becomes active
  useEffect(() => {
    if (isLocked && !isAuthenticating) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authenticate({
        promptMessage: 'Unlock Foresight',
        cancelLabel: 'Cancel',
        fallbackToPasscode: true,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      } else if (result.error && result.error !== 'Authentication cancelled') {
        setError(result.error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onUnlock]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSkip();
    }
  }, [onSkip]);

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (biometricTypes.includes('facial')) {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <LinearGradient
          colors={['rgba(0, 217, 165, 0.1)', 'transparent', 'transparent']}
          style={styles.gradient}
        />

        {/* App Logo / Branding */}
        <View style={styles.header}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.logoContainer}
          >
            <LinearGradient
              colors={[colors.mint, colors.blue400]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Ionicons name="wallet" size={40} color={colors.black} />
            </LinearGradient>
          </MotiView>
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
          >
            <Text style={styles.title}>Foresight</Text>
            <Text style={styles.subtitle}>Your finances are protected</Text>
          </MotiView>
        </View>

        {/* Authentication Area */}
        <View style={styles.authArea}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 400 }}
          >
            <TouchableOpacity
              onPress={handleAuthenticate}
              disabled={isAuthenticating}
              style={styles.authButton}
              activeOpacity={0.8}
            >
              <View style={styles.authIconContainer}>
                {isAuthenticating ? (
                  <ActivityIndicator size="large" color={colors.mint} />
                ) : (
                  <MotiView
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      type: 'timing',
                      duration: 2000,
                      loop: true,
                    }}
                  >
                    <Ionicons
                      name={getBiometricIcon()}
                      size={64}
                      color={colors.mint}
                    />
                  </MotiView>
                )}
              </View>

              <Text style={styles.authText}>
                {isAuthenticating ? 'Authenticating...' : `Use ${biometricName}`}
              </Text>
            </TouchableOpacity>
          </MotiView>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -10 }}
                style={styles.errorContainer}
              >
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Retry Button */}
          {error && !isAuthenticating && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 200 }}
            >
              <TouchableOpacity
                onPress={handleAuthenticate}
                style={styles.retryButton}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color={colors.mint} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </View>

        {/* Skip Option (if allowed) */}
        {allowSkip && onSkip && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            style={styles.skipContainer}
          >
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </MotiView>
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[16],
  },
  logoContainer: {
    marginBottom: spacing[6],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral400,
    textAlign: 'center',
  },
  authArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButton: {
    alignItems: 'center',
    padding: spacing[8],
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface200,
    borderWidth: 2,
    borderColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  authText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
    borderRadius: borderRadius.lg,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.danger,
    maxWidth: 280,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.mintMuted,
    borderRadius: borderRadius.full,
  },
  retryText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.mint,
  },
  skipContainer: {
    paddingBottom: spacing[8],
  },
  skipText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral500,
  },
});

export default BiometricLock;
