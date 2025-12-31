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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { USER, LINKED_ACCOUNTS, USER_PREFERENCES } from '../mockData';
import { formatCurrency } from '../utils';

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
  const [preferences, setPreferences] = useState(USER_PREFERENCES);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const togglePreference = (key: keyof typeof preferences) => {
    if (typeof preferences[key] === 'boolean') {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const toggleNotification = (key: keyof typeof preferences.notifications) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleExportData = () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
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
            {USER.name.charAt(0)}
        </div>
        <div>
            <h1 className="text-2xl font-bold text-white">{USER.name} Johnson</h1>
            <p className="text-neutral-500">Member since {USER.memberSince}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Linked Accounts Section */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Linked Accounts</h3>
          <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
            {LINKED_ACCOUNTS.map((account, index) => (
              <div 
                key={account.id} 
                className={`flex items-center justify-between p-4 ${index !== LINKED_ACCOUNTS.length - 1 ? 'border-b border-surface-300' : ''}`}
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
                  <span className={`font-mono font-medium ${account.balance < 0 ? 'text-danger' : 'text-white'}`}>
                    {formatCurrency(account.balance)}
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
              onToggle={() => setPreferences(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
            />
            <ToggleItem 
              icon={Smartphone} 
              label="Biometric Login" 
              enabled={preferences.biometricEnabled} 
              onToggle={() => togglePreference('biometricEnabled')}
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
              onToggle={() => togglePreference('aiInsightsEnabled')}
            />
          </div>
        </section>

        {/* Data Export Section */}
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
                <AnimatePresence mode="wait">
                  {isExporting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <RefreshCw size={16} className="text-mint animate-spin" />
                    </motion.div>
                  ) : exportSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-mint"
                    >
                      <Check size={16} />
                      <span className="text-sm">Downloaded</span>
                    </motion.div>
                  ) : (
                    <span className="text-neutral-500 text-sm">CSV, JSON</span>
                  )}
                </AnimatePresence>
              </div>
            </button>
            <div className="flex items-center justify-between p-4 border-t border-surface-300 hover:bg-surface-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <ExternalLink size={20} className="text-neutral-400" />
                <span className="text-white font-medium">Request Full Data Export</span>
              </div>
              <ChevronRight size={16} className="text-neutral-600" />
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <button className="w-full py-4 text-danger font-medium flex items-center justify-center gap-2 hover:bg-danger/10 rounded-xl transition-colors">
            <LogOut size={18} />
            Sign Out
        </button>

        <p className="text-center text-neutral-600 text-xs mt-4">Foresight v2.1.0 (Build 2025)</p>
      </div>
    </div>
  );
};

export default Profile;
