import { Transaction, SavingsGoal, Bill, Insight, User, LinkedAccount, UserPreferences } from './types';

export const USER: User = {
  name: "Alex",
  safeToSpend: 2847.00,
  balance: 4782.45,
  financialHealthScore: 78,
  currency: "USD",
  netWorth: 34500,
  memberSince: 2024
};

export const LINKED_ACCOUNTS: LinkedAccount[] = [
  {
    id: 'acc1',
    provider: 'plaid',
    institutionName: 'Chase',
    accountType: 'checking',
    lastFour: '4521',
    balance: 4782.45,
    lastSynced: new Date().toISOString(),
    logoUrl: 'https://logo.clearbit.com/chase.com'
  },
  {
    id: 'acc2',
    provider: 'plaid',
    institutionName: 'American Express',
    accountType: 'credit',
    lastFour: '1008',
    balance: -1247.82,
    lastSynced: new Date(Date.now() - 3600000).toISOString(),
    logoUrl: 'https://logo.clearbit.com/americanexpress.com'
  }
];

export const USER_PREFERENCES: UserPreferences = {
  currency: 'USD',
  locale: 'en-US',
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    billReminders: true,
    spendingAlerts: true,
    weeklyDigest: false,
    insightAlerts: true
  },
  privacyMode: false,
  biometricEnabled: true,
  theme: 'dark',
  aiInsightsEnabled: true
};

export const TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    amount: 6.50,
    type: 'expense',
    date: new Date().toISOString(),
    merchantName: 'Starbucks',
    category: 'food_dining',
    merchantLogo: 'https://logo.clearbit.com/starbucks.com'
  },
  {
    id: 't2',
    amount: 84.32,
    type: 'expense',
    date: new Date().toISOString(),
    merchantName: 'Whole Foods Market',
    category: 'food_dining',
    merchantLogo: 'https://logo.clearbit.com/wholefoodsmarket.com'
  },
  {
    id: 't3',
    amount: 2600.00,
    type: 'income',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    merchantName: 'ACME Corp',
    category: 'income',
  },
  {
    id: 't4',
    amount: 32.00,
    type: 'expense',
    date: new Date(Date.now() - 86400000).toISOString(),
    merchantName: "Domino's Pizza",
    category: 'food_dining',
    merchantLogo: 'https://logo.clearbit.com/dominos.com'
  },
  {
    id: 't5',
    amount: 15.99,
    type: 'expense',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    merchantName: 'Netflix',
    category: 'subscriptions',
    merchantLogo: 'https://logo.clearbit.com/netflix.com'
  },
  {
    id: 't6',
    amount: 34.00,
    type: 'expense',
    date: new Date(Date.now() - 172800000).toISOString(),
    merchantName: 'Uber',
    category: 'transportation',
    merchantLogo: 'https://logo.clearbit.com/uber.com'
  },
  {
    id: 't7',
    amount: 120.00,
    type: 'expense',
    date: new Date(Date.now() - 259200000).toISOString(),
    merchantName: 'Target',
    category: 'shopping',
    merchantLogo: 'https://logo.clearbit.com/target.com'
  },
];

export const GOALS: SavingsGoal[] = [
  {
    id: 'g1',
    name: 'Vacation',
    icon: '🏖️',
    targetAmount: 5000,
    currentAmount: 3900,
    color: '#00D9A5'
  },
  {
    id: 'g2',
    name: 'New Car',
    icon: '🚗',
    targetAmount: 25000,
    currentAmount: 8500,
    color: '#4ECDC4'
  },
  {
    id: 'g3',
    name: 'Home',
    icon: '🏠',
    targetAmount: 50000,
    currentAmount: 6000,
    color: '#3498DB'
  }
];

export const BILLS: Bill[] = [
  {
    id: 'b1',
    name: 'Rent',
    amount: 1800.00,
    dueDate: new Date(Date.now() + 172800000).toISOString(), // +2 days
    isPaid: false,
    status: 'danger'
  },
  {
    id: 'b2',
    name: 'Netflix',
    amount: 15.99,
    dueDate: new Date(Date.now() + 345600000).toISOString(), // +4 days
    isPaid: false,
    status: 'warning'
  },
  {
    id: 'b3',
    name: 'Electric',
    amount: 120.00,
    dueDate: new Date(Date.now() + 691200000).toISOString(), // +8 days
    isPaid: false,
    status: 'safe'
  }
];

export const INSIGHTS: Insight[] = [
  {
    id: 'i1',
    type: 'subscription',
    title: 'Subscription Overlap',
    description: 'You have 3 streaming services with overlapping content. Canceling one could save you money.',
    data: { saved: 180 },
    isRead: false
  },
  {
    id: 'i2',
    type: 'alert',
    title: 'Uber Spending Alert',
    description: "You've spent $420 on Uber this month. That's 40% more than your average.",
    data: { amount: 420 },
    isRead: false
  },
  {
    id: 'i3',
    type: 'positive',
    title: 'Grocery Win',
    description: "Great job! Your grocery spending is down 15% this month compared to last month.",
    isRead: true
  },
  {
    id: 'i4',
    type: 'prediction',
    title: 'Upcoming Cashflow Warning',
    description: "Heads up! Rent and car payment hit on Jan 1st. Limit spending to $42/day.",
    isRead: false
  }
];
