import { Transaction, TrendPeriod, TrendGranularity, TrendPoint, BudgetCategory } from '../types';

/**
 * Get the start date for a given trend period from now
 */
export function getPeriodStartDate(period: TrendPeriod): Date {
  const now = new Date();
  const start = new Date(now);
  
  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  // Reset to start of day
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Determine appropriate granularity for a given period
 */
export function getGranularityForPeriod(period: TrendPeriod): TrendGranularity {
  switch (period) {
    case 'week':
    case 'month':
      return 'day';
    case '3months':
    case 'year':
      return 'week';
  }
}

/**
 * Format a date for display in chart labels
 */
function formatDateLabel(date: Date, granularity: TrendGranularity): string {
  if (granularity === 'day') {
    // Format: "Jan 3"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // Format: "Wk 2" (week number in month/period)
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    return `Wk ${weekOfMonth}`;
  }
}

/**
 * Generate date buckets for the given period and granularity
 */
function generateBuckets(
  startDate: Date,
  endDate: Date,
  granularity: TrendGranularity
): Array<{ start: Date; end: Date; label: string }> {
  const buckets: Array<{ start: Date; end: Date; label: string }> = [];
  const current = new Date(startDate);
  
  while (current < endDate) {
    const bucketStart = new Date(current);
    let bucketEnd: Date;
    
    if (granularity === 'day') {
      bucketEnd = new Date(current);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      current.setDate(current.getDate() + 1);
    } else {
      // Week granularity
      bucketEnd = new Date(current);
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      current.setDate(current.getDate() + 7);
    }
    
    // Don't exceed end date
    if (bucketEnd > endDate) {
      bucketEnd = new Date(endDate);
    }
    
    buckets.push({
      start: bucketStart,
      end: bucketEnd,
      label: formatDateLabel(bucketStart, granularity),
    });
  }
  
  return buckets;
}

/**
 * Aggregate transactions into trend data points
 */
export function aggregateTransactions(
  transactions: Transaction[],
  period: TrendPeriod
): TrendPoint[] {
  const startDate = getPeriodStartDate(period);
  const endDate = new Date();
  const granularity = getGranularityForPeriod(period);
  
  // Filter to expenses only within the period
  const expenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= startDate && txDate <= endDate;
  });
  
  // Generate buckets
  const buckets = generateBuckets(startDate, endDate, granularity);
  
  // Aggregate transactions into buckets
  const trendPoints: TrendPoint[] = buckets.map(bucket => {
    const bucketTransactions = expenses.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= bucket.start && txDate < bucket.end;
    });
    
    // Calculate total expense
    const totalExpense = bucketTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate by category
    const byCategory: Partial<Record<BudgetCategory, number>> = {};
    bucketTransactions.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    
    return {
      label: bucket.label,
      startDate: bucket.start.toISOString(),
      endDate: bucket.end.toISOString(),
      totalExpense,
      byCategory,
    };
  });
  
  return trendPoints;
}

/**
 * Get top spending categories for the given period
 */
export function getTopCategories(
  transactions: Transaction[],
  period: TrendPeriod,
  limit: number = 5
): Array<{ category: BudgetCategory; total: number; percentage: number }> {
  const startDate = getPeriodStartDate(period);
  const endDate = new Date();
  
  // Filter to expenses only within the period
  const expenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= startDate && txDate <= endDate;
  });
  
  // Aggregate by category
  const categoryTotals: Partial<Record<BudgetCategory, number>> = {};
  let grandTotal = 0;
  
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    grandTotal += t.amount;
  });
  
  // Sort by total descending
  const sorted = Object.entries(categoryTotals)
    .map(([category, total]) => ({
      category: category as BudgetCategory,
      total: total!,
      percentage: grandTotal > 0 ? (total! / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  
  return sorted;
}

/**
 * Calculate summary stats for the period
 */
export function getPeriodSummary(
  transactions: Transaction[],
  period: TrendPeriod
): {
  totalSpent: number;
  averagePerDay: number;
  transactionCount: number;
  highestDay: { date: string; amount: number } | null;
} {
  const startDate = getPeriodStartDate(period);
  const endDate = new Date();
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Filter to expenses only within the period
  const expenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= startDate && txDate <= endDate;
  });
  
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const averagePerDay = dayCount > 0 ? totalSpent / dayCount : 0;
  
  // Find highest spending day
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(t => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + t.amount;
  });
  
  let highestDay: { date: string; amount: number } | null = null;
  Object.entries(dailyTotals).forEach(([date, amount]) => {
    if (!highestDay || amount > highestDay.amount) {
      highestDay = { date, amount };
    }
  });
  
  return {
    totalSpent,
    averagePerDay,
    transactionCount: expenses.length,
    highestDay,
  };
}

/**
 * Category colors for charts
 */
export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  food_dining: '#FF6B6B',
  transportation: '#4ECDC4',
  shopping: '#FFE66D',
  entertainment: '#A855F7',
  bills_utilities: '#3B82F6',
  health_fitness: '#10B981',
  travel: '#F59E0B',
  income: '#00D9A5',
  subscriptions: '#EC4899',
  other: '#6B7280',
};

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food_dining: 'Food & Dining',
  transportation: 'Transportation',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  bills_utilities: 'Bills & Utilities',
  health_fitness: 'Health & Fitness',
  travel: 'Travel',
  income: 'Income',
  subscriptions: 'Subscriptions',
  other: 'Other',
};
