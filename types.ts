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
  notes?: string;
  receiptUri?: string; // Local file:// URI for receipt image
  isRecurring?: boolean; // Flag indicating this is part of a recurring pattern
  recurringGroupId?: string; // ID linking related recurring transactions
}

// Update type that excludes id (can't change id during edit)
export type TransactionUpdate = Partial<Omit<Transaction, 'id'>>;

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
  reminderNotificationIds?: string[]; // expo-notifications IDs for scheduled reminders
}

export interface CategoryBudget {
  id: string;
  category: BudgetCategory;
  monthlyLimit: number;
  currentSpent: number; // Computed from transactions
  alertThreshold: number; // 0.0 - 1.0, when to warn (e.g., 0.8 = 80%)
  isActive: boolean;
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
  firstName: string;
  name: string;
  avatarUri: string | null;
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

export interface BillReminderPreferences {
  enabled: boolean;
  daysBeforeDue: number; // e.g. 1, 3, 7
  timeOfDay: { hour: number; minute: number }; // schedule time (24h format)
}

export interface UserPreferences {
  currency: string;
  locale: string;
  notifications: NotificationSettings;
  privacyMode: boolean;
  biometricEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  aiInsightsEnabled: boolean;
  billReminder?: BillReminderPreferences;
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

// === Spending Trends Types ===

export type TrendPeriod = 'week' | 'month' | '3months' | 'year';
export type TrendGranularity = 'day' | 'week';

export interface TrendPoint {
  label: string;         // e.g. "Jan 3" or "Wk 2"
  startDate: string;     // ISO
  endDate: string;       // ISO
  totalExpense: number;
  byCategory: Partial<Record<BudgetCategory, number>>;
}

// === Subscription Types ===

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DetectedSubscription {
  id: string;
  merchantName: string;
  category: BudgetCategory;
  monthlyAmount: number;
  yearlyAmount: number;
  frequency: RecurringFrequency;
  nextBillingDate: string;
  transactionCount: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  confidence: number;
  status: 'active' | 'cancelled' | 'paused';
  tags: string[];
}

export interface SubscriptionOverlap {
  category: string;
  subscriptions: DetectedSubscription[];
  potentialSavings: number;
  description: string;
}
