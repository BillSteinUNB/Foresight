import { supabase } from './supabase';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useBillStore } from '../stores/useBillStore';
import { useInsightStore } from '../stores/useInsightStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useUserStore } from '../stores/useUserStore';
import { Transaction, SavingsGoal, Bill, Insight, CategoryBudget } from '../types';

/**
 * Sync service for bidirectional data synchronization between
 * local Zustand stores and Supabase cloud database.
 * 
 * Strategy: Last-write-wins with local-first approach.
 * - Local changes are pushed to cloud
 * - On app start/refresh, cloud data is pulled and merged
 */

// ============================================
// TYPE MAPPINGS (camelCase <-> snake_case)
// ============================================

const mapTransactionToDb = (tx: Transaction, userId: string) => ({
  id: tx.id,
  user_id: userId,
  amount: tx.amount,
  type: tx.type,
  date: tx.date,
  merchant_name: tx.merchantName,
  category: tx.category,
  merchant_logo: tx.merchantLogo || null,
  status: tx.status || 'completed',
  notes: tx.notes || null,
  receipt_uri: tx.receiptUri || null,
  is_recurring: tx.isRecurring || false,
  recurring_group_id: tx.recurringGroupId || null,
});

const mapTransactionFromDb = (row: any): Transaction => ({
  id: row.id,
  amount: parseFloat(row.amount),
  type: row.type,
  date: row.date,
  merchantName: row.merchant_name,
  category: row.category,
  merchantLogo: row.merchant_logo,
  status: row.status,
  notes: row.notes,
  receiptUri: row.receipt_uri,
  isRecurring: row.is_recurring,
  recurringGroupId: row.recurring_group_id,
});

const mapGoalToDb = (goal: SavingsGoal, userId: string) => ({
  id: goal.id,
  user_id: userId,
  name: goal.name,
  icon: goal.icon,
  target_amount: goal.targetAmount,
  current_amount: goal.currentAmount,
  color: goal.color,
});

const mapGoalFromDb = (row: any): SavingsGoal => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  targetAmount: parseFloat(row.target_amount),
  currentAmount: parseFloat(row.current_amount),
  color: row.color,
});

const mapBillToDb = (bill: Bill, userId: string) => ({
  id: bill.id,
  user_id: userId,
  name: bill.name,
  amount: bill.amount,
  due_date: bill.dueDate,
  is_paid: bill.isPaid,
  status: bill.status,
});

const mapBillFromDb = (row: any): Bill => ({
  id: row.id,
  name: row.name,
  amount: parseFloat(row.amount),
  dueDate: row.due_date,
  isPaid: row.is_paid,
  status: row.status,
});

const mapInsightToDb = (insight: Insight, userId: string) => ({
  id: insight.id,
  user_id: userId,
  type: insight.type,
  title: insight.title,
  description: insight.description,
  data: insight.data || null,
  is_read: insight.isRead,
});

const mapInsightFromDb = (row: any): Insight => ({
  id: row.id,
  type: row.type,
  title: row.title,
  description: row.description,
  data: row.data,
  isRead: row.is_read,
});

const mapBudgetToDb = (budget: CategoryBudget, userId: string) => ({
  id: budget.id,
  user_id: userId,
  category: budget.category,
  monthly_limit: budget.monthlyLimit,
  alert_threshold: budget.alertThreshold,
  is_active: budget.isActive,
});

const mapBudgetFromDb = (row: any): CategoryBudget => ({
  id: row.id,
  category: row.category,
  monthlyLimit: parseFloat(row.monthly_limit),
  currentSpent: 0, // Computed from transactions, not stored
  alertThreshold: parseFloat(row.alert_threshold),
  isActive: row.is_active,
});

// ============================================
// SYNC FUNCTIONS
// ============================================

export const syncService = {
  /**
   * Pull all user data from Supabase and update local stores
   */
  async pullAll(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch all data in parallel
      const [
        transactionsRes,
        goalsRes,
        billsRes,
        insightsRes,
        budgetsRes,
        profileRes,
        prefsRes,
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('insights').select('*').eq('user_id', userId),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_preferences').select('*').eq('id', userId).single(),
      ]);

      // Check for errors
      if (transactionsRes.error) throw transactionsRes.error;
      if (goalsRes.error) throw goalsRes.error;
      if (billsRes.error) throw billsRes.error;
      if (insightsRes.error) throw insightsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;

      // Update local stores
      if (transactionsRes.data?.length) {
        useTransactionStore.getState().setTransactions(
          transactionsRes.data.map(mapTransactionFromDb)
        );
      }

      if (goalsRes.data?.length) {
        useGoalStore.getState().setGoals(
          goalsRes.data.map(mapGoalFromDb)
        );
      }

      if (billsRes.data?.length) {
        useBillStore.getState().setBills(
          billsRes.data.map(mapBillFromDb)
        );
      }

      if (insightsRes.data?.length) {
        useInsightStore.getState().setInsights(
          insightsRes.data.map(mapInsightFromDb)
        );
      }

      if (budgetsRes.data?.length) {
        useBudgetStore.getState().setBudgets(
          budgetsRes.data.map(mapBudgetFromDb)
        );
      }

      // Update user profile if exists
      if (profileRes.data) {
        useUserStore.getState().updateUser({
          name: profileRes.data.name || '',
          currency: profileRes.data.currency || 'USD',
        });
      }

      // Update preferences if exists
      if (prefsRes.data) {
        useUserStore.getState().updatePreferences({
          privacyMode: prefsRes.data.privacy_mode,
          biometricEnabled: prefsRes.data.biometric_enabled,
          theme: prefsRes.data.theme,
          aiInsightsEnabled: prefsRes.data.ai_insights_enabled,
          notifications: prefsRes.data.notifications,
          billReminder: prefsRes.data.bill_reminder,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Sync pull error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync data' 
      };
    }
  },

  /**
   * Push all local data to Supabase (full sync)
   */
  async pushAll(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const transactions = useTransactionStore.getState().transactions;
      const goals = useGoalStore.getState().goals;
      const bills = useBillStore.getState().bills;
      const insights = useInsightStore.getState().insights;
      const budgets = useBudgetStore.getState().budgets;
      const { user, preferences } = useUserStore.getState();

      // Upsert all data in parallel
      const results = await Promise.all([
        // Transactions
        transactions.length > 0
          ? supabase.from('transactions').upsert(
              transactions.map(tx => mapTransactionToDb(tx, userId)),
              { onConflict: 'id' }
            )
          : Promise.resolve({ error: null }),

        // Goals
        goals.length > 0
          ? supabase.from('goals').upsert(
              goals.map(g => mapGoalToDb(g, userId)),
              { onConflict: 'id' }
            )
          : Promise.resolve({ error: null }),

        // Bills
        bills.length > 0
          ? supabase.from('bills').upsert(
              bills.map(b => mapBillToDb(b, userId)),
              { onConflict: 'id' }
            )
          : Promise.resolve({ error: null }),

        // Insights
        insights.length > 0
          ? supabase.from('insights').upsert(
              insights.map(i => mapInsightToDb(i, userId)),
              { onConflict: 'id' }
            )
          : Promise.resolve({ error: null }),

        // Budgets
        budgets.length > 0
          ? supabase.from('budgets').upsert(
              budgets.map(b => mapBudgetToDb(b, userId)),
              { onConflict: 'id' }
            )
          : Promise.resolve({ error: null }),

        // Profile
        supabase.from('profiles').upsert({
          id: userId,
          name: user.name,
          currency: preferences.currency,
          locale: preferences.locale,
        }, { onConflict: 'id' }),

        // Preferences
        supabase.from('user_preferences').upsert({
          id: userId,
          notifications: preferences.notifications,
          privacy_mode: preferences.privacyMode,
          biometric_enabled: preferences.biometricEnabled,
          theme: preferences.theme,
          ai_insights_enabled: preferences.aiInsightsEnabled,
          bill_reminder: preferences.billReminder,
        }, { onConflict: 'id' }),
      ]);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Sync push errors:', errors);
        throw new Error('Failed to sync some data');
      }

      return { success: true };
    } catch (error) {
      console.error('Sync push error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync data' 
      };
    }
  },

  // ============================================
  // INDIVIDUAL ENTITY SYNC (for real-time updates)
  // ============================================

  async upsertTransaction(transaction: Transaction, userId: string) {
    const { error } = await supabase
      .from('transactions')
      .upsert(mapTransactionToDb(transaction, userId), { onConflict: 'id' });
    
    if (error) console.error('Failed to sync transaction:', error);
    return !error;
  },

  async deleteTransaction(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    
    if (error) console.error('Failed to delete transaction:', error);
    return !error;
  },

  async upsertGoal(goal: SavingsGoal, userId: string) {
    const { error } = await supabase
      .from('goals')
      .upsert(mapGoalToDb(goal, userId), { onConflict: 'id' });
    
    if (error) console.error('Failed to sync goal:', error);
    return !error;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);
    
    if (error) console.error('Failed to delete goal:', error);
    return !error;
  },

  async upsertBill(bill: Bill, userId: string) {
    const { error } = await supabase
      .from('bills')
      .upsert(mapBillToDb(bill, userId), { onConflict: 'id' });
    
    if (error) console.error('Failed to sync bill:', error);
    return !error;
  },

  async deleteBill(billId: string) {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);
    
    if (error) console.error('Failed to delete bill:', error);
    return !error;
  },

  /**
   * Delete all user data (for account deletion)
   */
  async deleteAllUserData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('goals').delete().eq('user_id', userId),
        supabase.from('bills').delete().eq('user_id', userId),
        supabase.from('insights').delete().eq('user_id', userId),
        supabase.from('budgets').delete().eq('user_id', userId),
        supabase.from('user_preferences').delete().eq('id', userId),
        supabase.from('profiles').delete().eq('id', userId),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete data' 
      };
    }
  },
};

export default syncService;
