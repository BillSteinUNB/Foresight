import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface Props {
  children: ReactNode;
  /** Optional name for this boundary (helps identify which screen crashed) */
  name?: string;
  /** Called when user taps "Go Home" - if provided, shows Go Home button */
  onGoHome?: () => void;
  /** Called when user taps "Try Again" - resets error state */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // TODO: Send to crash reporting service (Sentry, Firebase, etc.)
    // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  handleGoHome = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onGoHome?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { name } = this.props;
      const { error } = this.state;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color={colors.danger} />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Something went wrong</Text>

            {/* Error Context */}
            {name && (
              <Text style={styles.context}>
                Error in: {name}
              </Text>
            )}

            {/* Error Message */}
            <Text style={styles.message}>
              {error?.message || 'An unexpected error occurred.'}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleRetry}
                activeOpacity={0.8}
                accessibilityLabel="Try Again"
                accessibilityRole="button"
              >
                <Ionicons name="refresh-outline" size={20} color={colors.black} />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {this.props.onGoHome && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.handleGoHome}
                  activeOpacity={0.8}
                  accessibilityLabel="Go Home"
                  accessibilityRole="button"
                >
                  <Ionicons name="home-outline" size={20} color={colors.mint} />
                  <Text style={styles.secondaryButtonText}>Go Home</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Debug Info (Development only) */}
            {__DEV__ && this.state.errorInfo && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold as '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  context: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral300,
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: spacing[3],
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: 12,
    gap: spacing[2],
  },
  primaryButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as '600',
    color: colors.black,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface200,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: 12,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  secondaryButtonText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold as '600',
    color: colors.mint,
  },
  debugContainer: {
    marginTop: spacing[6],
    maxHeight: 150,
    width: '100%',
    backgroundColor: colors.surface200,
    borderRadius: 8,
    padding: spacing[3],
  },
  debugTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold as '600',
    color: colors.danger,
    marginBottom: spacing[2],
  },
  debugText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
