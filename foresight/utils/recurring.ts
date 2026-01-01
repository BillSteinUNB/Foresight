import { Transaction, BudgetCategory, RecurringFrequency } from '../types';

/**
 * Recurring transaction detection utilities
 * Identifies patterns in transactions to detect recurring payments
 */

// Re-export for convenience
export type { RecurringFrequency } from '../types';

export interface RecurringPattern {
  merchantName: string;
  category: BudgetCategory;
  frequency: RecurringFrequency;
  averageAmount: number;
  transactionIds: string[];
  nextExpectedDate: string;
  confidence: number; // 0-1 score of how confident we are this is recurring
  isSubscription: boolean; // True if this looks like a subscription service
}

// Known subscription merchants (for higher confidence scoring)
const KNOWN_SUBSCRIPTION_MERCHANTS = [
  'netflix', 'spotify', 'hulu', 'disney+', 'disney plus', 'amazon prime', 'apple music',
  'apple tv', 'youtube premium', 'hbo max', 'paramount+', 'peacock', 'crunchyroll',
  'audible', 'kindle unlimited', 'dropbox', 'icloud', 'google one', 'microsoft 365',
  'adobe', 'canva', 'notion', 'slack', 'zoom', 'github', 'linkedin premium',
  'gym', 'fitness', 'planet fitness', 'anytime fitness', 'la fitness',
  'peloton', 'headspace', 'calm', 'duolingo', 'masterclass',
  'openai', 'chatgpt', 'midjourney', 'anthropic',
];

// Day tolerance for matching recurring transactions (e.g., monthly bills may vary by a few days)
const DAY_TOLERANCE: Record<RecurringFrequency, number> = {
  weekly: 2,
  biweekly: 3,
  monthly: 5,
  quarterly: 7,
  yearly: 10,
};

// Expected intervals in days
const FREQUENCY_DAYS: Record<RecurringFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

/**
 * Calculate the difference in days between two dates
 */
const daysBetween = (date1: Date, date2: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(Math.floor((date2.getTime() - date1.getTime()) / msPerDay));
};

/**
 * Check if a merchant name matches known subscription services
 */
const isKnownSubscription = (merchantName: string): boolean => {
  const lowerName = merchantName.toLowerCase();
  return KNOWN_SUBSCRIPTION_MERCHANTS.some(sub => lowerName.includes(sub));
};

/**
 * Determine the likely frequency based on intervals between transactions
 */
const detectFrequency = (intervals: number[]): RecurringFrequency | null => {
  if (intervals.length === 0) return null;

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Check each frequency type
  const frequencies: RecurringFrequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
  
  for (const freq of frequencies) {
    const expectedDays = FREQUENCY_DAYS[freq];
    const tolerance = DAY_TOLERANCE[freq];
    
    if (Math.abs(avgInterval - expectedDays) <= tolerance) {
      return freq;
    }
  }

  return null;
};

/**
 * Calculate confidence score for a recurring pattern
 */
const calculateConfidence = (
  transactionCount: number,
  intervalVariance: number,
  amountVariance: number,
  isKnownSub: boolean
): number => {
  let confidence = 0;

  // More transactions = higher confidence
  if (transactionCount >= 6) confidence += 0.4;
  else if (transactionCount >= 4) confidence += 0.3;
  else if (transactionCount >= 3) confidence += 0.2;
  else if (transactionCount >= 2) confidence += 0.1;

  // Lower interval variance = higher confidence
  if (intervalVariance < 3) confidence += 0.3;
  else if (intervalVariance < 7) confidence += 0.2;
  else if (intervalVariance < 14) confidence += 0.1;

  // Lower amount variance = higher confidence
  if (amountVariance < 0.05) confidence += 0.2;
  else if (amountVariance < 0.1) confidence += 0.15;
  else if (amountVariance < 0.2) confidence += 0.1;

  // Known subscription merchants get a bonus
  if (isKnownSub) confidence += 0.1;

  return Math.min(confidence, 1);
};

/**
 * Calculate variance of an array of numbers
 */
const variance = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
};

/**
 * Detect recurring patterns in a list of transactions
 */
export const detectRecurringPatterns = (transactions: Transaction[]): RecurringPattern[] => {
  // Filter to expenses only (income is handled separately)
  const expenses = transactions.filter(t => t.type === 'expense');

  // Group transactions by normalized merchant name
  const byMerchant = new Map<string, Transaction[]>();
  
  for (const tx of expenses) {
    const normalizedName = tx.merchantName.toLowerCase().trim();
    const existing = byMerchant.get(normalizedName) || [];
    existing.push(tx);
    byMerchant.set(normalizedName, existing);
  }

  const patterns: RecurringPattern[] = [];

  for (const [merchantName, merchantTxs] of byMerchant.entries()) {
    // Need at least 2 transactions to detect a pattern
    if (merchantTxs.length < 2) continue;

    // Sort by date (oldest first)
    const sorted = [...merchantTxs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate intervals between consecutive transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      intervals.push(daysBetween(prevDate, currDate));
    }

    // Detect frequency
    const frequency = detectFrequency(intervals);
    if (!frequency) continue;

    // Calculate amount statistics
    const amounts = sorted.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVar = variance(amounts) / (avgAmount * avgAmount); // Coefficient of variation squared

    // Calculate interval variance
    const intervalVar = Math.sqrt(variance(intervals));

    // Check if known subscription
    const isKnownSub = isKnownSubscription(merchantName);

    // Calculate confidence
    const confidence = calculateConfidence(
      sorted.length,
      intervalVar,
      amountVar,
      isKnownSub
    );

    // Only include if confidence is above threshold
    if (confidence < 0.3) continue;

    // Calculate next expected date
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const expectedDays = FREQUENCY_DAYS[frequency];
    const nextExpected = new Date(lastDate.getTime() + expectedDays * 24 * 60 * 60 * 1000);

    patterns.push({
      merchantName: sorted[0].merchantName, // Use original casing
      category: sorted[0].category,
      frequency,
      averageAmount: Math.round(avgAmount * 100) / 100,
      transactionIds: sorted.map(t => t.id),
      nextExpectedDate: nextExpected.toISOString(),
      confidence,
      isSubscription: isKnownSub || sorted[0].category === 'subscriptions',
    });
  }

  // Sort by confidence (highest first)
  return patterns.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Get transactions that are part of recurring patterns
 */
export const getRecurringTransactionIds = (transactions: Transaction[]): Set<string> => {
  const patterns = detectRecurringPatterns(transactions);
  const recurringIds = new Set<string>();

  for (const pattern of patterns) {
    for (const id of pattern.transactionIds) {
      recurringIds.add(id);
    }
  }

  return recurringIds;
};

/**
 * Check if a specific transaction is recurring
 */
export const isTransactionRecurring = (
  transaction: Transaction,
  allTransactions: Transaction[]
): boolean => {
  const recurringIds = getRecurringTransactionIds(allTransactions);
  return recurringIds.has(transaction.id);
};

/**
 * Get the frequency label for display
 */
export const getFrequencyLabel = (frequency: RecurringFrequency): string => {
  switch (frequency) {
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Bi-weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
  }
};

/**
 * Calculate monthly cost for a recurring pattern
 */
export const getMonthlyAmount = (pattern: RecurringPattern): number => {
  switch (pattern.frequency) {
    case 'weekly': return pattern.averageAmount * 4.33;
    case 'biweekly': return pattern.averageAmount * 2.17;
    case 'monthly': return pattern.averageAmount;
    case 'quarterly': return pattern.averageAmount / 3;
    case 'yearly': return pattern.averageAmount / 12;
  }
};

/**
 * Calculate yearly cost for a recurring pattern
 */
export const getYearlyAmount = (pattern: RecurringPattern): number => {
  switch (pattern.frequency) {
    case 'weekly': return pattern.averageAmount * 52;
    case 'biweekly': return pattern.averageAmount * 26;
    case 'monthly': return pattern.averageAmount * 12;
    case 'quarterly': return pattern.averageAmount * 4;
    case 'yearly': return pattern.averageAmount;
  }
};
