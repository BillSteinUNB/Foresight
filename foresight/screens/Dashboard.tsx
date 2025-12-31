import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowUpRight, TrendingUp, Check } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../utils';
import { SavingsGoal } from '../types';
import { useUserStore, useGoalStore, useBillStore, useTransactionStore, useInsightStore } from '../stores';
import { useToast } from '../components/Toast';
import HealthDial from '../components/HealthDial';
import LiquidGauge from '../components/LiquidGauge';
import TransactionItem from '../components/TransactionItem';
import TransactionDetail from '../components/TransactionDetail';
import AddGoal from '../components/AddGoal';
import { Transaction } from '../types';

const Dashboard: React.FC = () => {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Store hooks
  const { user, calculateSafeToSpend, preferences } = useUserStore();
  const { goals, addGoal } = useGoalStore();
  const { bills, getUpcomingBills, getTotalDue, togglePaidStatus } = useBillStore();
  const { transactions, getRecentTransactions } = useTransactionStore();
  const { getUnreadCount } = useInsightStore();
  const { showToast } = useToast();

  const upcomingBills = getUpcomingBills();
  const totalBillsDue = getTotalDue();
  const recentTransactions = getRecentTransactions(4);
  const unreadInsights = getUnreadCount();

  // Recalculate safe-to-spend when bills change
  useEffect(() => {
    calculateSafeToSpend(totalBillsDue);
  }, [totalBillsDue, calculateSafeToSpend]);

  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    addGoal(newGoal);
    setIsAddGoalOpen(false);
    showToast(`Goal "${newGoal.name}" created!`, 'success');
  };

  const handleBillClick = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    togglePaidStatus(billId);
    if (bill) {
      showToast(
        bill.isPaid ? `Marked ${bill.name} as unpaid` : `Marked ${bill.name} as paid`,
        'success'
      );
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate days until end of month
  const getDaysUntilEndOfMonth = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilEndOfMonth();

  return (
    <div className="pb-24 pt-4 px-4 space-y-8">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-sm font-medium text-neutral-400">{getGreeting()},</h1>
          <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
        </div>
        <div className="relative p-2 bg-surface-200 rounded-full border border-surface-300 hover:bg-surface-300 transition-colors cursor-pointer">
          <Bell size={20} className="text-white" />
          {unreadInsights > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full border-2 border-black flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{unreadInsights}</span>
            </div>
          )}
        </div>
      </header>

      {/* Safe To Spend (Hero) */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-200 rounded-3xl p-6 border border-surface-300 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-mint/10 transition-colors duration-700" />
        
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Safe to Spend</h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-5xl font-light tracking-tight drop-shadow-[0_0_15px_rgba(0,217,165,0.3)] ${
            preferences.privacyMode ? 'blur-lg select-none' : ''
          } ${user.safeToSpend < 500 ? 'text-warning' : 'text-mint'}`}>
            {preferences.privacyMode ? '$••••' : formatCurrency(user.safeToSpend)}
          </span>
        </div>
        <p className="text-neutral-400 text-sm mb-6">
          until month end 
          <span className="text-xs bg-surface-300 px-1.5 py-0.5 rounded text-neutral-300 ml-1">
            ↻ {daysLeft} days
          </span>
        </p>

        {/* Breakdown */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-300/50 text-sm">
          <div className="flex flex-col">
            <span className="text-neutral-500 text-xs mb-1">Balance</span>
            <span className={`text-white font-mono ${preferences.privacyMode ? 'blur-sm' : ''}`}>
              {preferences.privacyMode ? '$••••' : formatCompactCurrency(user.balance)}
            </span>
          </div>
          <span className="text-neutral-600">-</span>
          <div className="flex flex-col">
            <span className="text-neutral-500 text-xs mb-1">Bills</span>
            <span className={`text-white font-mono ${preferences.privacyMode ? 'blur-sm' : ''}`}>
              {preferences.privacyMode ? '$••••' : formatCompactCurrency(totalBillsDue)}
            </span>
          </div>
          <span className="text-neutral-600">=</span>
          <div className="flex flex-col">
            <span className="text-neutral-500 text-xs mb-1">Safe</span>
            <span className={`text-mint font-mono ${preferences.privacyMode ? 'blur-sm' : ''}`}>
              {preferences.privacyMode ? '$••••' : formatCompactCurrency(user.safeToSpend)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Health Dial & Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dial Card */}
        <div className="bg-surface-200 rounded-3xl p-4 border border-surface-300 flex flex-col items-center justify-center min-h-[160px]">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 self-start">Fin Health</span>
          <HealthDial score={user.financialHealthScore} />
        </div>

        {/* Net Worth Card */}
        <div className="bg-surface-200 rounded-3xl p-5 border border-surface-300 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Net Worth</span>
            <TrendingUp size={16} className="text-mint" />
          </div>
          <div>
            <span className={`text-2xl text-white font-semibold block mb-1 ${preferences.privacyMode ? 'blur-md' : ''}`}>
              {preferences.privacyMode ? '$••••' : formatCompactCurrency(user.netWorth || 34500)}
            </span>
            <span className="text-xs text-mint flex items-center gap-1">
              <ArrowUpRight size={12} />
              $1.2k this mo
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Upcoming Bills</h3>
          <span className="text-neutral-500 text-sm">
            {upcomingBills.length} pending
          </span>
        </div>
        <div className="space-y-3">
          {upcomingBills.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Check size={32} className="mx-auto mb-2 text-mint" />
              <p>All bills are paid! 🎉</p>
            </div>
          ) : (
            upcomingBills.slice(0, 3).map(bill => (
              <motion.div 
                key={bill.id} 
                className={`flex items-center justify-between p-4 bg-surface-200 rounded-xl border transition-all cursor-pointer ${
                  bill.isPaid 
                    ? 'border-mint/30 bg-mint/5' 
                    : 'border-surface-300 hover:bg-surface-300/50'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleBillClick(bill.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    bill.isPaid 
                      ? 'bg-mint border-mint' 
                      : bill.status === 'danger' 
                        ? 'border-danger' 
                        : bill.status === 'warning' 
                          ? 'border-warning' 
                          : 'border-surface-400'
                  }`}>
                    {bill.isPaid && <Check size={14} className="text-black" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-medium ${bill.isPaid ? 'text-neutral-500 line-through' : 'text-white'}`}>
                      {bill.name}
                    </span>
                    <span className="text-neutral-500 text-xs">
                      Due {new Date(bill.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </span>
                  </div>
                </div>
                <span className={`font-mono ${bill.isPaid ? 'text-neutral-500' : 'text-white'}`}>
                  {formatCurrency(bill.amount)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Savings Goals (Horizontal Scroll) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
          <button 
            onClick={() => setIsAddGoalOpen(true)}
            className="text-mint text-sm font-medium hover:text-mint-hover transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {goals.map(goal => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <motion.div 
                key={goal.id} 
                className="flex flex-col items-center gap-3 min-w-[100px] cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <LiquidGauge percentage={percentage} color={goal.color} size={90} />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-40 bg-surface-200 rounded-full p-1 border border-surface-300 shadow-lg">
                    {goal.icon}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-white text-sm font-medium block">{goal.name}</span>
                  <span className={`text-neutral-500 text-xs ${preferences.privacyMode ? 'blur-sm' : ''}`}>
                    {preferences.privacyMode ? '$••••' : formatCompactCurrency(goal.currentAmount)}
                  </span>
                </div>
              </motion.div>
            )
          })}
          
          {/* Add Goal Card */}
          <motion.button
            onClick={() => setIsAddGoalOpen(true)}
            className="flex flex-col items-center justify-center gap-2 min-w-[100px] h-[150px] bg-surface-300/50 rounded-2xl border-2 border-dashed border-surface-400 hover:border-mint hover:bg-surface-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl">➕</span>
            <span className="text-neutral-400 text-xs font-medium">Add Goal</span>
          </motion.button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <span className="text-neutral-500 text-sm hover:text-neutral-300 cursor-pointer transition-colors">
            View all
          </span>
        </div>
        <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No transactions yet</p>
              <p className="text-xs mt-1">Add your first transaction!</p>
            </div>
          ) : (
            recentTransactions.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
                onClick={() => setSelectedTransaction(t)} 
              />
            ))
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      <AddGoal 
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAdd={handleAddGoal}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetail
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};

export default Dashboard;
