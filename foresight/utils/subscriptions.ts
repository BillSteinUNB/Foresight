import { Transaction, BudgetCategory, DetectedSubscription, SubscriptionOverlap, RecurringFrequency } from '../types';
import { RecurringPattern, detectRecurringPatterns, getMonthlyAmount, getYearlyAmount } from './recurring';

/**
 * Subscription management utilities
 * Identifies subscriptions, detects overlaps, and calculates costs
 */

// Re-export types from types.ts for convenience
export type Subscription = DetectedSubscription;
export type { SubscriptionOverlap } from '../types';

export interface SubscriptionCategory {
  name: string;
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
}

export interface SubscriptionSummary {
  subscriptions: Subscription[];
  totalMonthly: number;
  totalYearly: number;
  byCategory: SubscriptionCategory[];
  overlaps: SubscriptionOverlap[];
  upcomingCharges: { subscription: Subscription; daysUntil: number }[];
}

// Overlap detection categories - subscriptions that may have overlapping features
const OVERLAP_GROUPS: Record<string, { keywords: string[]; description: string }> = {
  'Video Streaming': {
    keywords: ['netflix', 'hulu', 'disney', 'hbo', 'paramount', 'peacock', 'amazon prime video', 'apple tv', 'youtube premium'],
    description: 'Multiple video streaming services with overlapping content libraries',
  },
  'Music Streaming': {
    keywords: ['spotify', 'apple music', 'amazon music', 'youtube music', 'tidal', 'deezer', 'pandora'],
    description: 'Multiple music streaming services - most offer similar catalogs',
  },
  'Cloud Storage': {
    keywords: ['dropbox', 'google one', 'icloud', 'onedrive', 'box'],
    description: 'Multiple cloud storage services - consider consolidating',
  },
  'News/Reading': {
    keywords: ['new york times', 'washington post', 'wall street journal', 'medium', 'substack', 'kindle unlimited', 'audible'],
    description: 'Multiple news or reading subscriptions',
  },
  'Fitness': {
    keywords: ['gym', 'fitness', 'peloton', 'apple fitness', 'fitbit premium', 'strava', 'myfitnesspal'],
    description: 'Multiple fitness subscriptions that may overlap',
  },
  'AI Tools': {
    keywords: ['openai', 'chatgpt', 'claude', 'anthropic', 'midjourney', 'copilot', 'jasper'],
    description: 'Multiple AI tool subscriptions',
  },
  'Productivity': {
    keywords: ['notion', 'evernote', 'todoist', 'asana', 'monday', 'trello', 'clickup'],
    description: 'Multiple productivity tools with overlapping features',
  },
};

/**
 * Convert recurring patterns to subscription objects
 */
export const patternsToSubscriptions = (patterns: RecurringPattern[]): Subscription[] => {
  // Filter to subscription-like patterns only
  const subscriptionPatterns = patterns.filter(p => p.isSubscription || p.confidence >= 0.5);

  return subscriptionPatterns.map((pattern, index) => {
    const lastTxDate = new Date(Math.max(
      ...pattern.transactionIds.map(() => Date.now()) // Placeholder - would need actual tx dates
    ));

    // Generate tags based on category and merchant
    const tags: string[] = [];
    const lowerName = pattern.merchantName.toLowerCase();
    
    for (const [group, config] of Object.entries(OVERLAP_GROUPS)) {
      if (config.keywords.some(kw => lowerName.includes(kw))) {
        tags.push(group);
        break;
      }
    }

    return {
      id: `sub_${index}_${pattern.merchantName.replace(/\s+/g, '_').toLowerCase()}`,
      merchantName: pattern.merchantName,
      category: pattern.category,
      monthlyAmount: Math.round(getMonthlyAmount(pattern) * 100) / 100,
      yearlyAmount: Math.round(getYearlyAmount(pattern) * 100) / 100,
      frequency: pattern.frequency,
      nextBillingDate: pattern.nextExpectedDate,
      transactionCount: pattern.transactionIds.length,
      lastChargeDate: pattern.nextExpectedDate, // Would use actual last tx date
      lastChargeAmount: pattern.averageAmount,
      confidence: pattern.confidence,
      status: 'active' as const,
      tags,
    };
  });
};

/**
 * Detect subscriptions from transaction history
 */
export const detectSubscriptions = (transactions: Transaction[]): Subscription[] => {
  const patterns = detectRecurringPatterns(transactions);
  return patternsToSubscriptions(patterns);
};

/**
 * Group subscriptions by category
 */
export const groupByCategory = (subscriptions: Subscription[]): SubscriptionCategory[] => {
  const categoryMap = new Map<string, Subscription[]>();

  for (const sub of subscriptions) {
    // Use tags if available, otherwise use transaction category
    const categoryKey = sub.tags[0] || sub.category;
    const existing = categoryMap.get(categoryKey) || [];
    existing.push(sub);
    categoryMap.set(categoryKey, existing);
  }

  const categories: SubscriptionCategory[] = [];
  
  for (const [name, subs] of categoryMap.entries()) {
    const monthlyTotal = subs.reduce((sum, s) => sum + s.monthlyAmount, 0);
    const yearlyTotal = subs.reduce((sum, s) => sum + s.yearlyAmount, 0);

    categories.push({
      name,
      subscriptions: subs,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
    });
  }

  // Sort by monthly total (highest first)
  return categories.sort((a, b) => b.monthlyTotal - a.monthlyTotal);
};

/**
 * Detect potential subscription overlaps
 */
export const detectOverlaps = (subscriptions: Subscription[]): SubscriptionOverlap[] => {
  const overlaps: SubscriptionOverlap[] = [];

  for (const [category, config] of Object.entries(OVERLAP_GROUPS)) {
    // Find subscriptions matching this overlap category
    const matchingSubs = subscriptions.filter(sub => {
      const lowerName = sub.merchantName.toLowerCase();
      return config.keywords.some(kw => lowerName.includes(kw));
    });

    // Only report as overlap if 2+ subscriptions
    if (matchingSubs.length >= 2) {
      // Calculate potential savings (keep cheapest, save the rest)
      const sortedByPrice = [...matchingSubs].sort((a, b) => a.monthlyAmount - b.monthlyAmount);
      const potentialSavings = sortedByPrice
        .slice(1) // All but cheapest
        .reduce((sum, sub) => sum + sub.monthlyAmount, 0) * 12; // Annual savings

      overlaps.push({
        category,
        subscriptions: matchingSubs,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
        description: config.description,
      });
    }
  }

  // Sort by potential savings (highest first)
  return overlaps.sort((a, b) => b.potentialSavings - a.potentialSavings);
};

/**
 * Get upcoming subscription charges
 */
export const getUpcomingCharges = (
  subscriptions: Subscription[],
  daysAhead: number = 30
): { subscription: Subscription; daysUntil: number }[] => {
  const now = new Date();
  const upcoming: { subscription: Subscription; daysUntil: number }[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;

    const nextDate = new Date(sub.nextBillingDate);
    const msUntil = nextDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(msUntil / (24 * 60 * 60 * 1000));

    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      upcoming.push({ subscription: sub, daysUntil });
    }
  }

  // Sort by days until (soonest first)
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

/**
 * Get complete subscription summary
 */
export const getSubscriptionSummary = (transactions: Transaction[]): SubscriptionSummary => {
  const subscriptions = detectSubscriptions(transactions);
  
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const totalYearly = subscriptions.reduce((sum, s) => sum + s.yearlyAmount, 0);

  return {
    subscriptions,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalYearly: Math.round(totalYearly * 100) / 100,
    byCategory: groupByCategory(subscriptions),
    overlaps: detectOverlaps(subscriptions),
    upcomingCharges: getUpcomingCharges(subscriptions),
  };
};

/**
 * Format subscription frequency for display
 */
export const formatFrequency = (frequency: string): string => {
  switch (frequency) {
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Bi-weekly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    default: return frequency;
  }
};

/**
 * Get color for subscription status
 */
export const getStatusColor = (status: Subscription['status']): string => {
  switch (status) {
    case 'active': return '#00D9A5'; // mint
    case 'cancelled': return '#6B7280'; // neutral
    case 'paused': return '#FFB800'; // warning
    default: return '#6B7280';
  }
};
