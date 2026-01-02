import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry for crash reporting and performance monitoring.
 * 
 * To set up Sentry:
 * 1. Create a project at https://sentry.io
 * 2. Get your DSN (Data Source Name)
 * 3. Set SENTRY_DSN environment variable or replace placeholder below
 * 
 * For Expo EAS Build:
 * - Add SENTRY_DSN to your eas.json environment variables
 * - Or set it in app.config.js using process.env.SENTRY_DSN
 */
export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN || '';
  
  // Skip initialization if no valid DSN is configured
  const isValidDsn = dsn && !dsn.includes('your-dsn') && !dsn.includes('your-project-id');
  
  if (!isValidDsn) {
    // Silently skip Sentry in development or when not configured
    if (__DEV__) {
      console.log('Sentry: Skipping initialization (no valid DSN configured)');
    }
    return;
  }
  
  Sentry.init({
    dsn,
    // Don't send errors in development to avoid noise
    // In production, set to false or remove this option
    enabled: !__DEV__,
    // Sample rate for performance monitoring (1.0 = 100% of transactions)
    tracesSampleRate: 1.0,
    // Environment tag for filtering in Sentry dashboard
    environment: __DEV__ ? 'development' : 'production',
    // Attach stack traces to messages for better debugging
    attachStacktrace: true,
    // Customize which errors to ignore
    beforeSend: (event, hint) => {
      // Ignore certain types of errors if needed
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Ignore network errors that are expected
        if (error.message?.includes('Network request failed')) {
          return null;
        }
      }
      
      return event;
    },
  });

  // Set user context if available (be careful with PII)
  // Sentry.setUser({ id: 'user-id', email: 'user@example.com' });
};

/**
 * Capture a custom error with additional context
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

/**
 * Capture a custom message/info event
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for user navigation tracking
 */
export const addBreadcrumb = (category: string, message: string, data?: Record<string, string>) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

export default Sentry;
