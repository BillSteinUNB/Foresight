import { Transaction, Bill, CategoryBudget, LinkedAccount } from '../types';

/**
 * Financial Health Score Weights (V2 - Enhanced Algorithm)
 * 
 * Total = 100 points, distributed across 5 factors for a more
 * "Real World" accurate assessment of financial health.
 * 
 * Changes from V1:
 * - Reduced individual weights to make room for new factors
 * - Added Debt-to-Income ratio (critical for real financial health)
 * - Added Emergency Fund cushion factor
 * - More granular scoring tiers for nuanced assessment
 */
const WEIGHTS = {
  savingsRate: 0.25,        // 25 points (was 35)
  budgetAdherence: 0.20,    // 20 points (was 35)
  billPunctuality: 0.20,    // 20 points (was 30)
  debtToIncome: 0.20,       // 20 points (NEW)
  emergencyFund: 0.15,      // 15 points (NEW)
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
  /** Optional: Total debt across all accounts (credit cards, loans) */
  totalDebt?: number;
  /** Optional: Current liquid savings/emergency fund */
  liquidSavings?: number;
  /** Optional: Linked accounts for more accurate debt calculation */
  linkedAccounts?: LinkedAccount[];
}

export interface HealthScoreBreakdown {
  total: number;
  savingsRate: { score: number; maxScore: number; details: string };
  budgetAdherence: { score: number; maxScore: number; details: string };
  billPunctuality: { score: number; maxScore: number; details: string };
  debtToIncome: { score: number; maxScore: number; details: string };
  emergencyFund: { score: number; maxScore: number; details: string };
}

// ============================================================================
// INDIVIDUAL SCORE CALCULATORS
// ============================================================================

/**
 * Calculate savings rate score (0-25 points)
 * 
 * Based on the 50/30/20 rule: 20% of income should go to savings
 * 
 * Scoring logic:
 * - 20%+ savings rate = 25 points (excellent)
 * - 15-20% savings rate = 22 points (very good)
 * - 10-15% savings rate = 18 points (good)
 * - 5-10% savings rate = 12 points (fair)
 * - 0-5% savings rate = 5 points (needs improvement)
 * - Negative savings rate = 0 points (critical)
 */
const calculateSavingsRateScore = (monthlyIncome: number, monthlyExpenses: number): { score: number; details: string } => {
  if (monthlyIncome <= 0) {
    return { score: 0, details: 'No income recorded' };
  }
  
  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = savings / monthlyIncome;
  const ratePercent = Math.round(savingsRate * 100);
  
  let score: number;
  let details: string;
  
  if (savingsRate >= 0.20) {
    score = 25;
    details = `Excellent! Saving ${ratePercent}% of income`;
  } else if (savingsRate >= 0.15) {
    score = 22;
    details = `Very good ${ratePercent}% savings rate`;
  } else if (savingsRate >= 0.10) {
    score = 18;
    details = `Good ${ratePercent}% savings rate`;
  } else if (savingsRate >= 0.05) {
    score = 12;
    details = `Fair ${ratePercent}% savings rate - aim for 20%`;
  } else if (savingsRate >= 0) {
    score = 5;
    details = `Low ${ratePercent}% savings rate - needs attention`;
  } else {
    score = 0;
    details = `Negative savings - spending exceeds income`;
  }
  
  return { score, details };
};

/**
 * Calculate budget adherence score (0-20 points)
 * 
 * Measures how well the user sticks to their budgets
 * 
 * Scoring logic:
 * - All budgets under 80% spent = 20 points
 * - All budgets under limit = 16 points
 * - Some budgets near limit (80-100%) = 12 points
 * - Few budgets over limit (<25%) = 8 points
 * - Some budgets over limit (25-50%) = 4 points
 * - Many budgets over limit = 0 points
 */
const calculateBudgetAdherenceScore = (budgets: CategoryBudget[]): { score: number; details: string } => {
  const activeBudgets = budgets.filter(b => b.isActive);
  
  if (activeBudgets.length === 0) {
    return { score: 10, details: 'No budgets set - consider creating some' };
  }
  
  let overBudgetCount = 0;
  let nearLimitCount = 0;
  let underControlCount = 0;
  const alertThreshold = 0.8;
  
  for (const budget of activeBudgets) {
    const spentRatio = budget.monthlyLimit > 0 ? budget.currentSpent / budget.monthlyLimit : 1;
    
    if (spentRatio > 1.0) {
      overBudgetCount++;
    } else if (spentRatio >= alertThreshold) {
      nearLimitCount++;
    } else {
      underControlCount++;
    }
  }
  
  const total = activeBudgets.length;
  const overBudgetPercent = overBudgetCount / total;
  
  let score: number;
  let details: string;
  
  if (overBudgetCount === 0 && nearLimitCount === 0) {
    score = 20;
    details = `All ${total} budgets under control`;
  } else if (overBudgetCount === 0) {
    score = 16;
    details = `${nearLimitCount} budget(s) near limit, none over`;
  } else if (overBudgetPercent <= 0.25) {
    score = 12;
    details = `${overBudgetCount} of ${total} budgets over limit`;
  } else if (overBudgetPercent <= 0.5) {
    score = 8;
    details = `${overBudgetCount} of ${total} budgets over limit - needs attention`;
  } else {
    score = 4;
    details = `Most budgets exceeded - review spending`;
  }
  
  return { score, details };
};

/**
 * Calculate bill punctuality score (0-20 points)
 * 
 * Payment history is critical for financial health and credit scores
 * 
 * Scoring logic:
 * - All bills paid on time = 20 points
 * - 90-99% paid on time = 17 points
 * - 80-89% paid on time = 14 points
 * - 70-79% paid on time = 10 points
 * - 50-69% paid on time = 5 points
 * - <50% paid on time = 0 points
 */
const calculateBillPunctualityScore = (bills: Bill[]): { score: number; details: string } => {
  if (bills.length === 0) {
    return { score: 15, details: 'No bills tracked' };
  }
  
  const paidBills = bills.filter(b => b.isPaid);
  const paymentRate = paidBills.length / bills.length;
  const ratePercent = Math.round(paymentRate * 100);
  
  let score: number;
  let details: string;
  
  if (paymentRate >= 1.0) {
    score = 20;
    details = `All ${bills.length} bills paid`;
  } else if (paymentRate >= 0.90) {
    score = 17;
    details = `${ratePercent}% bills paid on time`;
  } else if (paymentRate >= 0.80) {
    score = 14;
    details = `${ratePercent}% bills paid - ${bills.length - paidBills.length} unpaid`;
  } else if (paymentRate >= 0.70) {
    score = 10;
    details = `${ratePercent}% bills paid - needs attention`;
  } else if (paymentRate >= 0.50) {
    score = 5;
    details = `Only ${ratePercent}% bills paid - urgent`;
  } else {
    score = 0;
    details = `Most bills unpaid - critical`;
  }
  
  return { score, details };
};

/**
 * Calculate debt-to-income ratio score (0-20 points)
 * 
 * DTI is a key metric used by lenders and financial advisors.
 * Monthly debt payments should ideally be <36% of gross income.
 * 
 * This estimates monthly debt obligations from total debt.
 * For credit cards: assumes minimum 2% of balance as monthly payment
 * For loans: would need actual payment data (future enhancement)
 * 
 * Scoring logic:
 * - DTI < 20% = 20 points (excellent)
 * - DTI 20-30% = 16 points (good)
 * - DTI 30-36% = 12 points (acceptable)
 * - DTI 36-43% = 8 points (concerning)
 * - DTI 43-50% = 4 points (problematic)
 * - DTI > 50% = 0 points (critical)
 */
const calculateDebtToIncomeScore = (
  monthlyIncome: number,
  totalDebt?: number,
  linkedAccounts?: LinkedAccount[]
): { score: number; details: string } => {
  // Calculate total debt from linked accounts if available
  let calculatedDebt = totalDebt || 0;
  
  if (!calculatedDebt && linkedAccounts) {
    // Sum negative balances (credit accounts)
    calculatedDebt = linkedAccounts
      .filter(a => a.accountType === 'credit' && a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  }
  
  if (monthlyIncome <= 0) {
    return { score: 0, details: 'No income to calculate DTI' };
  }
  
  if (calculatedDebt === 0) {
    return { score: 20, details: 'No debt recorded - excellent!' };
  }
  
  // Estimate monthly debt payment (2% of total balance - typical minimum payment)
  const estimatedMonthlyPayment = calculatedDebt * 0.02;
  const dti = estimatedMonthlyPayment / monthlyIncome;
  const dtiPercent = Math.round(dti * 100);
  
  let score: number;
  let details: string;
  
  if (dti < 0.20) {
    score = 20;
    details = `Excellent ${dtiPercent}% debt-to-income ratio`;
  } else if (dti < 0.30) {
    score = 16;
    details = `Good ${dtiPercent}% DTI - manageable debt level`;
  } else if (dti < 0.36) {
    score = 12;
    details = `${dtiPercent}% DTI - at recommended maximum`;
  } else if (dti < 0.43) {
    score = 8;
    details = `${dtiPercent}% DTI - above recommended level`;
  } else if (dti < 0.50) {
    score = 4;
    details = `${dtiPercent}% DTI - debt is concerning`;
  } else {
    score = 0;
    details = `${dtiPercent}% DTI - debt is critical`;
  }
  
  return { score, details };
};

/**
 * Calculate emergency fund score (0-15 points)
 * 
 * Financial experts recommend 3-6 months of expenses in liquid savings.
 * This measures how prepared the user is for unexpected expenses.
 * 
 * Scoring logic:
 * - 6+ months expenses saved = 15 points (excellent)
 * - 3-6 months expenses = 12 points (good)
 * - 1-3 months expenses = 8 points (building)
 * - 2 weeks - 1 month = 4 points (starting)
 * - < 2 weeks expenses = 0 points (vulnerable)
 */
const calculateEmergencyFundScore = (
  monthlyExpenses: number,
  liquidSavings?: number,
  linkedAccounts?: LinkedAccount[]
): { score: number; details: string } => {
  // Calculate liquid savings from accounts if not provided
  let calculatedSavings = liquidSavings || 0;
  
  if (!calculatedSavings && linkedAccounts) {
    calculatedSavings = linkedAccounts
      .filter(a => (a.accountType === 'checking' || a.accountType === 'savings') && a.balance > 0)
      .reduce((sum, a) => sum + a.balance, 0);
  }
  
  if (monthlyExpenses <= 0) {
    return { score: 7.5, details: 'No expense data for emergency fund calculation' };
  }
  
  if (calculatedSavings <= 0) {
    return { score: 0, details: 'No emergency savings detected' };
  }
  
  const monthsCovered = calculatedSavings / monthlyExpenses;
  
  let score: number;
  let details: string;
  
  if (monthsCovered >= 6) {
    score = 15;
    details = `${monthsCovered.toFixed(1)} months expenses saved - excellent`;
  } else if (monthsCovered >= 3) {
    score = 12;
    details = `${monthsCovered.toFixed(1)} months expenses saved - good`;
  } else if (monthsCovered >= 1) {
    score = 8;
    details = `${monthsCovered.toFixed(1)} months expenses saved - building`;
  } else if (monthsCovered >= 0.5) {
    score = 4;
    details = `${Math.round(monthsCovered * 4)} weeks of expenses saved`;
  } else {
    score = 0;
    details = `Less than 2 weeks expenses saved - vulnerable`;
  }
  
  return { score, details };
};

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the overall financial health score (0-100)
 * 
 * V2 Enhanced Algorithm includes:
 * - Savings Rate (25 points)
 * - Budget Adherence (20 points)
 * - Bill Punctuality (20 points)
 * - Debt-to-Income Ratio (20 points) - NEW
 * - Emergency Fund (15 points) - NEW
 * 
 * @param inputs - Financial data for the calculation
 * @returns A score from 0-100 representing financial health
 */
export const calculateFinancialHealthScore = (inputs: HealthScoreInputs): number => {
  const breakdown = getHealthScoreBreakdown(inputs);
  return breakdown.total;
};

/**
 * Get detailed breakdown of health score components
 * Useful for showing users which areas need improvement
 */
export const getHealthScoreBreakdown = (inputs: HealthScoreInputs): HealthScoreBreakdown => {
  const { 
    monthlyIncome, 
    monthlyExpenses, 
    budgets, 
    bills,
    totalDebt,
    liquidSavings,
    linkedAccounts,
  } = inputs;
  
  const savingsResult = calculateSavingsRateScore(monthlyIncome, monthlyExpenses);
  const budgetResult = calculateBudgetAdherenceScore(budgets);
  const billResult = calculateBillPunctualityScore(bills);
  const debtResult = calculateDebtToIncomeScore(monthlyIncome, totalDebt, linkedAccounts);
  const emergencyResult = calculateEmergencyFundScore(monthlyExpenses, liquidSavings, linkedAccounts);
  
  const totalScore = 
    savingsResult.score + 
    budgetResult.score + 
    billResult.score + 
    debtResult.score + 
    emergencyResult.score;
  
  return {
    total: Math.min(Math.max(Math.round(totalScore), 0), 100),
    savingsRate: { 
      score: savingsResult.score, 
      maxScore: 25, 
      details: savingsResult.details 
    },
    budgetAdherence: { 
      score: budgetResult.score, 
      maxScore: 20, 
      details: budgetResult.details 
    },
    billPunctuality: { 
      score: billResult.score, 
      maxScore: 20, 
      details: billResult.details 
    },
    debtToIncome: { 
      score: debtResult.score, 
      maxScore: 20, 
      details: debtResult.details 
    },
    emergencyFund: { 
      score: emergencyResult.score, 
      maxScore: 15, 
      details: emergencyResult.details 
    },
  };
};

/**
 * Get the health score category and label
 */
export const getHealthScoreInfo = (score: number): { label: string; color: string; emoji: string } => {
  if (score >= 85) {
    return { label: 'Excellent', color: '#00D9A5', emoji: '🌟' }; // mint
  }
  if (score >= 70) {
    return { label: 'Good', color: '#4ECDC4', emoji: '👍' }; // teal
  }
  if (score >= 50) {
    return { label: 'Fair', color: '#F39C12', emoji: '⚠️' }; // warning/orange
  }
  if (score >= 30) {
    return { label: 'Needs Work', color: '#E74C3C', emoji: '🔧' }; // red
  }
  return { label: 'Critical', color: '#FF3B5C', emoji: '🚨' }; // danger/red
};

/**
 * Get personalized improvement suggestions based on score breakdown
 */
export const getImprovementSuggestions = (breakdown: HealthScoreBreakdown): string[] => {
  const suggestions: string[] = [];
  
  // Check each category and suggest improvements for low scores
  if (breakdown.savingsRate.score < 18) {
    suggestions.push('Aim to save at least 20% of your income - start with small increases');
  }
  
  if (breakdown.budgetAdherence.score < 12) {
    suggestions.push('Review and adjust your budgets to be more realistic, or cut back on overspent categories');
  }
  
  if (breakdown.billPunctuality.score < 14) {
    suggestions.push('Set up automatic payments for recurring bills to avoid missed payments');
  }
  
  if (breakdown.debtToIncome.score < 12) {
    suggestions.push('Focus on paying down high-interest debt to improve your debt-to-income ratio');
  }
  
  if (breakdown.emergencyFund.score < 8) {
    suggestions.push('Build an emergency fund with 3-6 months of expenses for financial security');
  }
  
  return suggestions;
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
  
  // Check if debt changed
  const debtChanged = previousInputs.totalDebt !== currentInputs.totalDebt;
  
  // Check if savings changed
  const savingsChanged = previousInputs.liquidSavings !== currentInputs.liquidSavings;
  
  return incomeChange > incomeThreshold || 
         expenseChange > expenseThreshold || 
         billsChanged || 
         budgetsChanged ||
         debtChanged ||
         savingsChanged;
};
