import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Bill, BillReminderPreferences } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns true if permissions granted
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Configure Android notification channel for bill reminders
 */
export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('bill-reminders', {
      name: 'Bill Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D9A5',
      description: 'Reminders for upcoming bill payments',
    });
  }
}

/**
 * Schedule a bill reminder notification
 * @param bill The bill to schedule reminders for
 * @param prefs User's reminder preferences
 * @returns Array of notification IDs that were scheduled
 */
export async function scheduleBillReminder(
  bill: Bill,
  prefs: BillReminderPreferences
): Promise<string[]> {
  if (!prefs.enabled || bill.isPaid) {
    return [];
  }

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return [];
  }

  await configureAndroidChannel();

  const dueDate = new Date(bill.dueDate);
  const notificationIds: string[] = [];

  // Calculate reminder date (X days before due date)
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - prefs.daysBeforeDue);
  reminderDate.setHours(prefs.timeOfDay.hour, prefs.timeOfDay.minute, 0, 0);

  // Only schedule if reminder date is in the future
  const now = new Date();
  if (reminderDate > now) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Bill Reminder',
          body: `${bill.name} ($${bill.amount.toFixed(2)}) is due ${prefs.daysBeforeDue === 1 ? 'tomorrow' : `in ${prefs.daysBeforeDue} days`}`,
          data: { billId: bill.id, type: 'bill-reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: Platform.OS === 'android' ? 'bill-reminders' : undefined,
        },
      });
      notificationIds.push(notificationId);
    } catch (error) {
      console.error('Failed to schedule bill reminder:', error);
    }
  }

  // Also schedule a same-day reminder if due date is in the future
  const sameDayReminder = new Date(dueDate);
  sameDayReminder.setHours(prefs.timeOfDay.hour, prefs.timeOfDay.minute, 0, 0);

  if (sameDayReminder > now && prefs.daysBeforeDue > 0) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Bill Due Today',
          body: `${bill.name} ($${bill.amount.toFixed(2)}) is due today!`,
          data: { billId: bill.id, type: 'bill-due-today' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: sameDayReminder,
          channelId: Platform.OS === 'android' ? 'bill-reminders' : undefined,
        },
      });
      notificationIds.push(notificationId);
    } catch (error) {
      console.error('Failed to schedule same-day reminder:', error);
    }
  }

  return notificationIds;
}

/**
 * Cancel scheduled notifications by their IDs
 * @param notificationIds Array of notification IDs to cancel
 */
export async function cancelNotifications(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.warn(`Failed to cancel notification ${id}:`, error);
    }
  }
}

/**
 * Cancel all scheduled bill reminder notifications
 */
export async function cancelAllBillReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const billReminders = scheduled.filter(
    n => n.content.data?.type === 'bill-reminder' || n.content.data?.type === 'bill-due-today'
  );
  
  for (const notification of billReminders) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

/**
 * Get all currently scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Default bill reminder preferences
 */
export const DEFAULT_BILL_REMINDER_PREFS: BillReminderPreferences = {
  enabled: true,
  daysBeforeDue: 3,
  timeOfDay: { hour: 9, minute: 0 }, // 9:00 AM
};

// === Weekly Digest (Sunday Summary) Functions ===

/**
 * Calculate spending for the current week (Monday to Sunday)
 * @param transactions Array of transactions
 * @returns Total spending amount for the week
 */
export function calculateWeeklySpending(
  transactions: Array<{ date: string; type: 'expense' | 'income'; amount: number }>
): number {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDay + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calculate the end of the week (Sunday)
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() - currentDay + 7);
  weekEnd.setHours(23, 59, 59, 999);
  
  return transactions
    .filter(t => {
      const txDate = new Date(t.date);
      return (
        t.type === 'expense' &&
        txDate >= weekStart &&
        txDate <= weekEnd
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get budget status for weekly spending
 * @param weeklySpending Total spending for the week
 * @param monthlyBudget Total monthly budget
 * @returns Object with budget status information
 */
export function getWeeklyBudgetStatus(
  weeklySpending: number,
  monthlyBudget: number
): {
  weeklyLimit: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  status: 'on-track' | 'warning' | 'over';
} {
  // Weekly limit is approximately monthly budget / 4
  const weeklyLimit = monthlyBudget / 4;
  const remaining = weeklyLimit - weeklySpending;
  const percentageUsed = weeklyLimit > 0 ? (weeklySpending / weeklyLimit) * 100 : 0;
  
  let status: 'on-track' | 'warning' | 'over' = 'on-track';
  if (percentageUsed >= 100) {
    status = 'over';
  } else if (percentageUsed >= 80) {
    status = 'warning';
  }
  
  return {
    weeklyLimit,
    remaining,
    percentageUsed,
    isOverBudget: percentageUsed >= 100,
    status,
  };
}

/**
 * Configure Android notification channel for weekly digest
 */
export async function configureWeeklyDigestChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('weekly-digest', {
      name: 'Weekly Summary',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D9A5',
      description: 'Your weekly spending summary and financial insights',
    });
  }
}

/**
 * Get the next Sunday at a specified time
 * @param hour Hour of the day (24-hour format)
 * @param minute Minute of the hour
 * @returns Date object for the next Sunday
 */
function getNextSunday(hour: number = 9, minute: number = 0): Date {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
  
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(hour, minute, 0, 0);
  
  return nextSunday;
}

/**
 * Schedule a weekly digest (Sunday Summary) notification
 * @param weeklySpending Total spending for the week
 * @param monthlyBudget Total monthly budget
 * @returns Notification ID or null if scheduling failed
 */
export async function scheduleWeeklyDigest(
  weeklySpending: number,
  monthlyBudget: number
): Promise<string | null> {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return null;
  }

  await configureWeeklyDigestChannel();

  const budgetStatus = getWeeklyBudgetStatus(weeklySpending, monthlyBudget);
  
  // Generate notification content based on budget status
  let title: string;
  let body: string;
  
  if (budgetStatus.status === 'over') {
    title = '🚨 Weekly Budget Alert';
    body = `You've spent $${weeklySpending.toFixed(2)} this week, exceeding your weekly limit of $${budgetStatus.weeklyLimit.toFixed(2)}. Time to review your spending?`;
  } else if (budgetStatus.status === 'warning') {
    title = '⚠️ Weekly Budget Update';
    body = `You've spent $${weeklySpending.toFixed(2)} (${budgetStatus.percentageUsed.toFixed(0)}% of your weekly budget). $${budgetStatus.remaining.toFixed(2)} remaining this week.`;
  } else {
    title = '📊 Weekly Summary';
    body = `Great job! You've spent $${weeklySpending.toFixed(2)} this week, which is ${budgetStatus.percentageUsed.toFixed(0)}% of your weekly budget. $${budgetStatus.remaining.toFixed(2)} remaining.`;
  }

  const nextSunday = getNextSunday(9, 0); // Sunday at 9:00 AM

  // Only schedule if the next Sunday is in the future
  const now = new Date();
  if (nextSunday <= now) {
    console.warn('Next Sunday is in the past, not scheduling');
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'weekly-digest' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextSunday,
        channelId: Platform.OS === 'android' ? 'weekly-digest' : undefined,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule weekly digest:', error);
    return null;
  }
}

/**
 * Cancel the weekly digest notification
 */
export async function cancelWeeklyDigest(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const weeklyDigest = scheduled.filter(
    n => n.content.data?.type === 'weekly-digest'
  );
  
  for (const notification of weeklyDigest) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

/**
 * Reschedule weekly digest notification
 */
export async function rescheduleWeeklyDigest(
  weeklySpending: number,
  monthlyBudget: number
): Promise<void> {
  await cancelWeeklyDigest();
  await scheduleWeeklyDigest(weeklySpending, monthlyBudget);
}
