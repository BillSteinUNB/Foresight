import React, { useState } from 'react';
import { Home, PieChart, Plus, Zap, User, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Dashboard from './screens/Dashboard';
import Activity from './screens/Activity';
import Insights from './screens/Insights';
import Profile from './screens/Profile';
import AddTransaction from './components/AddTransaction';
import { TRANSACTIONS } from './mockData';
import { Transaction } from './types';

type TabType = 'home' | 'activity' | 'insights' | 'profile';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
      active ? 'text-mint' : 'text-neutral-500 hover:text-neutral-300'
    }`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Function to handle new transaction (updates mock data in memory for session)
  const handleAddTransaction = (newTx: Partial<Transaction>) => {
    const transaction: Transaction = {
      id: `new_${Date.now()}`,
      amount: newTx.amount || 0,
      type: newTx.type || 'expense',
      date: newTx.date || new Date().toISOString(),
      merchantName: newTx.merchantName || 'Unknown',
      category: newTx.category || 'other',
      merchantLogo: newTx.merchantLogo,
      status: newTx.status
    };
    TRANSACTIONS.unshift(transaction);
    // Navigate to activity to see the new transaction
    setActiveTab('activity');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard />;
      case 'activity': return <Activity />;
      case 'insights': return <Insights />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-mint selection:text-black">
      {/* Content Area */}
      <main className="max-w-md mx-auto min-h-screen relative bg-black shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2">
          <div className="max-w-md mx-auto">
            <div className="bg-surface-200/90 backdrop-blur-xl border border-surface-300 rounded-3xl h-20 flex items-center justify-between px-2 shadow-2xl relative">
              
              <NavButton 
                active={activeTab === 'home'} 
                onClick={() => setActiveTab('home')} 
                icon={Home} 
                label="Home" 
              />
              <NavButton 
                active={activeTab === 'activity'} 
                onClick={() => setActiveTab('activity')} 
                icon={PieChart} 
                label="Activity" 
              />

              {/* FAB */}
              <div className="relative -top-8">
                <motion.button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-16 h-16 bg-gradient-to-tr from-mint to-blue-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,217,165,0.4)] text-black"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={32} strokeWidth={2.5} />
                </motion.button>
              </div>

              <NavButton 
                active={activeTab === 'insights'} 
                onClick={() => setActiveTab('insights')} 
                icon={Zap} 
                label="Insights" 
              />
              <NavButton 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
                icon={User} 
                label="Profile" 
              />
            </div>
          </div>
        </nav>
      </main>

      {/* Add Transaction Modal */}
      <AddTransaction 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
};

export default App;
