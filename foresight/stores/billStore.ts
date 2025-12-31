import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bill } from '../types';
import { BILLS } from '../mockData';

interface BillState {
  bills: Bill[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  
  // Status operations
  markAsPaid: (id: string) => void;
  markAsUnpaid: (id: string) => void;
  togglePaidStatus: (id: string) => void;
  
  // Computed
  getBillById: (id: string) => Bill | undefined;
  getUpcomingBills: () => Bill[];
  getPaidBills: () => Bill[];
  getUnpaidBills: () => Bill[];
  getTotalDue: () => number;
  getTotalPaid: () => number;
  getOverdueBills: () => Bill[];

  // Utilities
  updateBillStatuses: () => void;
  clearError: () => void;
  resetToDefault: () => void;
}

// Helper function to calculate bill status based on due date
const calculateBillStatus = (dueDate: string, isPaid: boolean): Bill['status'] => {
  if (isPaid) return 'safe';
  
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return 'danger'; // Overdue
  if (daysUntilDue <= 3) return 'danger'; // Due within 3 days
  if (daysUntilDue <= 7) return 'warning'; // Due within a week
  return 'safe';
};

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      bills: BILLS,
      isLoading: false,
      error: null,

      addBill: (billData) => {
        const status = calculateBillStatus(billData.dueDate, billData.isPaid);
        const newBill: Bill = {
          ...billData,
          id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status,
        };
        set((state) => ({
          bills: [...state.bills, newBill],
          error: null,
        }));
      },

      updateBill: (id, updates) => {
        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, ...updates };
            // Recalculate status if dueDate or isPaid changed
            if (updates.dueDate !== undefined || updates.isPaid !== undefined) {
              updated.status = calculateBillStatus(updated.dueDate, updated.isPaid);
            }
            return updated;
          }),
          error: null,
        }));
      },

      deleteBill: (id) => {
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
          error: null,
        }));
      },

      markAsPaid: (id) => {
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === id ? { ...b, isPaid: true, status: 'safe' as const } : b
          ),
          error: null,
        }));
      },

      markAsUnpaid: (id) => {
        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;
            const status = calculateBillStatus(b.dueDate, false);
            return { ...b, isPaid: false, status };
          }),
          error: null,
        }));
      },

      togglePaidStatus: (id) => {
        const bill = get().bills.find((b) => b.id === id);
        if (bill) {
          if (bill.isPaid) {
            get().markAsUnpaid(id);
          } else {
            get().markAsPaid(id);
          }
        }
      },

      getBillById: (id) => {
        return get().bills.find((b) => b.id === id);
      },

      getUpcomingBills: () => {
        const now = new Date();
        return get()
          .bills.filter((b) => !b.isPaid && new Date(b.dueDate) >= now)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      },

      getPaidBills: () => {
        return get().bills.filter((b) => b.isPaid);
      },

      getUnpaidBills: () => {
        return get().bills.filter((b) => !b.isPaid);
      },

      getTotalDue: () => {
        return get()
          .bills.filter((b) => !b.isPaid)
          .reduce((sum, b) => sum + b.amount, 0);
      },

      getTotalPaid: () => {
        return get()
          .bills.filter((b) => b.isPaid)
          .reduce((sum, b) => sum + b.amount, 0);
      },

      getOverdueBills: () => {
        const now = new Date();
        return get().bills.filter((b) => !b.isPaid && new Date(b.dueDate) < now);
      },

      updateBillStatuses: () => {
        set((state) => ({
          bills: state.bills.map((b) => ({
            ...b,
            status: calculateBillStatus(b.dueDate, b.isPaid),
          })),
        }));
      },

      clearError: () => set({ error: null }),
      
      resetToDefault: () => set({ bills: BILLS, error: null }),
    }),
    {
      name: 'foresight-bills',
      version: 1,
    }
  )
);

