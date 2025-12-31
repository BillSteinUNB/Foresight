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
  netWorth?: number;
  memberSince?: number;
}

// === Extended Types (Phase 2+) ===

export interface LinkedAccount {
  id: string;
  provider: 'plaid' | 'yodlee' | 'manual';
  institutionName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  lastFour: string;
  balance: number;
  lastSynced: string;
  logoUrl?: string;
}

export interface RecurringTransaction {
  id: string;
  baseTransactionId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  nextOccurrence: string;
  amount: number;
  merchantName: string;
  category: BudgetCategory;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  billReminders: boolean;
  spendingAlerts: boolean;
  weeklyDigest: boolean;
  insightAlerts: boolean;
}

export interface UserPreferences {
  currency: string;
  locale: string;
  notifications: NotificationSettings;
  privacyMode: boolean;
  biometricEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  aiInsightsEnabled: boolean;
}

export interface Space {
  id: string;
  name: string;
  members: SpaceMember[];
  budget: number;
  spent: number;
  category?: BudgetCategory;
  color: string;
  icon: string;
}

export interface SpaceMember {
  id: string;
  userId: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  avatarUrl?: string;
}

// Extended Transaction interface fields (to add to existing)
export interface TransactionExtended extends Transaction {
  geolocation?: { lat: number; lng: number };
  aiTags?: string[];
  isRecurring?: boolean;
  linkedAccountId?: string;
  receiptUrl?: string;
  notes?: string;
}

// Extended Insight interface fields (to add to existing)
export interface InsightExtended extends Insight {
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  expiresAt?: string;
  category?: 'saving' | 'spending' | 'income' | 'subscription' | 'bill';
}
