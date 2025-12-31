import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Settings, 
  Shield, 
  CreditCard, 
  ChevronRight, 
  LogOut,
  Bell,
  Moon,
  Download,
  Smartphone,
  RefreshCw,
  Plus,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore, useTransactionStore, useGoalStore, useBillStore, useInsightStore } from '../stores';
import { formatCurrency } from '../utils';
import { useToast } from '../components/Toast';

interface MenuItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string;
  color?: string;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, value, color = 'text-white', onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-4 bg-surface-200 border-b border-surface-300 last:border-0 hover:bg-surface-300 transition-colors cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <Icon size={20} className="text-neutral-400 group-hover:text-white transition-colors" />
      <span className={`${color} font-medium`}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-neutral-500 text-sm">{value}</span>}
      <ChevronRight size={16} className="text-neutral-600" />
    </div>
  </div>
);

interface ToggleItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ icon: Icon, label, enabled, onToggle }) => (
  <div className="flex items-center justify-between p-4 bg-surface-200 border-b border-surface-300 last:border-0">
    <div className="flex items-center gap-4">
      <Icon size={20} className="text-neutral-400" />
      <span className="text-white font-medium">{label}</span>
    </div>
    <button 
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? 'bg-mint' : 'bg-surface-400'}`}
    >
      <motion.div 
        className="w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

const Profile: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const { showToast } = useToast();

  // Store hooks
  const { 
    user, 
    preferences, 
    linkedAccounts,
    toggleAiInsights,
    toggleBiometric,
    togglePrivacyMode,
    toggleNotification,
    setTheme,
    resetToDefault: resetUser
  } = useUserStore();

  const { transactions, resetToDefault: resetTransactions } = useTransactionStore();
  const { goals, resetToDefault: resetGoals } = useGoalStore();
  const { bills, resetToDefault: resetBills } = useBillStore();
  const { insights, resetToDefault: resetInsights } = useInsightStore();

  const handleExportData = () => {
    setIsExporting(true);
    
    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: { name: user.name, memberSince: user.memberSince },
      transactions,
      goals,
      bills,
      insights,
      preferences
    };
    
    // Simulate export and trigger download
    setTimeout(() => {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foresight-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      showToast('Data exported successfully!', 'success');
    }, 1500);
  };

  const handleResetAllData = () => {
    resetUser();
    resetTransactions();
    resetGoals();
    resetBills();
    resetInsights();
    setShowResetConfirm(false);
    showToast('All data has been reset to defaults', 'success');
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      credit: 'Credit Card',
      investment: 'Investment'
    };
    return labels[type] || type;
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-mint to-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-black border-4 border-surface-200 shadow-lg shadow-mint/20">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.name} Johnson</h1>
          <p className="text-neutral-500">Member since {user.memberSince}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Linked Accounts Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">
            Linked Accounts ({linkedAccounts.length})
          </h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            {linkedAccounts.map((account, index) => (
              <div 
                key={account.id} 
                className={`flex items-center justify-between p-4 ${index !== linkedAccounts.length - 1 ? 'border-b border-surface-300' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {account.logoUrl ? (
                      <img src={account.logoUrl} alt={account.institutionName} className="w-6 h-6 object-contain" />
                    ) : (
                      <CreditCard size={20} className="text-neutral-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{account.institutionName}</span>
                    <span className="text-neutral-500 text-xs">
                      {getAccountTypeLabel(account.accountType)} ••••{account.lastFour}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-mono font-medium ${preferences.privacyMode ? 'blur-sm' : ''} ${account.balance < 0 ? 'text-danger' : 'text-white'}`}>
                    {preferences.privacyMode ? '$••••' : formatCurrency(account.balance)}
                  </span>
                  <div className="flex items-center gap-1 text-neutral-500">
                    <RefreshCw size={10} />
                    <span className="text-[10px]">Just now</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Account Button */}
            <button className="w-full p-4 flex items-center justify-center gap-2 text-mint font-medium hover:bg-surface-300 transition-colors border-t border-surface-300">
              <Plus size={18} />
              <span>Link New Account</span>
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Account</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            <MenuItem icon={UserIcon} label="Personal Info" />
            <MenuItem icon={Shield} label="Privacy & Security" />
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Preferences</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            <MenuItem icon={Settings} label="General Settings" value={preferences.currency} />
            <ToggleItem 
              icon={Moon} 
              label="Dark Mode" 
              enabled={preferences.theme === 'dark'} 
              onToggle={() => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')}
            />
            <ToggleItem 
              icon={Smartphone} 
              label="Biometric Login" 
              enabled={preferences.biometricEnabled} 
              onToggle={toggleBiometric}
            />
            <ToggleItem 
              icon={preferences.privacyMode ? EyeOff : Eye} 
              label="Privacy Mode" 
              enabled={preferences.privacyMode} 
              onToggle={togglePrivacyMode}
            />
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Notifications</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            <ToggleItem 
              icon={Bell} 
              label="Push Notifications" 
              enabled={preferences.notifications.pushEnabled} 
              onToggle={() => toggleNotification('pushEnabled')}
            />
            <ToggleItem 
              icon={Bell} 
              label="Bill Reminders" 
              enabled={preferences.notifications.billReminders} 
              onToggle={() => toggleNotification('billReminders')}
            />
            <ToggleItem 
              icon={Bell} 
              label="Spending Alerts" 
              enabled={preferences.notifications.spendingAlerts} 
              onToggle={() => toggleNotification('spendingAlerts')}
            />
          </div>
        </section>

        {/* AI Features Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">AI Features</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            <ToggleItem 
              icon={() => <span className="text-lg">🤖</span>} 
              label="AI Insights" 
              enabled={preferences.aiInsightsEnabled} 
              onToggle={toggleAiInsights}
            />
          </div>
        </section>

        {/* Data Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Data</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-300 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <Download size={20} className="text-neutral-400" />
                <span className="text-white font-medium">Export All Data</span>
              </div>
              <div className="flex items-center gap-2">
                {isExporting ? (
                  <RefreshCw size={16} className="text-mint animate-spin" />
                ) : (
                  <span className="text-neutral-500 text-sm">JSON</span>
                )}
              </div>
            </button>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-300 transition-colors border-t border-surface-300"
            >
              <div className="flex items-center gap-4">
                <RotateCcw size={20} className="text-neutral-400" />
                <span className="text-white font-medium">Reset to Demo Data</span>
              </div>
              <ChevronRight size={16} className="text-neutral-600" />
            </button>
          </div>
        </section>

        {/* Sign Out */}
        <button className="w-full py-4 text-danger font-medium flex items-center justify-center gap-2 hover:bg-danger/10 rounded-xl transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>

        <p className="text-center text-neutral-600 text-xs mt-4">
          Foresight v2.1.0 (Build 2025)
          <br />
          <span className="text-neutral-700">
            {transactions.length} transactions • {goals.length} goals • {bills.length} bills
          </span>
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowResetConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-200 rounded-2xl p-6 max-w-sm w-full relative z-10 border border-surface-300"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Reset All Data?</h3>
              <p className="text-neutral-400 text-sm mb-6">
                This will reset all transactions, goals, bills, and settings back to the demo data. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-surface-300 text-white font-medium rounded-xl hover:bg-surface-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetAllData}
                  className="flex-1 py-3 bg-danger text-white font-medium rounded-xl hover:bg-danger/90"
                >
                  Reset Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
