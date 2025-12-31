import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight, Clock, Check, X } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Insight } from '../types';
import { useInsightStore } from '../stores';
import { useToast } from '../components/Toast';
import { InsightCardSkeleton } from '../components/Skeleton';

const InsightIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'alert': return <AlertTriangle className="text-warning" size={24} />;
        case 'positive': return <TrendingUp className="text-mint" size={24} />;
        case 'prediction': return <Clock className="text-blue-400" size={24} />;
        default: return <Lightbulb className="text-purple-400" size={24} />;
    }
};

const getInsightGradient = (type: string) => {
  switch (type) {
    case 'alert': return 'from-warning/20 to-transparent';
    case 'positive': return 'from-mint/20 to-transparent';
    case 'prediction': return 'from-blue-500/20 to-transparent';
    case 'subscription': return 'from-purple-500/20 to-transparent';
    default: return 'from-surface-300/50 to-transparent';
  }
};

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss, onAction }) => {
  const [isActioning, setIsActioning] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleAction = () => {
    setIsActioning(true);
    setTimeout(() => {
      onAction(insight.id);
      setIsActioning(false);
    }, 1000);
  };

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(insight.id);
    }, 300);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDismissing ? 0 : 1, y: 0, scale: isDismissing ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-surface-200 rounded-3xl p-6 border border-surface-300 relative overflow-hidden"
    >
      {/* Decorative Background Gradient */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${getInsightGradient(insight.type)} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="p-3 bg-surface-300 rounded-xl shrink-0">
          <InsightIcon type={insight.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-white mb-1 leading-snug">{insight.title}</h3>
            {!insight.isRead && (
              <span className="shrink-0 w-2 h-2 bg-mint rounded-full mt-2" />
            )}
          </div>
          <p className="text-neutral-400 text-sm leading-relaxed">{insight.description}</p>
        </div>
      </div>

      {/* Data Viz / Context */}
      {insight.data && (
        <div className="bg-surface-300/50 rounded-xl p-4 mb-4 relative z-10">
          {insight.data.saved && (
            <div className="text-center">
              <span className="text-neutral-500 text-xs uppercase tracking-wide block mb-1">Potential Savings</span>
              <span className="text-3xl font-light text-white">{formatCurrency(insight.data.saved)}<span className="text-lg text-neutral-400">/yr</span></span>
            </div>
          )}
          {insight.data.amount && !insight.data.saved && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>This month</span>
                <span className="font-mono">{formatCurrency(insight.data.amount)}</span>
              </div>
              <div className="w-full h-3 bg-surface-400 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-warning to-danger"
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>Your average</span>
                <span className="font-mono">$300.00</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 relative z-10">
        <button 
          onClick={handleDismiss}
          disabled={isDismissing}
          className="flex-1 py-2.5 bg-surface-300 text-white text-sm font-medium rounded-xl hover:bg-surface-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <X size={16} />
          Dismiss
        </button>
        <button 
          onClick={handleAction}
          disabled={isActioning}
          className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-70"
        >
          {isActioning ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Check size={16} />
              </motion.div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Take Action</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const Insights: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { insights, dismissInsight, markAsRead, getUnreadCount } = useInsightStore();
  const { showToast } = useToast();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (id: string) => {
    dismissInsight(id);
    showToast('Insight dismissed', 'info');
  };

  const handleAction = (id: string) => {
    markAsRead(id);
    showToast('Action taken!', 'success');
  };

  const unreadCount = getUnreadCount();

  return (
    <div className="pb-24 pt-4 px-4">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Insights</h1>
        {unreadCount > 0 && (
          <span className="px-2.5 py-1 bg-mint/20 text-mint text-xs font-bold rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>
      <p className="text-neutral-400 mb-8">AI-powered suggestions for your wallet.</p>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Loading skeletons
            <>
              <InsightCardSkeleton />
              <InsightCardSkeleton />
              <InsightCardSkeleton />
            </>
          ) : insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 bg-surface-200 rounded-full flex items-center justify-center mb-4 text-4xl border border-surface-300">
                ✨
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">All caught up!</h3>
              <p className="text-neutral-500 text-sm max-w-[260px]">
                You've reviewed all your insights. Check back later for new AI-powered suggestions.
              </p>
            </motion.div>
          ) : (
            insights.map(insight => (
              <InsightCard 
                key={insight.id}
                insight={insight}
                onDismiss={handleDismiss}
                onAction={handleAction}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Insights;
