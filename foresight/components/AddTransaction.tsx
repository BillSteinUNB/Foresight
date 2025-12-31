import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Partial<Transaction>) => void;
}

interface ValidationErrors {
  amount?: string;
  merchantName?: string;
}

const AddTransaction: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setParsedData(null);
      setIsProcessing(false);
      setErrors({});
    }
  }, [isOpen]);

  const validateParsedData = (data: Partial<Transaction>): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (!data.amount || data.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    if (!data.merchantName || data.merchantName.trim().length === 0) {
      newErrors.merchantName = 'Please enter a merchant name';
    }
    
    return newErrors;
  };

  const handleSimulatedAI = () => {
    if (!input.trim()) {
      setErrors({ merchantName: 'Please enter a transaction description' });
      return;
    }
    
    setIsProcessing(true);
    setErrors({});
    
    // Simulate AI Latency
    setTimeout(() => {
      // Mock parsing logic
      const amountMatch = input.match(/\d+(\.\d{1,2})?/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
      
      let category: BudgetCategory = 'other';
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('food') || lowerInput.includes('lunch') || lowerInput.includes('dinner') || lowerInput.includes('restaurant')) {
        category = 'food_dining';
      } else if (lowerInput.includes('uber') || lowerInput.includes('taxi') || lowerInput.includes('lyft') || lowerInput.includes('ride')) {
        category = 'transportation';
      } else if (lowerInput.includes('grocery') || lowerInput.includes('supermarket') || lowerInput.includes('walmart') || lowerInput.includes('target')) {
        category = 'food_dining';
      } else if (lowerInput.includes('netflix') || lowerInput.includes('spotify') || lowerInput.includes('subscription')) {
        category = 'subscriptions';
      } else if (lowerInput.includes('salary') || lowerInput.includes('paycheck') || lowerInput.includes('income') || lowerInput.includes('paid')) {
        category = 'income';
      }
      
      // Extract merchant name
      let merchant = input
        .replace(/\d+(\.\d{1,2})?/g, '')
        .replace(/\$|for|at|spent|on|bought|purchased/gi, '')
        .trim();
      
      if (merchant.length === 0) {
        merchant = 'Unknown Merchant';
      } else {
        merchant = merchant.charAt(0).toUpperCase() + merchant.slice(1);
      }

      const newParsedData: Partial<Transaction> = {
        amount,
        merchantName: merchant,
        category,
        date: new Date().toISOString(),
        type: lowerInput.includes('income') || lowerInput.includes('salary') || lowerInput.includes('paycheck') ? 'income' : 'expense'
      };

      // Validate parsed data
      const validationErrors = validateParsedData(newParsedData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      setParsedData(newParsedData);
      setIsProcessing(false);
    }, 1500);
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    
    // Final validation
    const validationErrors = validateParsedData(parsedData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onAdd(parsedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-surface-200 rounded-t-3xl sm:rounded-2xl p-6 pointer-events-auto shadow-2xl border-t border-surface-300"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-sans font-semibold text-white">Add Transaction</h2>
            <button onClick={onClose} className="p-2 bg-surface-300 rounded-full hover:bg-surface-400">
              <X size={20} className="text-neutral-400" />
            </button>
          </div>

          {!parsedData ? (
            /* Input State */
            <div className="flex flex-col gap-4">
              <p className="text-neutral-400 text-sm">Tell me what you spent...</p>
              
              <div className="relative">
                <textarea 
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (errors.merchantName) setErrors({});
                  }}
                  placeholder='e.g., "Lunch at Chipotle for $15"'
                  className={`w-full bg-surface-100 border rounded-xl p-4 text-white text-lg placeholder:text-neutral-600 focus:outline-none resize-none h-32 ${
                    errors.merchantName ? 'border-danger focus:border-danger' : 'border-surface-300 focus:border-mint'
                  }`}
                />
                <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`absolute bottom-3 right-3 p-3 rounded-full transition-all ${isListening ? 'bg-danger animate-pulse' : 'bg-surface-300 text-neutral-400'}`}
                >
                  <Mic size={20} />
                </button>
              </div>

              {/* Error Message */}
              {errors.merchantName && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-2"
                >
                  <AlertCircle size={16} />
                  <span>{errors.merchantName}</span>
                </motion.div>
              )}

              <button 
                onClick={handleSimulatedAI}
                disabled={!input.trim() || isProcessing}
                className="w-full py-4 bg-mint text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
              
              {/* Suggestions */}
              <div className="mt-4">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Suggestions</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setInput("Starbucks coffee $6.50")} 
                    className="px-4 py-2 bg-surface-300 rounded-full text-sm text-neutral-300 whitespace-nowrap hover:bg-surface-400 transition-colors"
                  >
                    ☕ Starbucks $6.50
                  </button>
                  <button 
                    onClick={() => setInput("Uber to work $25")} 
                    className="px-4 py-2 bg-surface-300 rounded-full text-sm text-neutral-300 whitespace-nowrap hover:bg-surface-400 transition-colors"
                  >
                    🚕 Uber $25
                  </button>
                  <button 
                    onClick={() => setInput("Salary from work $2600")} 
                    className="px-4 py-2 bg-surface-300 rounded-full text-sm text-neutral-300 whitespace-nowrap hover:bg-surface-400 transition-colors"
                  >
                    💰 Salary $2600
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation State */
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mb-4 text-3xl">
                  {parsedData.merchantName?.charAt(0)}
                </div>
                <h3 className="text-2xl font-semibold text-white">{parsedData.merchantName}</h3>
                <p className={`text-3xl font-mono mt-2 ${parsedData.type === 'income' ? 'text-mint' : 'text-white'}`}>
                  {parsedData.type === 'income' ? '+' : '-'}{formatCurrency(parsedData.amount || 0)}
                </p>
              </div>

              {/* Validation Errors */}
              {(errors.amount || errors.merchantName) && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-danger/10 border border-danger/30 rounded-lg p-3 space-y-1"
                >
                  {errors.amount && (
                    <div className="flex items-center gap-2 text-danger text-sm">
                      <AlertCircle size={14} />
                      <span>{errors.amount}</span>
                    </div>
                  )}
                  {errors.merchantName && (
                    <div className="flex items-center gap-2 text-danger text-sm">
                      <AlertCircle size={14} />
                      <span>{errors.merchantName}</span>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="bg-surface-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-sm">Category</span>
                  <span className="text-white text-sm capitalize">{parsedData.category?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-sm">Type</span>
                  <span className={`text-sm font-medium capitalize ${parsedData.type === 'income' ? 'text-mint' : 'text-white'}`}>
                    {parsedData.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-sm">Date</span>
                  <span className="text-white text-sm">Today</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 text-sm">Account</span>
                  <span className="text-white text-sm">Chase ****4521</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setParsedData(null);
                    setErrors({});
                  }} 
                  className="flex-1 py-3 bg-surface-300 text-white font-medium rounded-xl hover:bg-surface-400 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={!!errors.amount || !!errors.merchantName}
                  className="flex-1 py-3 bg-mint text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={20} />
                  Confirm
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddTransaction;
