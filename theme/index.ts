import { StyleSheet } from 'react-native';

// Color palette
export const colors = {
  // Primary
  mint: '#00D9A5',
  mintHover: '#00F5B8',
  mintMuted: 'rgba(0, 217, 165, 0.2)',
  mintGlow: 'rgba(0, 217, 165, 0.4)',
  
  // Semantic
  danger: '#FF3B5C',
  dangerMuted: 'rgba(255, 59, 92, 0.2)',
  warning: '#FFB800',
  
  // Surfaces (dark theme)
  surface100: '#0A0A0A',
  surface200: '#111111',
  surface300: '#1A1A1A',
  surface400: '#242424',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  neutral100: '#F5F5F5',
  neutral200: '#E5E5E5',
  neutral300: '#D4D4D4',
  neutral400: '#A3A3A3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  
  // Category colors
  foodDining: '#FF6B35',
  transportation: '#4ECDC4',
  shopping: '#FF69B4',
  entertainment: '#9B59B6',
  billsUtilities: '#3498DB',
  healthFitness: '#E74C3C',
  travel: '#F39C12',
  income: '#00D9A5',
  subscriptions: '#8B5CF6',
  other: '#95A5A6',
  
  // Misc
  blue400: '#60A5FA',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
};

// Typography
export const typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Spacing scale
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Common styles
export const commonStyles = StyleSheet.create({
  // Containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[24],
  },
  
  // Cards
  card: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[4],
  },
  cardLarge: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[6],
  },
  
  // Typography
  heading1: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  heading2: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  heading3: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  bodyText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral400,
  },
  caption: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  mono: {
    fontFamily: 'monospace',
  },
  
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  
  // Inputs
  input: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    color: colors.white,
    fontSize: typography.fontSizes.md,
  },
  
  // Shadows (for iOS)
  shadowMd: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shadowLg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  shadowMint: {
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  commonStyles,
};

