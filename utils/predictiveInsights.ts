import { Transaction, Bill, Insight, CategoryBudget, SavingsGoal, BudgetCategory } from '../types';
import { RecurringPattern, detectRecurringPatterns, getMonthlyAmount } from './recurring';
import { detectSubscriptions, Subscription } from './subscriptions';

/**
 * Predictive Insights Engine
 * 
 * Analyzes transactions, bills, and patterns to generate actionable AI-driven insights.
 * This moves beyond static mock data to real predictive financial coaching.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PredictiveInsightInput {
  transactions: Transaction[];
  bills: Bill[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  monthlyIncome: number;
  currentBalance: number;
}

export interface GeneratedInsight extends Omit<Insight, 'id' | 'isRead'> {
  priority: 'high' | 'medium' | 'low';
  category: 'spending' | 'subscription' | 'bill' | 'saving' | 'income';
  expiresAt?: string;
}

// ============================================================================
// SUBSCRIPTION SPIKE DETECTION
// ============================================================================

interface SubscriptionSpikeResult {
  merchantName: string;
  previousAmount: number;
  currentAmount: number;
  increasePercent: number;
  increaseAmount: number;
}

/**
 * Detect subscription price increases by comparing recent charges to historical average
 * 
 * Algorithm:
 * 1. Group transactions by merchant for recurring subscriptions
 * 2. Compare most recent charge to average of previous charges
 * 3. Flag if increase > 5% (meaningful price hike)
 */
export function detectSubscriptionSpikes(transactions: Transaction[]): SubscriptionSpikeResult[] {
  const patterns = detectRecurringPatterns(transactions);
  const spikes: SubscriptionSpikeResult[] = [];

  for (const pattern of patterns) {
    if (!pattern.isSubscription || pattern.transactionIds.length < 3) continue;

    // Get actual transactions for this pattern
    const patternTxs = transactions
      .filter(t => pattern.transactionIds.includes(t.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (patternTxs.length < 3) continue;

    const mostRecent = patternTxs[0].amount;
    const previousTxs = patternTxs.slice(1);
    const previousAverage = previousTxs.reduce((sum, t) => sum + t.amount, 0) / previousTxs.length;

    // Check for meaningful increase (>5%)
    const increasePercent = ((mostRecent - previousAverage) / previousAverage) * 100;
    
    if (increasePercent > 5) {
      spikes.push({
        merchantName: pattern.merchantName,
        previousAmount: Math.round(previousAverage * 100) / 100,
        currentAmount: mostRecent,
        increasePercent: Math.round(increasePercent * 10) / 10,
        increaseAmount: Math.round((mostRecent - previousAverage) * 100) / 100,
      });
    }
  }

  // Sort by increase amount (highest first)
  return spikes.sort((a, b) => b.increaseAmount - a.increaseAmount);
}

// ============================================================================
// LOW BALANCE WARNING (Cashflow Prediction)
// ============================================================================

interface LowBalanceWarning {
  projectedBalance: number;
  daysUntilLow: number;
  upcomingBillsTotal: number;
  upcomingBills: { name: string; amount: number; dueDate: string }[];
  dailyBurnRate: number;
  recommendedDailySpend: number;
}

/**
 * Predict low balance based on upcoming bills and spending patterns
 * 
 * Algorithm:
 * 1. Calculate daily burn rate from recent spending (last 30 days)
 * 2. Project upcoming bills within the next 14 days
 * 3. Simulate balance forward considering bills and average spending
 * 4. Warn if projected balance drops below safety threshold (10% of income or $500)
 */
export function predictLowBalance(
  transactions: Transaction[],
  bills: Bill[],
  currentBalance: number,
  monthlyIncome: number
): LowBalanceWarning | null {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Calculate daily burn rate from recent expenses
  const recentExpenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= thirtyDaysAgo && txDate <= now;
  });

  const totalRecentSpending = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)));
  const dailyBurnRate = totalRecentSpending / daysInPeriod;

  // Get upcoming unpaid bills within 14 days
  const upcomingBills = bills
    .filter(b => {
      if (b.isPaid) return false;
      const dueDate = new Date(b.dueDate);
      return dueDate >= now && dueDate <= fourteenDaysAhead;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const upcomingBillsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

  // Safety threshold: 10% of monthly income or $500, whichever is greater
  const safetyThreshold = Math.max(monthlyIncome * 0.1, 500);

  // Simulate balance over next 14 days
  let simulatedBalance = currentBalance;
  let daysUntilLow = -1;

  for (let day = 1; day <= 14; day++) {
    const targetDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    
    // Subtract daily spending estimate
    simulatedBalance -= dailyBurnRate;

    // Subtract any bills due on this day
    for (const bill of upcomingBills) {
      const billDate = new Date(bill.dueDate);
      if (billDate.toDateString() === targetDate.toDateString()) {
        simulatedBalance -= bill.amount;
      }
    }

    // Check if we've dropped below threshold
    if (simulatedBalance < safetyThreshold && daysUntilLow === -1) {
      daysUntilLow = day;
      break;
    }
  }

  // Only warn if we'll hit low balance within 14 days
  if (daysUntilLow === -1) return null;

  // Calculate recommended daily spend to avoid low balance
  const daysUntilNextPaycheck = 14; // Assume bi-weekly pay
  const availableForSpending = currentBalance - upcomingBillsTotal - safetyThreshold;
  const recommendedDailySpend = Math.max(0, availableForSpending / daysUntilNextPaycheck);

  return {
    projectedBalance: Math.round(simulatedBalance * 100) / 100,
    daysUntilLow,
    upcomingBillsTotal: Math.round(upcomingBillsTotal * 100) / 100,
    upcomingBills: upcomingBills.map(b => ({
      name: b.name,
      amount: b.amount,
      dueDate: b.dueDate,
    })),
    dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
    recommendedDailySpend: Math.round(recommendedDailySpend * 100) / 100,
  };
}

// ============================================================================
// SPENDING ANOMALY DETECTION
// ============================================================================

interface SpendingAnomaly {
  category: BudgetCategory;
  currentSpend: number;
  averageSpend: number;
  percentAboveAverage: number;
  daysIntoMonth: number;
}

/**
 * Detect unusual spending patterns by category
 * 
 * Algorithm:
 * 1. Calculate average monthly spending per category (last 3 months)
 * 2. Compare current month's spending (prorated) to average
 * 3. Flag if current pace exceeds average by 30%+
 */
export function detectSpendingAnomalies(transactions: Transaction[]): SpendingAnomaly[] {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysIntoMonth = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Get historical spending (last 3 months, excluding current)
  const historicalExpenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= threeMonthsAgo && txDate < startOfMonth;
  });

  // Get current month spending
  const currentExpenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    return t.type === 'expense' && txDate >= startOfMonth && txDate <= now;
  });

  // Aggregate by category
  const historicalByCategory: Partial<Record<BudgetCategory, number>> = {};
  const currentByCategory: Partial<Record<BudgetCategory, number>> = {};

  for (const tx of historicalExpenses) {
    historicalByCategory[tx.category] = (historicalByCategory[tx.category] || 0) + tx.amount;
  }

  for (const tx of currentExpenses) {
    currentByCategory[tx.category] = (currentByCategory[tx.category] || 0) + tx.amount;
  }

  const anomalies: SpendingAnomaly[] = [];

  // Calculate anomalies per category
  for (const [category, currentSpend] of Object.entries(currentByCategory)) {
    const historicalTotal = historicalByCategory[category as BudgetCategory] || 0;
    const monthlyAverage = historicalTotal / 3; // 3 months of history

    if (monthlyAverage === 0) continue;

    // Prorate current spending to full month
    const projectedMonthlySpend = (currentSpend / daysIntoMonth) * daysInMonth;
    const percentAboveAverage = ((projectedMonthlySpend - monthlyAverage) / monthlyAverage) * 100;

    // Flag if 30%+ above average
    if (percentAboveAverage > 30) {
      anomalies.push({
        category: category as BudgetCategory,
        currentSpend,
        averageSpend: Math.round(monthlyAverage * 100) / 100,
        percentAboveAverage: Math.round(percentAboveAverage),
        daysIntoMonth,
      });
    }
  }

  // Sort by percentage above average (highest first)
  return anomalies.sort((a, b) => b.percentAboveAverage - a.percentAboveAverage);
}

// ============================================================================
// GOAL PROGRESS INSIGHTS
// ============================================================================

interface GoalInsight {
  goalName: string;
  percentComplete: number;
  monthsToCompletion: number;
  onTrack: boolean;
  suggestion: string;
}

/**
 * Analyze savings goal progress and provide guidance
 */
export function analyzeGoalProgress(
  goals: SavingsGoal[],
  monthlyIncome: number,
  monthlyExpenses: number
): GoalInsight[] {
  const monthlySavingsCapacity = Math.max(0, monthlyIncome - monthlyExpenses);
  const insights: GoalInsight[] = [];

  for (const goal of goals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) continue; // Goal complete

    const percentComplete = (goal.currentAmount / goal.targetAmount) * 100;
    const monthsToCompletion = monthlySavingsCapacity > 0 
      ? Math.ceil(remaining / (monthlySavingsCapacity / goals.length))
      : Infinity;

    const onTrack = monthsToCompletion <= 12;
    
    let suggestion = '';
    if (monthsToCompletion === Infinity) {
      suggestion = 'Reduce expenses to free up savings capacity';
    } else if (monthsToCompletion > 24) {
      suggestion = `At current pace, ${Math.round(monthsToCompletion)} months to goal. Consider increasing contributions.`;
    } else if (monthsToCompletion <= 3) {
      suggestion = 'Almost there! Stay consistent.';
    } else {
      suggestion = `On track to reach goal in ${monthsToCompletion} months`;
    }

    insights.push({
      goalName: goal.name,
      percentComplete: Math.round(percentComplete),
      monthsToCompletion,
      onTrack,
      suggestion,
    });
  }

  return insights;
}

// ============================================================================
// MASTER INSIGHT GENERATOR
// ============================================================================

/**
 * Generate all predictive insights from financial data
 * 
 * This is the main entry point that combines all analysis modules
 * to produce actionable insights for the user.
 */
export function generatePredictiveInsights(input: PredictiveInsightInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const { transactions, bills, budgets, goals, monthlyIncome, currentBalance } = input;

  // Calculate monthly expenses for various analyses
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const monthlyExpenses = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      return t.type === 'expense' && txDate >= startOfMonth && txDate <= endOfMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // 1. SUBSCRIPTION SPIKES
  const spikes = detectSubscriptionSpikes(transactions);
  for (const spike of spikes.slice(0, 2)) { // Top 2 spikes
    insights.push({
      type: 'subscription',
      title: `${spike.merchantName} Price Increase`,
      description: `${spike.merchantName} increased from $${spike.previousAmount.toFixed(2)} to $${spike.currentAmount.toFixed(2)} (+${spike.increasePercent}%). That's $${(spike.increaseAmount * 12).toFixed(2)} more per year.`,
      data: {
        amount: spike.currentAmount,
        saved: spike.increaseAmount * 12,
      },
      priority: spike.increasePercent > 20 ? 'high' : 'medium',
      category: 'subscription',
    });
  }

  // 2. LOW BALANCE WARNING
  const lowBalanceWarning = predictLowBalance(transactions, bills, currentBalance, monthlyIncome);
  if (lowBalanceWarning) {
    const billNames = lowBalanceWarning.upcomingBills.slice(0, 3).map(b => b.name).join(', ');
    insights.push({
      type: 'alert',
      title: 'Upcoming Cashflow Warning',
      description: `Heads up! ${billNames} due soon totaling $${lowBalanceWarning.upcomingBillsTotal.toFixed(2)}. Limit spending to $${lowBalanceWarning.recommendedDailySpend.toFixed(0)}/day to stay safe.`,
      data: {
        amount: lowBalanceWarning.upcomingBillsTotal,
      },
      priority: lowBalanceWarning.daysUntilLow <= 3 ? 'high' : 'medium',
      category: 'bill',
    });
  }

  // 3. SPENDING ANOMALIES
  const anomalies = detectSpendingAnomalies(transactions);
  for (const anomaly of anomalies.slice(0, 2)) { // Top 2 anomalies
    const categoryLabel = formatCategoryLabel(anomaly.category);
    insights.push({
      type: 'alert',
      title: `${categoryLabel} Spending Alert`,
      description: `You've spent $${anomaly.currentSpend.toFixed(2)} on ${categoryLabel.toLowerCase()} - ${anomaly.percentAboveAverage}% above your usual pace. Your average is $${anomaly.averageSpend.toFixed(2)}/month.`,
      data: {
        amount: anomaly.currentSpend,
        comparison: `${anomaly.percentAboveAverage}% above average`,
      },
      priority: anomaly.percentAboveAverage > 50 ? 'high' : 'medium',
      category: 'spending',
    });
  }

  // 4. BUDGET THRESHOLD WARNINGS
  for (const budget of budgets) {
    if (!budget.isActive) continue;
    const spentRatio = budget.currentSpent / budget.monthlyLimit;
    
    if (spentRatio >= budget.alertThreshold && spentRatio < 1.0) {
      const categoryLabel = formatCategoryLabel(budget.category);
      const percentUsed = Math.round(spentRatio * 100);
      insights.push({
        type: 'alert',
        title: `${categoryLabel} Budget ${percentUsed}% Used`,
        description: `You've used ${percentUsed}% of your $${budget.monthlyLimit.toFixed(0)} ${categoryLabel.toLowerCase()} budget with ${getDaysLeftInMonth()} days left in the month.`,
        data: {
          amount: budget.currentSpent,
        },
        priority: spentRatio >= 0.9 ? 'high' : 'medium',
        category: 'spending',
      });
    }
  }

  // 5. GOAL PROGRESS (Positive insights)
  const goalInsights = analyzeGoalProgress(goals, monthlyIncome, monthlyExpenses);
  for (const goal of goalInsights) {
    if (goal.percentComplete >= 75) {
      insights.push({
        type: 'positive',
        title: `${goal.goalName} Almost Complete!`,
        description: `You're ${goal.percentComplete}% of the way to your ${goal.goalName} goal. ${goal.suggestion}`,
        priority: 'low',
        category: 'saving',
      });
    }
  }

  // 6. SAVINGS RATE CHECK
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  if (savingsRate >= 0.2) {
    insights.push({
      type: 'positive',
      title: 'Excellent Savings Rate!',
      description: `You're saving ${Math.round(savingsRate * 100)}% of your income this month. That's above the recommended 20% target.`,
      priority: 'low',
      category: 'saving',
    });
  } else if (savingsRate < 0.05 && monthlyIncome > 0) {
    insights.push({
      type: 'alert',
      title: 'Low Savings Rate',
      description: `Your savings rate is only ${Math.round(savingsRate * 100)}% this month. Consider reviewing expenses to boost savings.`,
      priority: 'medium',
      category: 'saving',
    });
  }

  // Sort by priority (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCategoryLabel(category: BudgetCategory): string {
  const labels: Record<BudgetCategory, string> = {
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
  return labels[category] || category;
}

function getDaysLeftInMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return endOfMonth.getDate() - now.getDate();
}

/**
 * Convert GeneratedInsight to Insight (for storage)
 */
export function toStorableInsight(generated: GeneratedInsight): Omit<Insight, 'id'> {
  return {
    type: generated.type,
    title: generated.title,
    description: generated.description,
    data: generated.data,
    isRead: false,
  };
}
