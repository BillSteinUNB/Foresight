export type BudgetCategory = 
  | 'food_dining'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'bills_utilities'
  | 'health_fitness'
  | 'travel'
  | 'income'
  | 'subscriptions'
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  date: string; // ISO String
  merchantName: string;
  category: BudgetCategory;
  merchantLogo?: string;
  status?: 'pending' | 'completed';
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date
  isPaid: boolean;
  status: 'safe' | 'warning' | 'danger'; // proximity to due date
}

export interface Insight {
  id: string;
  type: 'alert' | 'subscription' | 'pattern' | 'positive' | 'prediction' | 'opportunity';
  title: string;
  description: string;
  data?: {
    amount?: number;
    saved?: number;
    comparison?: string;
  };
  isRead: boolean;
}

export interface User {
  name: string;
  safeToSpend: number;
  balance: number;
  financialHealthScore: number;
  currency: string;
}
