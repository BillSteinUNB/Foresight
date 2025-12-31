import React from 'react';
import { TRANSACTIONS } from '../mockData';
import TransactionItem from '../components/TransactionItem';
import { formatDate, formatCurrency } from '../utils';

const Activity: React.FC = () => {
  // Group by date
  const grouped = TRANSACTIONS.reduce((acc, t) => {
    const date = formatDate(t.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, typeof TRANSACTIONS>);

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-mint text-black font-semibold rounded-full text-xs">All</button>
            <button className="px-4 py-2 bg-surface-200 text-neutral-400 font-medium rounded-full text-xs">Income</button>
            <button className="px-4 py-2 bg-surface-200 text-neutral-400 font-medium rounded-full text-xs">Expenses</button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, transactions]) => {
            const dailyTotal = transactions.reduce((sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0);
            
            return (
                <div key={date}>
                    <div className="flex justify-between items-center mb-2 px-2 sticky top-0 bg-black/90 backdrop-blur-md py-2 z-10">
                        <span className="text-neutral-400 font-medium text-sm">{date}</span>
                        <span className={`text-sm font-mono ${dailyTotal > 0 ? 'text-mint' : 'text-neutral-500'}`}>
                            {dailyTotal > 0 ? '+' : ''}{formatCurrency(dailyTotal)}
                        </span>
                    </div>
                    <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
                        {transactions.map(t => (
                            <TransactionItem key={t.id} transaction={t} onClick={() => {}} />
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Activity;
