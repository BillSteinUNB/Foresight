import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/useAuthStore';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore();

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setSuccessMessage(null);
  }, [isSignUp, clearError]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    clearError();
    setSuccessMessage(null);

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (!error) {
        setSuccessMessage('Account created! Please check your email to confirm your account.');
        // Optionally switch to sign in or just show success
      }
    } else {
      await signIn(email, password);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address first');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const { error } = await resetPassword(email);
    if (!error) {
      setSuccessMessage('Password reset email sent. Please check your inbox.');
    } else {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet-outline" size={40} color={colors.mint} />
              </View>
              <Text style={styles.appName}>Foresight</Text>
              <Text style={styles.tagline}>
                {isSignUp ? "Start your financial journey" : "Welcome back"}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              
              {/* Error/Success Messages */}
              {error && (
                <View style={styles.messageContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {successMessage && (
                <View style={[styles.messageContainer, styles.successContainer]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.mint} />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.neutral500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.neutral600}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.neutral500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.neutral600}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={colors.neutral500} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPassword} 
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Mode */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.toggleAction}>
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface300,
    marginBottom: spacing[4],
    ...commonStyles.shadowMint,
  },
  appName: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing[2],
  },
  tagline: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral400,
    letterSpacing: typography.letterSpacing.wide,
  },
  formContainer: {
    width: '100%',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  successContainer: {
    backgroundColor: 'rgba(0, 217, 165, 0.1)',
    borderColor: colors.mint,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.fontSizes.sm,
  },
  successText: {
    flex: 1,
    color: colors.mint,
    fontSize: typography.fontSizes.sm,
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
  label: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginBottom: spacing[2],
    fontWeight: typography.fontWeights.medium,
    marginLeft: spacing[1],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface200,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    height: 56,
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: typography.fontSizes.md,
    height: '100%',
  },
  eyeIcon: {
    padding: spacing[2],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing[2],
    marginBottom: spacing[6],
  },
  forgotPasswordText: {
    color: colors.mint,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  submitButton: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    ...commonStyles.shadowMint,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.black,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  toggleText: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.md,
  },
  toggleAction: {
    color: colors.mint,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
});
