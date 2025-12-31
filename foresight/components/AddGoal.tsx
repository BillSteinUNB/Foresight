import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Target } from 'lucide-react';
import { SavingsGoal } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void;
}

const GOAL_ICONS = ['🏖️', '🚗', '🏠', '💍', '📱', '🎓', '💼', '🎮', '✈️', '👶', '🏋️', '🎸'];
const GOAL_COLORS = ['#00D9A5', '#4ECDC4', '#3498DB', '#9B59B6', '#E74C3C', '#F39C12', '#FF6B35', '#FF69B4'];

const AddGoal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setSelectedIcon('🎯');
      setSelectedColor(GOAL_COLORS[0]);
      setStep(1);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (name && targetAmount) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (name && targetAmount) {
      onAdd({
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        icon: selectedIcon,
        color: selectedColor
      });
      onClose();
    }
  };

  const isStep1Valid = name.trim() && parseFloat(targetAmount) > 0;
  const isStep2Valid = true; // Icon and color always have defaults

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

        {/* Modal */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-surface-200 rounded-t-3xl sm:rounded-2xl p-6 pointer-events-auto shadow-2xl border-t border-surface-300"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/10 rounded-xl">
                <Target className="text-mint" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">New Savings Goal</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-surface-300 rounded-full hover:bg-surface-400">
              <X size={20} className="text-neutral-400" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-mint' : 'bg-surface-400'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-mint' : 'bg-surface-400'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Goal Name */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Dream Vacation"
                    className="w-full bg-surface-100 border border-surface-300 rounded-xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-mint"
                    autoFocus
                  />
                </div>

                {/* Target Amount */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="5,000"
                      className="w-full bg-surface-100 border border-surface-300 rounded-xl p-4 pl-8 text-white placeholder:text-neutral-600 focus:outline-none focus:border-mint font-mono"
                    />
                  </div>
                </div>

                {/* Starting Amount (Optional) */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    Starting Amount <span className="text-neutral-600">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-surface-100 border border-surface-300 rounded-xl p-4 pl-8 text-white placeholder:text-neutral-600 focus:outline-none focus:border-mint font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="w-full py-4 bg-mint text-black font-semibold rounded-xl hover:bg-mint-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Icon Selection */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">
                    Choose an Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {GOAL_ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          selectedIcon === icon 
                            ? 'bg-mint/20 border-2 border-mint scale-105' 
                            : 'bg-surface-300 hover:bg-surface-400'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">
                    Choose a Color
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {GOAL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                          selectedColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-surface-200' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && <Check size={18} className="text-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-surface-100 rounded-xl p-4 border border-surface-300">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-3">Preview</span>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${selectedColor}20` }}
                    >
                      {selectedIcon}
                    </div>
                    <div>
                      <span className="text-white font-semibold block">{name || 'Goal Name'}</span>
                      <span className="text-neutral-500 text-sm">
                        ${parseFloat(currentAmount) || 0} / ${parseFloat(targetAmount) || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-surface-300 text-white font-medium rounded-xl hover:bg-surface-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isStep2Valid}
                    className="flex-1 py-4 bg-mint text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors"
                  >
                    <Check size={20} />
                    Create Goal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddGoal;
