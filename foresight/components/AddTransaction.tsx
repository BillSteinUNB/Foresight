import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, ArrowRight, Loader2 } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Partial<Transaction>) => void;
}

const AddTransaction: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null);

  useEffect(() => {
    if (isOpen) {
        setInput('');
        setParsedData(null);
        setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSimulatedAI = () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    
    // Simulate AI Latency
    setTimeout(() => {
      // Mock parsing logic
      const amountMatch = input.match(/\d+(\.\d{1,2})?/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
      
      let category: BudgetCategory = 'other';
      if (input.toLowerCase().includes('food') || input.toLowerCase().includes('lunch') || input.toLowerCase().includes('dinner')) category = 'food_dining';
      if (input.toLowerCase().includes('uber') || input.toLowerCase().includes('taxi')) category = 'transportation';
      if (input.toLowerCase().includes('grocery')) category = 'food_dining';
      
      const merchant = input.replace(/\d+(\.\d{1,2})?/, '').replace(/for|at|spent|on|\$/g, '').trim();

      setParsedData({
        amount,
        merchantName: merchant.charAt(0).toUpperCase() + merchant.slice(1) || 'Unknown Merchant',
        category,
        date: new Date().toISOString(),
        type: 'expense'
      });
      setIsProcessing(false);
    }, 1500);
  };

  const handleConfirm = () => {
    if (parsedData) {
        onAdd(parsedData);
        onClose();
    }
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
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='e.g., "Lunch at Chipotle for $15"'
                        className="w-full bg-surface-100 border border-surface-300 rounded-xl p-4 text-white text-lg placeholder:text-neutral-600 focus:outline-none focus:border-mint resize-none h-32"
                    />
                    <button 
                        onClick={() => setIsListening(!isListening)}
                        className={`absolute bottom-3 right-3 p-3 rounded-full transition-all ${isListening ? 'bg-danger animate-pulse' : 'bg-surface-300 text-neutral-400'}`}
                    >
                        <Mic size={20} />
                    </button>
                </div>

                <button 
                    onClick={handleSimulatedAI}
                    disabled={!input || isProcessing}
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
                        <button onClick={() => setInput("Starbucks coffee $6.50")} className="px-4 py-2 bg-surface-300 rounded-full text-sm text-neutral-300 whitespace-nowrap">☕ Starbucks $6.50</button>
                        <button onClick={() => setInput("Uber to work $25")} className="px-4 py-2 bg-surface-300 rounded-full text-sm text-neutral-300 whitespace-nowrap">🚕 Uber $25</button>
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
                    <p className="text-mint text-3xl font-mono mt-2">{formatCurrency(parsedData.amount || 0)}</p>
                </div>

                <div className="bg-surface-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-neutral-500 text-sm">Category</span>
                        <span className="text-white text-sm capitalize">{parsedData.category?.replace('_', ' ')}</span>
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
                        onClick={() => setParsedData(null)} 
                        className="flex-1 py-3 bg-surface-300 text-white font-medium rounded-xl"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-mint text-black font-semibold rounded-xl flex items-center justify-center gap-2"
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
