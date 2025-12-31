import { BudgetCategory } from './types';

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as compact currency (e.g., $1.2K)
 */
export const formatCompactCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    compactDisplay: "short"
  }).format(amount);
};

/**
 * Format a date string to a friendly display format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Category icon mapping with type safety
const CATEGORY_ICONS: Record<BudgetCategory, string> = {
  food_dining: '🍔',
  transportation: '🚕',
  shopping: '🛍️',
  entertainment: '🎬',
  bills_utilities: '💡',
  health_fitness: '💪',
  travel: '✈️',
  income: '💰',
  subscriptions: '🔄',
  other: '📦'
};

/**
 * Get the emoji icon for a budget category
 */
export const getCategoryIcon = (category: BudgetCategory): string => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
};

// Category color mapping with type safety
const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  food_dining: '#FF6B35',
  transportation: '#4ECDC4',
  shopping: '#FF69B4',
  entertainment: '#9B59B6',
  bills_utilities: '#3498DB',
  health_fitness: '#E74C3C',
  travel: '#F39C12',
  income: '#00D9A5',
  subscriptions: '#8B5CF6',
  other: '#95A5A6',
};

/**
 * Get the color for a budget category
 */
export const getCategoryColor = (category: BudgetCategory): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
};

/**
 * Get a greeting based on the current time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Get the number of days until the end of the current month
 */
export const getDaysUntilEndOfMonth = (): number => {
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const diffTime = lastDayOfMonth.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Validate that an amount is a positive number
 */
export const isValidAmount = (amount: number): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
};

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
};
