import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useApp } from '../context/AppContext';
import { LINKED_ACCOUNTS } from '../mockData';
import { formatCurrency } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, value, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
    <View style={commonStyles.row}>
      <Ionicons name={icon} size={20} color={colors.neutral400} />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={commonStyles.row}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.neutral600} />
    </View>
  </TouchableOpacity>
);

interface ToggleItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ icon, label, enabled, onToggle }) => (
  <View style={styles.menuItem}>
    <View style={commonStyles.row}>
      <Ionicons name={icon} size={20} color={colors.neutral400} />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggle, enabled && styles.toggleActive]}
      activeOpacity={0.8}
    >
      <MotiView
        animate={{ translateX: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={styles.toggleThumb}
      />
    </TouchableOpacity>
  </View>
);

const Profile: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, preferences, updatePreferences, updateNotificationPreference } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[colors.mint, colors.blue400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.profileName}>{user.name} Johnson</Text>
            <Text style={styles.profileMember}>Member since {user.memberSince}</Text>
          </View>
        </View>

        {/* Linked Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LINKED ACCOUNTS</Text>
          <View style={styles.card}>
            {LINKED_ACCOUNTS.map((account, index) => (
              <View
                key={account.id}
                style={[styles.accountItem, index !== LINKED_ACCOUNTS.length - 1 && styles.borderBottom]}
              >
                <View style={commonStyles.row}>
                  <View style={styles.accountLogo}>
                    <Ionicons name="card" size={20} color={colors.neutral600} />
                  </View>
                  <View>
                    <Text style={styles.accountName}>{account.institutionName}</Text>
                    <Text style={styles.accountType}>
                      {account.accountType} ••••{account.lastFour}
                    </Text>
                  </View>
                </View>
                <View style={styles.accountBalance}>
                  <Text style={[styles.balanceAmount, account.balance < 0 && { color: colors.danger }]}>
                    {formatCurrency(account.balance)}
                  </Text>
                  <View style={commonStyles.row}>
                    <Ionicons name="refresh" size={10} color={colors.neutral500} />
                    <Text style={styles.syncText}>Just now</Text>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addAccountBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color={colors.mint} />
              <Text style={styles.addAccountText}>Link New Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <MenuItem icon="person-outline" label="Personal Info" />
            <MenuItem icon="shield-outline" label="Privacy & Security" />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <MenuItem icon="settings-outline" label="General Settings" value={preferences.currency} />
            <ToggleItem
              icon="moon-outline"
              label="Dark Mode"
              enabled={preferences.theme === 'dark'}
              onToggle={() => updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
            />
            <ToggleItem
              icon="finger-print-outline"
              label="Biometric Login"
              enabled={preferences.biometricEnabled}
              onToggle={() => updatePreferences({ biometricEnabled: !preferences.biometricEnabled })}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <ToggleItem
              icon="notifications-outline"
              label="Push Notifications"
              enabled={preferences.notifications.pushEnabled}
              onToggle={() => updateNotificationPreference('pushEnabled', !preferences.notifications.pushEnabled)}
            />
            <ToggleItem
              icon="alarm-outline"
              label="Bill Reminders"
              enabled={preferences.notifications.billReminders}
              onToggle={() => updateNotificationPreference('billReminders', !preferences.notifications.billReminders)}
            />
            <ToggleItem
              icon="trending-up-outline"
              label="Spending Alerts"
              enabled={preferences.notifications.spendingAlerts}
              onToggle={() => updateNotificationPreference('spendingAlerts', !preferences.notifications.spendingAlerts)}
            />
          </View>
        </View>

        {/* AI Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI FEATURES</Text>
          <View style={styles.card}>
            <ToggleItem
              icon="sparkles-outline"
              label="AI Insights"
              enabled={preferences.aiInsightsEnabled}
              onToggle={() => updatePreferences({ aiInsightsEnabled: !preferences.aiInsightsEnabled })}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={handleExportData}
              disabled={isExporting}
              style={[styles.menuItem, styles.borderBottom]}
              activeOpacity={0.7}
            >
              <View style={commonStyles.row}>
                <Ionicons name="download-outline" size={20} color={colors.neutral400} />
                <Text style={styles.menuLabel}>Export All Data</Text>
              </View>
              <AnimatePresence>
                {isExporting ? (
                  <ActivityIndicator size="small" color={colors.mint} />
                ) : exportSuccess ? (
                  <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={commonStyles.row}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.mint} />
                    <Text style={styles.successText}>Downloaded</Text>
                  </MotiView>
                ) : (
                  <Text style={styles.menuValue}>CSV, JSON</Text>
                )}
              </AnimatePresence>
            </TouchableOpacity>
            <MenuItem icon="open-outline" label="Request Full Data Export" />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Foresight v2.1.0 (Build 2025)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[24],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface200,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
  profileName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  profileMember: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  card: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  menuLabel: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    marginLeft: spacing[4],
  },
  menuValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginRight: spacing[2],
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface400,
    padding: 4,
  },
  toggleActive: {
    backgroundColor: colors.mint,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  accountLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  accountName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  accountType: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    textTransform: 'capitalize',
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: typography.fontSizes.base,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  syncText: {
    fontSize: 10,
    color: colors.neutral500,
    marginLeft: spacing[1],
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  addAccountText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.mint,
  },
  successText: {
    fontSize: typography.fontSizes.sm,
    color: colors.mint,
    marginLeft: spacing[1],
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
  signOutText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.danger,
  },
  version: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral600,
    textAlign: 'center',
    marginTop: spacing[4],
  },
});

export default Profile;
