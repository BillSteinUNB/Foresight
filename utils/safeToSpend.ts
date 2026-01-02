import { useTransactionStore, selectTotalIncome, selectTotalExpenses } from '../stores/useTransactionStore';
import { useBillStore, selectTotalUnpaidAmount } from '../stores/useBillStore';
import { useGoalStore, selectRemainingToSave } from '../stores/useGoalStore';
import { useBudgetStore, selectTotalBudgeted } from '../stores/useBudgetStore';

/**
 * Calculate the recommended monthly savings amount
 * This is spread across all active goals
 */
export const selectRecommendedMonthlySavings = (
  state: import('../stores/useGoalStore').GoalStore
) => {
  const activeGoals = state.goals.filter((g) => g.currentAmount < g.targetAmount);
  if (activeGoals.length === 0) return 0;
  
  // Distribute savings evenly across goals
  const totalRemaining = activeGoals.reduce(
    (sum, g) => sum + (g.targetAmount - g.currentAmount),
    0
  );
  return totalRemaining / 12; // Assume 12 months to reach goals
};

/**
 * Calculate Safe-to-Spend amount
 * 
 * Formula: Monthly Income - Unpaid Bills - Recommended Monthly Savings - Budgeted Expenses
 * 
 * This represents how much disposable income is available for flexible spending
 * after accounting for obligations and savings goals.
 */
export const calculateSafeToSpend = (
  monthlyIncome: number,
  unpaidBills: number,
  recommendedSavings: number,
  budgetedExpenses: number
): number => {
  const safeToSpend = monthlyIncome - unpaidBills - recommendedSavings - budgetedExpenses;
  return Math.max(0, safeToSpend); // Never negative
};

/**
 * Safe-to-Spend selector for use with transaction store
 * Combines data from all relevant stores
 */
export const selectSafeToSpend = (state: {
  transactions: import('../types').Transaction[];
  bills: import('../types').Bill[];
  goals: import('../types').SavingsGoal[];
  budgets: import('../types').CategoryBudget[];
  isHydrated: boolean;
}): number => {
  if (!state.isHydrated) return 0;

  // Calculate monthly income
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyIncome = state.transactions
    .filter(
      (t) =>
        t.type === 'income' &&
        new Date(t.date) >= startOfMonth &&
        new Date(t.date) <= endOfMonth
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate unpaid bills for current month
  const unpaidBills = state.bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  // Calculate remaining to save for goals
  const remainingToSave = state.goals
    .filter((g) => g.currentAmount < g.targetAmount)
    .reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);
  
  const recommendedSavings = remainingToSave / 12; // Monthly savings target

  // Calculate total budgeted expenses
  const budgetedExpenses = state.budgets
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + b.monthlyLimit, 0);

  return calculateSafeToSpend(monthlyIncome, unpaidBills, recommendedSavings, budgetedExpenses);
};

/**
 * Get breakdown of Safe-to-Spend calculation for display
 */
export interface SafeToSpendBreakdown {
  monthlyIncome: number;
  unpaidBills: number;
  recommendedSavings: number;
  budgetedExpenses: number;
  safeToSpend: number;
  breakdown: {
    label: string;
    amount: number;
    color: string;
  }[];
}

export const getSafeToSpendBreakdown = (
  monthlyIncome: number,
  unpaidBills: number,
  recommendedSavings: number,
  budgetedExpenses: number
): SafeToSpendBreakdown => {
  const safeToSpend = calculateSafeToSpend(
    monthlyIncome,
    unpaidBills,
    recommendedSavings,
    budgetedExpenses
  );

  return {
    monthlyIncome,
    unpaidBills,
    recommendedSavings,
    budgetedExpenses,
    safeToSpend,
    breakdown: [
      { label: 'Income', amount: monthlyIncome, color: '#10B981' }, // mint
      { label: 'Bills', amount: unpaidBills, color: '#EF4444' }, // danger
      { label: 'Savings', amount: recommendedSavings, color: '#3B82F6' }, // blue
      { label: 'Budgets', amount: budgetedExpenses, color: '#F59E0B' }, // amber
    ],
  };
};
