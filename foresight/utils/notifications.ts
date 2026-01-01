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
