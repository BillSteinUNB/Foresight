import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, CreditCard, Tag, Repeat, Edit2, Trash2, Share2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, getCategoryIcon, getCategoryColor } from '../utils';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetail: React.FC<Props> = ({ transaction, isOpen, onClose }) => {
  if (!transaction) return null;

  const isExpense = transaction.type === 'expense';
  const categoryColor = getCategoryColor(transaction.category);
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const { date, time } = formatDateTime(transaction.date);

  const DetailRow = ({ icon: Icon, label, value, color }: { 
    icon: React.ElementType; 
    label: string; 
    value: string;
    color?: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-surface-300/50 last:border-0">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-neutral-500" />
        <span className="text-neutral-400 text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${color || 'text-white'}`}>{value}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-surface-200 rounded-t-3xl sm:rounded-2xl relative z-10 shadow-2xl border-t border-surface-300 max-h-[90vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-surface-400 rounded-full" />
            </div>

            {/* Header with close button */}
            <div className="flex justify-end px-4 mb-2">
              <button 
                onClick={onClose} 
                className="p-2 bg-surface-300 rounded-full hover:bg-surface-400 transition-colors"
              >
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            {/* Main Content */}
            <div className="px-6 pb-6">
              {/* Merchant Header */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  {transaction.merchantLogo ? (
                    <img 
                      src={transaction.merchantLogo} 
                      alt={transaction.merchantName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">{getCategoryIcon(transaction.category)}</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">{transaction.merchantName}</h2>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  {transaction.category.replace('_', ' ')}
                </div>
              </div>

              {/* Amount */}
              <div className="text-center mb-8">
                <span className={`text-4xl font-mono font-light ${isExpense ? 'text-white' : 'text-mint'}`}>
                  {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                </span>
                {transaction.status === 'pending' && (
                  <span className="block text-warning text-xs mt-2 uppercase tracking-wide font-medium">
                    Pending • May change
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="bg-surface-100 rounded-xl p-4 mb-6">
                <DetailRow icon={Calendar} label="Date" value={date} />
                <DetailRow icon={Calendar} label="Time" value={time} />
                <DetailRow icon={CreditCard} label="Account" value="Chase ****4521" />
                <DetailRow 
                  icon={Tag} 
                  label="Category" 
                  value={transaction.category.replace('_', ' ')} 
                  color={categoryColor}
                />
                <DetailRow 
                  icon={Repeat} 
                  label="Recurring" 
                  value="No" 
                />
                <DetailRow 
                  icon={MapPin} 
                  label="Location" 
                  value="New York, NY" 
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button className="flex flex-col items-center gap-2 p-4 bg-surface-300 rounded-xl hover:bg-surface-400 transition-colors">
                  <Edit2 size={20} className="text-neutral-400" />
                  <span className="text-xs text-neutral-400">Edit</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-surface-300 rounded-xl hover:bg-surface-400 transition-colors">
                  <Share2 size={20} className="text-neutral-400" />
                  <span className="text-xs text-neutral-400">Share</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-surface-300 rounded-xl hover:bg-danger/20 transition-colors group">
                  <Trash2 size={20} className="text-neutral-400 group-hover:text-danger transition-colors" />
                  <span className="text-xs text-neutral-400 group-hover:text-danger transition-colors">Delete</span>
                </button>
              </div>

              {/* Split / Flag as Recurring */}
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-surface-300 text-white text-sm font-medium rounded-xl hover:bg-surface-400 transition-colors">
                  Split Transaction
                </button>
                <button className="flex-1 py-3 bg-mint text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors">
                  <Repeat size={16} />
                  Mark Recurring
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetail;

