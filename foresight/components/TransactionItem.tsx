import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, getCategoryColor, getCategoryIcon } from '../utils';

interface Props {
  transaction: Transaction;
  onClick: () => void;
}

const TransactionItem: React.FC<Props> = ({ transaction, onClick }) => {
  const isExpense = transaction.type === 'expense';
  
  return (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-surface-200/50 backdrop-blur-sm active:bg-surface-300 transition-colors cursor-pointer border-b border-surface-300/30 first:rounded-t-xl last:rounded-b-xl last:border-0"
    >
      <div className="flex items-center gap-4">
        {/* Icon/Logo */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-surface-300 shrink-0">
          {transaction.merchantLogo ? (
            <img src={transaction.merchantLogo} alt={transaction.merchantName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">{getCategoryIcon(transaction.category)}</span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm sm:text-base line-clamp-1">
            {transaction.merchantName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 capitalize">
                {transaction.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-neutral-600">•</span>
            <span className="text-xs text-neutral-500 font-mono">****4521</span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="flex flex-col items-end">
        <span className={`font-mono font-medium ${isExpense ? 'text-white' : 'text-mint'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
        </span>
        {transaction.status === 'pending' && (
            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Pending</span>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
