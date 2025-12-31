import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowUpRight, TrendingUp } from 'lucide-react';
import { USER, GOALS, BILLS, TRANSACTIONS } from '../mockData';
import { formatCurrency, formatCompactCurrency } from '../utils';
import HealthDial from '../components/HealthDial';
import LiquidGauge from '../components/LiquidGauge';
import TransactionItem from '../components/TransactionItem';

const Dashboard: React.FC = () => {
  return (
    <div className="pb-24 pt-4 px-4 space-y-8">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-sm font-medium text-neutral-400">Good evening,</h1>
          <h2 className="text-2xl font-bold text-white tracking-tight">{USER.name}</h2>
        </div>
        <div className="relative p-2 bg-surface-200 rounded-full border border-surface-300">
            <Bell size={20} className="text-white" />
            <div className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full border border-black" />
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
            <span className="text-5xl font-light text-mint tracking-tight drop-shadow-[0_0_15px_rgba(0,217,165,0.3)]">
                {formatCurrency(USER.safeToSpend)}
            </span>
        </div>
        <p className="text-neutral-400 text-sm mb-6">until Dec 31 <span className="text-xs bg-surface-300 px-1.5 py-0.5 rounded text-neutral-300 ml-1">↻ 5 days</span></p>

        {/* Breakdown */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-300/50 text-sm">
            <div className="flex flex-col">
                <span className="text-neutral-500 text-xs mb-1">Balance</span>
                <span className="text-white font-mono">{formatCompactCurrency(USER.balance)}</span>
            </div>
            <span className="text-neutral-600">-</span>
            <div className="flex flex-col">
                <span className="text-neutral-500 text-xs mb-1">Bills</span>
                <span className="text-white font-mono">$1.9k</span>
            </div>
            <span className="text-neutral-600">=</span>
            <div className="flex flex-col">
                <span className="text-neutral-500 text-xs mb-1">Safe</span>
                <span className="text-mint font-mono">{formatCompactCurrency(USER.safeToSpend)}</span>
            </div>
        </div>
      </motion.div>

      {/* Health Dial & Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dial Card */}
        <div className="bg-surface-200 rounded-3xl p-4 border border-surface-300 flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 self-start">Fin Health</span>
            <HealthDial score={USER.financialHealthScore} />
        </div>

        {/* Net Worth Card */}
        <div className="bg-surface-200 rounded-3xl p-5 border border-surface-300 flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Net Worth</span>
                <TrendingUp size={16} className="text-mint" />
             </div>
             <div>
                 <span className="text-2xl text-white font-semibold block mb-1">$34.5k</span>
                 <span className="text-xs text-mint flex items-center gap-1">
                    <ArrowUpRight size={12} />
                    $1.2k this mo
                 </span>
             </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Bills</h3>
        <div className="space-y-3">
            {BILLS.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-surface-200 rounded-xl border border-surface-300">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${bill.status === 'danger' ? 'bg-danger animate-pulse' : bill.status === 'warning' ? 'bg-warning' : 'bg-mint'}`} />
                        <div className="flex flex-col">
                            <span className="text-white font-medium">{bill.name}</span>
                            <span className="text-neutral-500 text-xs">Due {new Date(bill.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                        </div>
                    </div>
                    <span className="text-white font-mono">{formatCurrency(bill.amount)}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Savings Goals (Horizontal Scroll) */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
            <button className="text-mint text-sm font-medium">+ Add</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {GOALS.map(goal => {
                const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                    <div key={goal.id} className="flex flex-col items-center gap-3 min-w-[100px]">
                        <div className="relative">
                            <LiquidGauge percentage={percentage} color={goal.color} size={90} />
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-40 bg-surface-200 rounded-full p-1 border border-surface-300 shadow-lg">
                                {goal.icon}
                            </span>
                        </div>
                        <div className="text-center">
                            <span className="text-white text-sm font-medium block">{goal.name}</span>
                            <span className="text-neutral-500 text-xs">{formatCompactCurrency(goal.currentAmount)}</span>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <span className="text-neutral-500 text-sm">View all</span>
        </div>
        <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            {TRANSACTIONS.slice(0, 4).map(t => (
                <TransactionItem key={t.id} transaction={t} onClick={() => {}} />
            ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
