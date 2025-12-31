import React from 'react';
import { User as UserIcon, Settings, Shield, CreditCard, ChevronRight, LogOut } from 'lucide-react';
import { USER } from '../mockData';

const MenuItem = ({ icon: Icon, label, value, color = 'text-white' }: any) => (
    <div className="flex items-center justify-between p-4 bg-surface-200 border-b border-surface-300 last:border-0 hover:bg-surface-300 transition-colors cursor-pointer group">
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

const Profile: React.FC = () => {
  return (
    <div className="pb-24 pt-4 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-mint to-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-black border-4 border-surface-200">
            {USER.name.charAt(0)}
        </div>
        <div>
            <h1 className="text-2xl font-bold text-white">{USER.name} Johnson</h1>
            <p className="text-neutral-500">Member since 2024</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Account</h3>
            <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
                <MenuItem icon={UserIcon} label="Personal Info" />
                <MenuItem icon={CreditCard} label="Linked Accounts" value="2 Active" />
                <MenuItem icon={Shield} label="Privacy & Data" />
            </div>
        </section>

        <section>
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Preferences</h3>
            <div className="bg-surface-200 rounded-2xl border border-surface-300 overflow-hidden">
                <MenuItem icon={Settings} label="General Settings" />
                <div className="flex items-center justify-between p-4 bg-surface-200 border-b border-surface-300 last:border-0">
                    <span className="text-white font-medium pl-9">AI Insights</span>
                    <div className="w-12 h-6 bg-mint/20 rounded-full p-1 relative cursor-pointer">
                        <div className="w-4 h-4 bg-mint rounded-full absolute right-1" />
                    </div>
                </div>
            </div>
        </section>

        <button className="w-full py-4 text-danger font-medium flex items-center justify-center gap-2">
            <LogOut size={18} />
            Sign Out
        </button>

        <p className="text-center text-neutral-600 text-xs mt-4">Foresight v2.1.0 (Build 2025)</p>
      </div>
    </div>
  );
};

export default Profile;
