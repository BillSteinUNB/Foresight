# A4Summary.md - Growth & Reliability Engineer

## Agent 4: The Growth & Reliability Engineer (Retention & Subscriptions)

---

## 1. PRO FRAMEWORK

### PaywallModal Component
**Location:** `components/PaywallModal.tsx`

A reusable modal component that gates Pro features and promotes upgrade to Foresight Pro.

#### Key Features:
- **Configurable content** based on feature type (`goals` or `bills`)
- **Usage indicator** showing current count vs. free limit
- **Benefits list** highlighting Pro features
- **Pricing display** ($4.99/month)
- **Moti animations** for smooth entrance/exit
- **Haptic feedback** on user interactions

#### Feature Configuration:
```typescript
const FEATURE_CONFIG = {
  goals: {
    title: 'Unlock Unlimited Goals',
    description: 'You\'ve reached the free limit of 3 savings goals...',
    icon: 'flag',
    benefits: [
      'Unlimited savings goals',
      'Advanced progress analytics',
      'Priority support',
      'Early access to new features',
    ],
  },
  bills: {
    title: 'Unlock Unlimited Bills',
    description: 'You\'ve reached the free limit of 3 bills...',
    icon: 'receipt',
    benefits: [
      'Unlimited bill tracking',
      'Smart payment reminders',
      'Bill comparison insights',
      'Export your data',
    ],
  },
};
```

### Pro Gating Logic
**Location:** `screens/Dashboard.tsx`

#### Limits:
- **Goals Limit:** 3 free goals
- **Bills Limit:** 3 free bills

#### Implementation:
```typescript
// Constants defined at module level
const GOAL_LIMIT = 3;
const BILL_LIMIT = 3;

// Computed in component body
const showPaywallForGoals = goals.length >= GOAL_LIMIT;
const showPaywallForBills = bills.length >= BILL_LIMIT;

// Paywall state
const [paywallFeature, setPaywallFeature] = useState<'goals' | 'bills' | null>(null);

// Paywall check before opening modals
const handleAddBill = useCallback(() => {
  if (showPaywallForBills) {
    setPaywallFeature('bills');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  setEditingBill(null);
  setIsBillModalOpen(true);
}, [showPaywallForBills]);

const handleOpenGoalsModal = useCallback(() => {
  if (showPaywallForGoals) {
    setPaywallFeature('goals');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }
  setIsAddGoalOpen(true);
}, [showPaywallForGoals]);
```

#### User Experience:
1. User clicks "+ Add" button for goals or bills
2. If limit is reached, haptic warning is triggered
3. PaywallModal appears with:
   - Clear explanation of the limit
   - Visual usage indicator (e.g., "3 of 3 free goals used")
   - List of Pro benefits
   - Pricing information
   - "Upgrade to Pro" and "Maybe Later" options
4. User can dismiss or proceed to upgrade flow

---

## 2. WEEKLY DIGEST NOTIFICATION

### Sunday Summary Implementation
**Location:** `utils/notifications.ts`

#### Functions Added:

1. **`calculateWeeklySpending(transactions)`**
   - Calculates total spending for the current week (Monday-Sunday)
   - Filters transactions by date range
   - Returns spending total

2. **`getWeeklyBudgetStatus(weeklySpending, monthlyBudget)`**
   - Computes weekly limit (monthly budget / 4)
   - Calculates remaining budget
   - Determines status: `'on-track' | 'warning' | 'over'`
   - Returns budget status object

3. **`configureWeeklyDigestChannel()`**
   - Creates Android notification channel for weekly summaries
   - Sets importance, vibration pattern, and description

4. **`getNextSunday(hour, minute)`**
   - Calculates the next Sunday at specified time
   - Default: Sunday at 9:00 AM

5. **`scheduleWeeklyDigest(weeklySpending, monthlyBudget)`**
   - Checks notification permissions
   - Configures notification channel
   - Generates notification content based on budget status:
     - **Over budget:** "🚨 Weekly Budget Alert" with red warning
     - **Warning (80%+):** "⚠️ Weekly Budget Update" with orange warning
     - **On track:** "📊 Weekly Summary" with green positive message
   - Schedules for next Sunday at 9:00 AM
   - Returns notification ID

6. **`cancelWeeklyDigest()`**
   - Cancels any existing weekly digest notifications

7. **`rescheduleWeeklyDigest(weeklySpending, monthlyBudget)`**
   - Convenience function to cancel and reschedule

### Notification Schedule:
- **Trigger Time:** Every Sunday at 9:00 AM
- **Channel:** `weekly-digest` (Android) / Default (iOS)
- **Sound:** Enabled
- **Alert Type:** Banner and list

#### Notification Content Examples:

**On Track:**
```
Title: 📊 Weekly Summary
Body: Great job! You've spent $250.00 this week, which is 50% of your weekly budget. $250.00 remaining.
```

**Warning (80%+):**
```
Title: ⚠️ Weekly Budget Update
Body: You've spent $400.00 (80% of your weekly budget). $100.00 remaining this week.
```

**Over Budget:**
```
Title: 🚨 Weekly Budget Alert
Body: You've spent $550.00 this week, exceeding your weekly limit of $500.00. Time to review your spending?
```

---

## 3. REMINDER HYDRATION FIX

### Bug Analysis
**Problem:** Bill reminders disappear after app restart because:
1. Notification IDs are stored in memory (not persisted)
2. When app restarts, notification IDs are lost
3. Reminders are only scheduled when bills are created/updated

### Solution Implemented
**Location:** `App.tsx`

#### Logic:
```typescript
// Re-schedule bill reminders after store hydration
useEffect(() => {
  const hydrateReminders = async () => {
    if (!isHydrated) return;

    const reminderPrefs = preferences.billReminder || DEFAULT_BILL_REMINDER_PREFS;
    
    if (!reminderPrefs.enabled) {
      return;
    }

    // Get all unpaid bills that need reminders
    const unpaidBills = bills.filter((bill) => !bill.isPaid);
    
    for (const bill of unpaidBills) {
      // Only re-schedule if no notification IDs exist
      const needsReschedule = !bill.reminderNotificationIds?.length;
      
      if (needsReschedule) {
        const notificationIds = await scheduleBillReminder(bill, reminderPrefs);
        
        if (notificationIds.length > 0) {
          // Update the bill store with notification IDs
          useBillStore.setState((state) => ({
            bills: state.bills.map((b) =>
              b.id === bill.id
                ? { ...b, reminderNotificationIds: notificationIds }
                : b
            ),
          }));
        }
      }
    }
  };

  hydrateReminders();
}, [isHydrated, bills, preferences.billReminder]);
```

#### Flow:
1. App starts → Stores hydrate from persistence
2. Once hydration complete (`isHydrated === true`)
3. Effect triggers → Iterates through all unpaid bills
4. For each bill without scheduled notifications:
   - Schedule new reminder using user's preferences
   - Update bill store with notification IDs (persisted to storage)
5. Future app restarts → Notification IDs are preserved in storage

---

## 4. VERIFICATION CHECKLIST

### Paywall Feature
- [x] PaywallModal component created
- [x] Import added to Dashboard.tsx
- [x] Paywall state management implemented
- [x] Goal limit check (3 goals)
- [x] Bill limit check (3 bills)
- [x] Modal displays correct content for each feature
- [x] Usage indicator shows current vs. limit
- [x] Benefits list displays Pro features
- [x] Pricing displayed ($4.99/month)
- [x] Haptic feedback on paywall trigger
- [x] Modal can be dismissed
- [x] Upgrade flow placeholder ready

### Weekly Digest Notification
- [x] `calculateWeeklySpending()` function implemented
- [x] `getWeeklyBudgetStatus()` function implemented
- [x] `configureWeeklyDigestChannel()` function implemented
- [x] `getNextSunday()` helper function implemented
- [x] `scheduleWeeklyDigest()` function implemented
- [x] Content varies based on budget status (on-track/warning/over)
- [x] `cancelWeeklyDigest()` function implemented
- [x] `rescheduleWeeklyDigest()` function implemented
- [x] Notification channel configured
- [x] Recurring schedule for Sunday 9:00 AM

### Reminder Hydration
- [x] Import `scheduleBillReminder` in App.tsx
- [x] Import `useBillStore` in App.tsx
- [x] Subscribe to bills from store
- [x] Effect runs after hydration
- [x] Checks unpaid bills for missing notification IDs
- [x] Re-schedules reminders using user preferences
- [x] Updates store with persisted notification IDs
- [x] Logs re-scheduling for debugging

---

## 5. FILES MODIFIED/CREATED

| File | Action | Purpose |
|------|--------|---------|
| `components/PaywallModal.tsx` | Created | Reusable paywall modal component |
| `screens/Dashboard.tsx` | Modified | Added Pro gating logic and PaywallModal |
| `utils/notifications.ts` | Modified | Added Sunday Summary notification functions |
| `App.tsx` | Modified | Added reminder hydration fix |

---

## 6. NOTES FOR FUTURE IMPLEMENTATION

### Paywall Integration
The PaywallModal currently has a placeholder for the upgrade flow. When implementing actual subscriptions:
1. Integrate with Expo In-App Purchases or RevenueCat
2. Track Pro status in user preferences
3. Store subscription status in Supabase
4. Restore purchases on app reinstall

### Weekly Digest Enhancement
Consider adding:
- Option to customize notification day/time
- More detailed spending breakdown in notification
- Links to insights/screens from notification
- Category-specific spending highlights

### Notification Persistence
The reminder hydration fix stores notification IDs in the bill store, which is persisted. This ensures:
- Notification IDs survive app restarts
- We don't schedule duplicate notifications
- Users don't miss bill reminders after updates
