import React from 'react';
import { INSIGHTS } from '../mockData';
import { Lightbulb, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils';

const InsightIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'alert': return <AlertTriangle className="text-warning" size={24} />;
        case 'positive': return <TrendingUp className="text-mint" size={24} />;
        default: return <Lightbulb className="text-blue-500" size={24} />;
    }
};

const Insights: React.FC = () => {
  return (
    <div className="pb-24 pt-4 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Insights</h1>
      <p className="text-neutral-400 mb-8">AI-powered suggestions for your wallet.</p>

      <div className="space-y-6">
        {INSIGHTS.map(insight => (
            <div key={insight.id} className="bg-surface-200 rounded-3xl p-6 border border-surface-300 relative overflow-hidden">
                {/* Decorative Background */}
                {insight.type === 'alert' && <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                {insight.type === 'positive' && <div className="absolute top-0 right-0 w-32 h-32 bg-mint/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}

                <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="p-3 bg-surface-300 rounded-xl">
                        <InsightIcon type={insight.type} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1 leading-snug">{insight.title}</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed">{insight.description}</p>
                    </div>
                </div>

                {/* Data Viz / Context */}
                {insight.data && (
                    <div className="bg-surface-300/50 rounded-xl p-4 mb-4 relative z-10">
                        {insight.data.saved && (
                            <div className="text-center">
                                <span className="text-neutral-500 text-xs uppercase tracking-wide block mb-1">Potential Savings</span>
                                <span className="text-3xl font-light text-white">{formatCurrency(insight.data.saved)}/yr</span>
                            </div>
                        )}
                        {insight.data.amount && (
                            <div className="w-full">
                                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                    <span>This month</span>
                                    <span>{formatCurrency(insight.data.amount)}</span>
                                </div>
                                <div className="w-full h-2 bg-surface-400 rounded-full overflow-hidden">
                                    <div className="h-full bg-warning w-3/4" />
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                                    <span>Average</span>
                                    <span>$300.00</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 relative z-10">
                    <button className="flex-1 py-2.5 bg-surface-300 text-white text-sm font-medium rounded-xl hover:bg-surface-400 transition-colors">
                        Dismiss
                    </button>
                    <button className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                        Take Action
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Insights;
