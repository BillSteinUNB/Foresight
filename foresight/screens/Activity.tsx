import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSACTIONS } from '../mockData';
import TransactionItem from '../components/TransactionItem';
import { formatDate, formatCurrency } from '../utils';
import { Transaction, BudgetCategory } from '../types';

type FilterType = 'all' | 'income' | 'expense';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 font-semibold rounded-full text-xs transition-all ${
      active 
        ? 'bg-mint text-black' 
        : 'bg-surface-200 text-neutral-400 hover:bg-surface-300 hover:text-neutral-200'
    }`}
  >
    {label}
  </button>
);

const CategoryPill: React.FC<{ category: BudgetCategory; active: boolean; onClick: () => void }> = ({ 
  category, 
  active, 
  onClick 
}) => {
  const labels: Record<BudgetCategory, string> = {
    food_dining: '🍔 Food',
    transportation: '🚕 Transport',
    shopping: '🛍️ Shopping',
    entertainment: '🎬 Fun',
    bills_utilities: '💡 Bills',
    health_fitness: '💪 Health',
    travel: '✈️ Travel',
    income: '💰 Income',
    subscriptions: '🔄 Subs',
    other: '📦 Other'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
        active 
          ? 'bg-mint/20 text-mint border border-mint/50' 
          : 'bg-surface-300 text-neutral-400 hover:bg-surface-400'
      }`}
    >
      {labels[category]}
    </button>
  );
};

const Activity: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<BudgetCategory>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // All available categories from transactions
  const allCategories = useMemo(() => {
    const cats = new Set<BudgetCategory>();
    TRANSACTIONS.forEach(t => cats.add(t.category));
    return Array.from(cats);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return TRANSACTIONS.filter(t => {
      // Type filter
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && t.type !== 'expense') return false;

      // Category filter
      if (selectedCategories.size > 0 && !selectedCategories.has(t.category)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMerchant = t.merchantName.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesAmount = t.amount.toString().includes(query);
        if (!matchesMerchant && !matchesCategory && !matchesAmount) return false;
      }

      return true;
    });
  }, [filter, searchQuery, selectedCategories]);

  // Group filtered transactions by date
  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const date = formatDate(t.date);
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  const toggleCategory = (category: BudgetCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setSelectedCategories(new Set());
    setShowFilters(false);
  };

  const hasActiveFilters = filter !== 'all' || searchQuery.trim() || selectedCategories.size > 0;

  // Calculate totals for header stats
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2.5 rounded-full transition-colors ${isSearchOpen ? 'bg-mint text-black' : 'bg-surface-200 text-neutral-400 hover:text-white'}`}
          >
            <Search size={18} />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-full transition-colors relative ${showFilters ? 'bg-mint text-black' : 'bg-surface-200 text-neutral-400 hover:text-white'}`}
          >
            <SlidersHorizontal size={18} />
            {hasActiveFilters && !showFilters && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-mint rounded-full border-2 border-black" />
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-200 border border-surface-300 rounded-xl py-3 pl-11 pr-10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-mint"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-surface-300 rounded-full hover:bg-surface-400"
                >
                  <X size={14} className="text-neutral-400" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Filters */}
      <div className="flex gap-2 mb-4">
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label="Income" active={filter === 'income'} onClick={() => setFilter('income')} />
        <FilterChip label="Expenses" active={filter === 'expense'} onClick={() => setFilter('expense')} />
      </div>

      {/* Category Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-surface-200 rounded-2xl border border-surface-300 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Categories</span>
                {selectedCategories.size > 0 && (
                  <button 
                    onClick={() => setSelectedCategories(new Set())}
                    className="text-xs text-mint hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <CategoryPill 
                    key={cat} 
                    category={cat} 
                    active={selectedCategories.has(cat)}
                    onClick={() => toggleCategory(cat)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      {filteredTransactions.length > 0 && (
        <div className="flex justify-between items-center bg-surface-200/50 rounded-xl p-3 mb-6 border border-surface-300/50">
          <div className="text-center flex-1">
            <span className="text-neutral-500 text-xs block mb-0.5">Income</span>
            <span className="text-mint font-mono text-sm font-medium">+{formatCurrency(totals.income)}</span>
          </div>
          <div className="w-px h-8 bg-surface-300" />
          <div className="text-center flex-1">
            <span className="text-neutral-500 text-xs block mb-0.5">Expenses</span>
            <span className="text-white font-mono text-sm font-medium">-{formatCurrency(totals.expenses)}</span>
          </div>
          <div className="w-px h-8 bg-surface-300" />
          <div className="text-center flex-1">
            <span className="text-neutral-500 text-xs block mb-0.5">Net</span>
            <span className={`font-mono text-sm font-medium ${totals.net >= 0 ? 'text-mint' : 'text-danger'}`}>
              {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
            </span>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mb-4 text-3xl">
              🔍
            </div>
            <h3 className="text-white font-semibold mb-2">No transactions found</h3>
            <p className="text-neutral-500 text-sm max-w-[240px]">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more results" 
                : "Add your first transaction to get started"}
            </p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-mint text-black font-semibold rounded-full text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, transactions]) => {
            const dailyTotal = transactions.reduce(
              (sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 
              0
            );
            
            return (
              <motion.div 
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
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
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Activity;
