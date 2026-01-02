import { BudgetCategory } from '../types';

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a transaction input
 */
export const validateTransactionInput = (
  merchantName: string,
  amount: number
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate merchant name
  if (!merchantName || !merchantName.trim()) {
    errors.push({
      field: 'merchantName',
      message: 'Merchant name is required',
    });
  } else if (merchantName.trim().length < 2) {
    errors.push({
      field: 'merchantName',
      message: 'Merchant name must be at least 2 characters',
    });
  }

  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a valid number',
    });
  } else if (amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount must be greater than 0',
    });
  } else if (amount > 999999.99) {
    errors.push({
      field: 'amount',
      message: 'Amount is too large',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate a bill input
 */
export const validateBillInput = (
  name: string,
  amount: number,
  dueDate: string
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!name || !name.trim()) {
    errors.push({
      field: 'name',
      message: 'Bill name is required',
    });
  } else if (name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Bill name must be at least 2 characters',
    });
  }

  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a valid number',
    });
  } else if (amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Amount must be greater than 0',
    });
  } else if (amount > 999999.99) {
    errors.push({
      field: 'amount',
      message: 'Amount is too large',
    });
  }

  // Validate due date
  if (!dueDate) {
    errors.push({
      field: 'dueDate',
      message: 'Due date is required',
    });
  } else {
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      errors.push({
        field: 'dueDate',
        message: 'Invalid due date format',
      });
      // Don't check past date if the date is invalid
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Allow bills to be due in the past for backdating, but warn
      // For new bills, we might want to require future dates
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (dueDateObj < oneYearAgo) {
        errors.push({
          field: 'dueDate',
          message: 'Due date is too far in the past',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate a goal input
 */
export const validateGoalInput = (
  name: string,
  targetAmount: number,
  currentAmount?: number
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!name || !name.trim()) {
    errors.push({
      field: 'name',
      message: 'Goal name is required',
    });
  } else if (name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Goal name must be at least 2 characters',
    });
  }

  // Validate target amount
  if (typeof targetAmount !== 'number' || isNaN(targetAmount)) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be a valid number',
    });
  } else if (targetAmount <= 0) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount must be greater than 0',
    });
  } else if (targetAmount > 999999999) {
    errors.push({
      field: 'targetAmount',
      message: 'Target amount is too large',
    });
  }

  // Validate current amount (optional but must be valid if provided)
  if (currentAmount !== undefined && currentAmount !== null) {
    if (typeof currentAmount !== 'number' || isNaN(currentAmount)) {
      errors.push({
        field: 'currentAmount',
        message: 'Current amount must be a valid number',
      });
    } else if (currentAmount < 0) {
      errors.push({
        field: 'currentAmount',
        message: 'Current amount cannot be negative',
      });
    } else if (currentAmount > targetAmount) {
      errors.push({
        field: 'currentAmount',
        message: 'Current amount cannot exceed target amount',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate a budget input
 */
export const validateBudgetInput = (
  category: BudgetCategory,
  monthlyLimit: number,
  alertThreshold: number
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate category
  if (!category) {
    errors.push({
      field: 'category',
      message: 'Category is required',
    });
  }

  // Validate monthly limit
  if (typeof monthlyLimit !== 'number' || isNaN(monthlyLimit)) {
    errors.push({
      field: 'monthlyLimit',
      message: 'Monthly limit must be a valid number',
    });
  } else if (monthlyLimit <= 0) {
    errors.push({
      field: 'monthlyLimit',
      message: 'Monthly limit must be greater than 0',
    });
  } else if (monthlyLimit > 999999) {
    errors.push({
      field: 'monthlyLimit',
      message: 'Monthly limit is too large',
    });
  }

  // Validate alert threshold
  if (typeof alertThreshold !== 'number' || isNaN(alertThreshold)) {
    errors.push({
      field: 'alertThreshold',
      message: 'Alert threshold must be a valid number',
    });
  } else if (alertThreshold < 0 || alertThreshold > 1) {
    errors.push({
      field: 'alertThreshold',
      message: 'Alert threshold must be between 0 and 1',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
