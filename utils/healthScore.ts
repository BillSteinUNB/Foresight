import { Transaction, Bill, CategoryBudget } from '../types';

/**
 * Financial Health Score Weights
 * Total = 100 points
 */
const WEIGHTS = {
  savingsRate: 0.35,      // 35 points
  budgetAdherence: 0.35,  // 35 points
  billPunctuality: 0.30,  // 30 points
} as const;

export interface HealthScoreInputs {
  /** Total income this month */
  monthlyIncome: number;
  /** Total expenses this month */
  monthlyExpenses: number;
  /** Active budgets with their limits and current spending */
  budgets: CategoryBudget[];
  /** All bills (paid and unpaid) */
  bills: Bill[];
}

/**
 * Calculate savings rate score (0-35 points)
 * 
 * Scoring logic:
 * - 20%+ savings rate = 35 points (excellent)
 * - 10-20% savings rate = 25 points (good)
 * - 5-10% savings rate = 15 points (fair)
 * - 0-5% savings rate = 5 points (needs improvement)
 * - Negative savings rate = 0 points (critical)
 */
const calculateSavingsRateScore = (monthlyIncome: number, monthlyExpenses: number): number => {
  if (monthlyIncome <= 0) return 0;
  
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = savings / monthlyIncome;
  
  if (savingsRate >= 0.20) return 35;
  if (savingsRate >= 0.10) return 25;
  if (savingsRate >= 0.05) return 15;
  if (savingsRate >= 0) return 5;
  return 0; // Negative savings
};

/**
 * Calculate budget adherence score (0-35 points)
 * 
 * Scoring logic:
 * - All budgets under 80% spent = 35 points
 * - All budgets under limit = 25 points
 * - Some budgets near limit (80-100%) = 15 points
 * - Some budgets over limit = 5 points
 * - Many budgets over limit = 0 points
 */
const calculateBudgetAdherenceScore = (budgets: CategoryBudget[]): number => {
  const activeBudgets = budgets.filter(b => b.isActive);
  
  if (activeBudgets.length === 0) {
    // No budgets set up - give neutral score
    return 17.5;
  }
  
  let overBudgetCount = 0;
  let nearLimitCount = 0;
  const alertThreshold = 0.8; // 80% threshold
  
  for (const budget of activeBudgets) {
    const spentRatio = budget.monthlyLimit > 0 ? budget.currentSpent / budget.monthlyLimit : 1;
    
    if (spentRatio > 1.0) {
      overBudgetCount++;
    } else if (spentRatio >= alertThreshold) {
      nearLimitCount++;
    }
  }
  
  const total = activeBudgets.length;
  
  if (overBudgetCount === 0 && nearLimitCount === 0) {
    return 35; // All under control
  }
  
  if (overBudgetCount === 0) {
    return 25; // All under limit, some near limit
  }
  
  if (overBudgetCount <= Math.ceil(total * 0.2)) {
    return 15; // Small percentage over budget
  }
  
  if (overBudgetCount <= Math.ceil(total * 0.5)) {
    return 5; // Significant percentage over budget
  }
  
  return 0; // Most budgets over limit
};

/**
 * Calculate bill punctuality score (0-30 points)
 * 
 * Scoring logic:
 * - All bills paid on time = 30 points
 * - 90-99% paid on time = 25 points
 * - 75-89% paid on time = 18 points
 * - 50-74% paid on time = 10 points
 * - <50% paid on time = 0 points
 */
const calculateBillPunctualityScore = (bills: Bill[]): number => {
  if (bills.length === 0) {
    // No bills - give neutral score
    return 22.5;
  }
  
  const paidBills = bills.filter(b => b.isPaid);
  const paymentRate = paidBills.length / bills.length;
  
  if (paymentRate >= 1.0) return 30;
  if (paymentRate >= 0.90) return 25;
  if (paymentRate >= 0.75) return 18;
  if (paymentRate >= 0.50) return 10;
  return 0;
};

/**
 * Calculate the overall financial health score (0-100)
 * 
 * @param inputs - Financial data for the calculation
 * @returns A score from 0-100 representing financial health
 */
export const calculateFinancialHealthScore = (inputs: HealthScoreInputs): number => {
  const { monthlyIncome, monthlyExpenses, budgets, bills } = inputs;
  
  const savingsScore = calculateSavingsRateScore(monthlyIncome, monthlyExpenses);
  const budgetScore = calculateBudgetAdherenceScore(budgets);
  const billScore = calculateBillPunctualityScore(bills);
  
  const totalScore = savingsScore + budgetScore + billScore;
  
  // Clamp to valid range
  return Math.min(Math.max(totalScore, 0), 100);
};

/**
 * Get the health score category and label
 */
export const getHealthScoreInfo = (score: number): { label: string; color: string } => {
  if (score >= 75) {
    return { label: 'Excellent', color: '#00D9A5' }; // mint
  }
  if (score >= 50) {
    return { label: 'Good', color: '#F39C12' }; // warning/orange
  }
  return { label: 'Fair', color: '#FF3B5C' }; // danger/red
};

/**
 * Check if a score recalculation is needed
 * Returns true if data has changed significantly
 */
export const shouldRecalculateScore = (
  previousInputs: HealthScoreInputs,
  currentInputs: HealthScoreInputs
): boolean => {
  // Check if income changed by more than 5%
  const incomeChange = Math.abs(previousInputs.monthlyIncome - currentInputs.monthlyIncome);
  const incomeThreshold = previousInputs.monthlyIncome * 0.05;
  
  // Check if expenses changed significantly
  const expenseChange = Math.abs(previousInputs.monthlyExpenses - currentInputs.monthlyExpenses);
  const expenseThreshold = previousInputs.monthlyExpenses * 0.05;
  
  // Check if bills changed
  const billsChanged = previousInputs.bills.length !== currentInputs.bills.length ||
    previousInputs.bills.some((b, i) => 
      b.isPaid !== currentInputs.bills[i]?.isPaid
    );
  
  // Check if budgets changed
  const budgetsChanged = previousInputs.budgets.length !== currentInputs.budgets.length;
  
  return incomeChange > incomeThreshold || 
         expenseChange > expenseThreshold || 
         billsChanged || 
         budgetsChanged;
};
