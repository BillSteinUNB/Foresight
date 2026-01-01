import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Bill, BillReminderPreferences } from '../types';
import { zustandStorage, getStorageKey } from './storage';
import { getBillStatus } from '../utils/billUtils';
import { scheduleBillReminder, cancelNotifications, DEFAULT_BILL_REMINDER_PREFS } from '../utils/notifications';

type NewBillInput = Omit<Bill, 'id' | 'status' | 'isPaid'> & { isPaid?: boolean };
type UpdateBillPatch = Partial<Pick<Bill, 'name' | 'amount' | 'dueDate' | 'isPaid'>>;

interface BillState {
  bills: Bill[];
  isHydrated: boolean;
}

interface BillActions {
  addBill: (bill: NewBillInput, reminderPrefs?: BillReminderPreferences) => Promise<void>;
  updateBill: (id: string, updates: UpdateBillPatch, reminderPrefs?: BillReminderPreferences) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markBillPaid: (id: string) => Promise<void>;
  setBills: (bills: Bill[]) => void;
  loadDemoData: () => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type BillStore = BillState & BillActions;

const generateId = (): string => {
  return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useBillStore = create<BillStore>()(
  persist(
    (set, get) => ({
      // State - initialize with empty array for new users
      bills: [],
      isHydrated: false,

      // Actions
      addBill: async (bill, reminderPrefs = DEFAULT_BILL_REMINDER_PREFS) => {
        // Validation
        if (!bill.name.trim()) {
          console.warn('Bill name is required');
          return;
        }
        if (!bill.amount || bill.amount <= 0) {
          console.warn('Bill amount must be positive');
          return;
        }
        if (isNaN(new Date(bill.dueDate).getTime())) {
          console.warn('Invalid due date');
          return;
        }

        const newBill: Bill = {
          name: bill.name.trim(),
          amount: bill.amount,
          dueDate: bill.dueDate,
          isPaid: bill.isPaid ?? false,
          status: getBillStatus(bill.dueDate, bill.isPaid),
          id: generateId(),
        };

        // Schedule reminder notifications if enabled
        if (reminderPrefs.enabled && !newBill.isPaid) {
          try {
            const notificationIds = await scheduleBillReminder(newBill, reminderPrefs);
            if (notificationIds.length > 0) {
              newBill.reminderNotificationIds = notificationIds;
            }
          } catch (error) {
            console.warn('Failed to schedule bill reminder:', error);
          }
        }

        // Sort bills by due date (earliest first)
        set((state) => ({
          bills: [...state.bills, newBill].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          ),
        }));
      },

      updateBill: async (id, updates, reminderPrefs = DEFAULT_BILL_REMINDER_PREFS) => {
        const { bills } = get();
        const billToUpdate = bills.find((b) => b.id === id);
        if (!billToUpdate) return;

        // Cancel existing notifications if due date is changing or bill is being marked paid
        if (billToUpdate.reminderNotificationIds?.length && (updates.dueDate || updates.isPaid)) {
          await cancelNotifications(billToUpdate.reminderNotificationIds);
        }

        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;

            // Apply updates and recompute status
            const updated = { ...b, ...updates };
            const newStatus = getBillStatus(updated.dueDate, updated.isPaid);
            return { ...updated, status: newStatus, reminderNotificationIds: undefined };
          }),
        }));

        // Reschedule notifications if due date changed and bill isn't paid
        if (updates.dueDate && reminderPrefs.enabled && !updates.isPaid && !billToUpdate.isPaid) {
          try {
            const updatedBill = {
              ...billToUpdate,
              ...updates,
              status: getBillStatus(updates.dueDate, billToUpdate.isPaid),
            };
            const notificationIds = await scheduleBillReminder(updatedBill, reminderPrefs);
            if (notificationIds.length > 0) {
              set((state) => ({
                bills: state.bills.map((b) =>
                  b.id === id ? { ...b, reminderNotificationIds: notificationIds } : b
                ),
              }));
            }
          } catch (error) {
            console.warn('Failed to reschedule bill reminder:', error);
          }
        }
      },

      deleteBill: async (id) => {
        const { bills } = get();
        const billToDelete = bills.find((b) => b.id === id);

        // Cancel any scheduled notifications for this bill
        if (billToDelete?.reminderNotificationIds?.length) {
          await cancelNotifications(billToDelete.reminderNotificationIds);
        }

        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        }));
      },

      markBillPaid: async (id) => {
        const { bills } = get();
        const billToMark = bills.find((b) => b.id === id);

        // Cancel any scheduled notifications since bill is now paid
        if (billToMark?.reminderNotificationIds?.length) {
          await cancelNotifications(billToMark.reminderNotificationIds);
        }

        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, isPaid: true, reminderNotificationIds: undefined };
            return { ...updated, status: getBillStatus(updated.dueDate, true) };
          }),
        }));
      },

      setBills: (bills) => {
        set({ bills });
      },

      loadDemoData: () => {
        // Dynamically import mock data only when needed for demo mode
        import('../mockData').then(({ BILLS }) => {
          set({ bills: [...BILLS] });
        });
      },

      reset: () => {
        set({ bills: [] });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: getStorageKey('bills'),
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        bills: state.bills,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selectors
export const selectUnpaidBills = (state: BillStore) =>
  state.bills.filter((b) => !b.isPaid);

export const selectPaidBills = (state: BillStore) =>
  state.bills.filter((b) => b.isPaid);

export const selectOverdueBills = (state: BillStore) => {
  const now = new Date();
  return state.bills.filter((b) => !b.isPaid && new Date(b.dueDate) < now);
};

export const selectUpcomingBills = (daysAhead: number = 7) => (state: BillStore) => {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return state.bills.filter((b) => {
    const dueDate = new Date(b.dueDate);
    return !b.isPaid && dueDate >= now && dueDate <= future;
  });
};

export const selectTotalUnpaidAmount = (state: BillStore) =>
  state.bills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);

export const selectBillById = (id: string) => (state: BillStore) =>
  state.bills.find((b) => b.id === id);

export const selectBillsByStatus = (status: Bill['status']) => (state: BillStore) =>
  state.bills.filter((b) => b.status === status);
