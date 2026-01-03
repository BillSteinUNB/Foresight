import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, Image, TouchableWithoutFeedback } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useApp } from '../context/AppContext';
import { formatCurrency as formatCurrencyNew } from '../utils/currency';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import { DEFAULT_BILL_REMINDER_PREFS } from '../utils/notifications';
import { BillReminderPreferences } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { useAvatar } from '../hooks/useAvatar';
import { useBiometric } from '../hooks/useBiometric';
import { useExport } from '../hooks/useExport';
import { useSync } from '../hooks/useSync';
import { useCurrency, useNetWorth } from '../hooks/useCurrency';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, value, onPress }) => (
  <TouchableOpacity 
    onPress={() => {
      if (onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    }} 
    style={styles.menuItem} 
    activeOpacity={0.7} 
    accessibilityLabel={label} 
    accessibilityRole="button"
  >
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
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={[styles.toggle, enabled && styles.toggleActive]}
      activeOpacity={0.8}
      accessibilityLabel={`Toggle ${label}`}
      accessibilityRole="button"
    >
      <MotiView
        animate={{ translateX: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={styles.toggleThumb}
      />
    </TouchableOpacity>
  </View>
);

// Days before options for bill reminders
const DAYS_BEFORE_OPTIONS = [1, 2, 3, 5, 7];

// Time options (hours) for bill reminders
const TIME_OPTIONS = [
  { hour: 8, label: '8:00 AM' },
  { hour: 9, label: '9:00 AM' },
  { hour: 10, label: '10:00 AM' },
  { hour: 12, label: '12:00 PM' },
  { hour: 17, label: '5:00 PM' },
  { hour: 19, label: '7:00 PM' },
];

interface BillReminderSettingsProps {
  prefs: BillReminderPreferences;
  onUpdate: (updates: Partial<BillReminderPreferences>) => void;
}

const BillReminderSettings: React.FC<BillReminderSettingsProps> = ({ prefs, onUpdate }) => {
  return (
    <View style={styles.reminderSettings}>
      {/* Enable/Disable Toggle */}
      <View style={[styles.menuItem, styles.borderBottom]}>
        <View style={commonStyles.row}>
          <Ionicons name="notifications-outline" size={20} color={colors.neutral400} />
          <Text style={styles.menuLabel}>Enable Reminders</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUpdate({ enabled: !prefs.enabled });
          }}
          style={[styles.toggle, prefs.enabled && styles.toggleActive]}
          activeOpacity={0.8}
          accessibilityLabel="Toggle enable reminders"
          accessibilityRole="button"
        >
          <MotiView
            animate={{ translateX: prefs.enabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={styles.toggleThumb}
          />
        </TouchableOpacity>
      </View>

      {/* Days Before Due */}
      <AnimatePresence>
        {prefs.enabled && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <View style={[styles.settingSection, styles.borderBottom]}>
              <Text style={styles.settingLabel}>Days Before Due</Text>
              <View style={styles.optionRow}>
                {DAYS_BEFORE_OPTIONS.map(days => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate({ daysBeforeDue: days });
                    }}
                    style={[
                      styles.optionPill,
                      prefs.daysBeforeDue === days && styles.optionPillActive,
                    ]}
                    activeOpacity={0.7}
                    accessibilityLabel={`Set reminder to ${days} days before`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        prefs.daysBeforeDue === days && styles.optionPillTextActive,
                      ]}
                    >
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time of Day */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Reminder Time</Text>
              <View style={styles.optionRow}>
                {TIME_OPTIONS.map(({ hour, label }) => (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onUpdate({ timeOfDay: { hour, minute: 0 } });
                    }}
                    style={[
                      styles.optionPill,
                      styles.optionPillWide,
                      prefs.timeOfDay.hour === hour && styles.optionPillActive,
                    ]}
                    activeOpacity={0.7}
                    accessibilityLabel={`Set reminder time to ${label}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        prefs.timeOfDay.hour === hour && styles.optionPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
};

const Profile: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, preferences, transactions, goals, bills, updateUser, updatePreferences, updateNotificationPreference } = useApp();
  const { user: authUser, signOut, deleteAccount, isLoading: authLoading } = useAuthStore();

  // Avatar hook
  const avatar = useAvatar({
    onAvatarUpdate: (uri) => updateUser({ avatarUri: uri }),
  });

  // Biometric hook
  const biometric = useBiometric({
    biometricEnabled: preferences.biometricEnabled,
    onBiometricUpdate: (enabled) => updatePreferences({ biometricEnabled: enabled }),
  });

  // Initialize biometric check
  useEffect(() => {
    biometric.checkBiometrics();
  }, [biometric]);

  // Export hook
  const exportHook = useExport({
    data: { transactions, goals, bills, user, preferences },
  });

  // Sync hook
  const sync = useSync();

  // Currency hook
  const currency = useCurrency({
    currentCurrency: preferences.currency,
    onCurrencyUpdate: (curr) => updatePreferences({ currency: curr }),
  });

  // Net worth hook
  const netWorth = useNetWorth({
    currentNetWorth: user.netWorth || 0,
    onNetWorthUpdate: (amount) => updateUser({ netWorth: amount }),
  });

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for destructive action
            Alert.alert(
              'Are you absolutely sure?',
              'Type DELETE to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    if (authUser?.id) {
                      // Delete all user data from Supabase first
                      // Note: syncService.deleteAllUserData would need to be implemented
                    }
                    await deleteAccount();
                  }
                },
              ]
            );
          }
        },
      ]
    );
  }, [authUser, deleteAccount]);

  const formatCurrency = (amount: number) => formatCurrencyNew(amount, preferences.currency);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => avatar.setShowAvatarModal(true)} style={styles.avatarContainer}>
            {user.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={[colors.mint, colors.blue400]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color={colors.black} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {user.firstName || 'User'}
            </Text>
            <Text style={styles.profileMember}>Member since {user.memberSince}</Text>
          </View>
        </View>

        {/* Net Worth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NET WORTH</Text>
          <View style={styles.card}>
            <View style={styles.netWorthItem}>
              <View style={commonStyles.row}>
                <View style={styles.netWorthIcon}>
                  <Ionicons name="wallet-outline" size={20} color={colors.mint} />
                </View>
                <View>
                  <Text style={styles.netWorthLabel}>Total Net Worth</Text>
                  <Text style={styles.netWorthAmount}>{formatCurrency(user.netWorth || 0)}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={netWorth.openNetWorthModal}
                style={styles.editNetWorthBtn}
                accessibilityLabel="Edit net worth"
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={18} color={colors.mint} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <MenuItem
              icon="person-outline"
              label="Personal Info"
              value={authUser?.email || ''}
            />
            <MenuItem icon="shield-outline" label="Privacy & Security" />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <MenuItem
              icon="settings-outline"
              label="Currency"
              value={currency.currentCurrencyInfo.code}
              onPress={() => currency.setShowCurrencyModal(true)}
            />
            <ToggleItem
              icon="moon-outline"
              label="Dark Mode"
              enabled={preferences.theme === 'dark'}
              onToggle={() => updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
            />
            <ToggleItem
              icon="finger-print-outline"
              label={biometric.biometricAvailable ? `${biometric.biometricName} Login` : 'Biometric Login'}
              enabled={preferences.biometricEnabled}
              onToggle={biometric.handleBiometricToggle}
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

        {/* Bill Reminder Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL REMINDER SETTINGS</Text>
          <View style={styles.card}>
            <BillReminderSettings
              prefs={preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS}
              onUpdate={(updates) => {
                const currentPrefs = preferences.billReminder ?? DEFAULT_BILL_REMINDER_PREFS;
                updatePreferences({
                  billReminder: { ...currentPrefs, ...updates }
                });
              }}
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

        {/* Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLOUD SYNC</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={sync.handleSync}
              disabled={sync.isSyncing}
              style={styles.menuItem}
              activeOpacity={0.7}
              accessibilityLabel="Sync now"
              accessibilityRole="button"
            >
              <View style={commonStyles.row}>
                <Ionicons name="cloud-outline" size={20} color={colors.neutral400} />
                <Text style={styles.menuLabel}>Sync Now</Text>
              </View>
              <View style={commonStyles.row}>
                {sync.isSyncing ? (
                  <ActivityIndicator size="small" color={colors.mint} />
                ) : sync.lastSyncTime ? (
                  <Text style={styles.menuValue}>
                    {sync.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : (
                  <Text style={styles.menuValue}>Not synced</Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.neutral600} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={exportHook.showExportOptions}
              disabled={exportHook.isExporting}
              style={[styles.menuItem, styles.borderBottom]}
              activeOpacity={0.7}
              accessibilityLabel="Export all data"
              accessibilityRole="button"
            >
              <View style={commonStyles.row}>
                <Ionicons name="download-outline" size={20} color={colors.neutral400} />
                <Text style={styles.menuLabel}>Export All Data</Text>
              </View>
              <AnimatePresence>
                {exportHook.isExporting ? (
                  <ActivityIndicator size="small" color={colors.mint} />
                ) : exportHook.exportSuccess ? (
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
        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.7}
          onPress={handleSignOut}
          disabled={authLoading}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          {authLoading ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
          disabled={authLoading}
          accessibilityLabel="Delete account"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={16} color={colors.neutral500} />
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Foresight v2.1.0 (Build 2025)</Text>

        {/* Avatar Picker Modal */}
        <Modal
          visible={avatar.showAvatarModal}
          transparent
          animationType="fade"
          onRequestClose={() => avatar.setShowAvatarModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => avatar.setShowAvatarModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Profile Photo</Text>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => avatar.handleAvatarPick('camera')}
                  accessibilityLabel="Take photo"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={22} color={colors.white} />
                  <Text style={styles.modalOptionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => avatar.handleAvatarPick('gallery')}
                  accessibilityLabel="Choose from library"
                  accessibilityRole="button"
                >
                  <Ionicons name="images-outline" size={22} color={colors.white} />
                  <Text style={styles.modalOptionText}>Choose from Library</Text>
                </TouchableOpacity>

                {user.avatarUri && (
                  <TouchableOpacity
                    style={[styles.modalOption, styles.modalOptionDanger]}
                    onPress={avatar.handleRemoveAvatar}
                    accessibilityLabel="Remove photo"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                    <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Remove Photo</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => avatar.setShowAvatarModal(false)}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* Net Worth Modal */}
        <Modal
          visible={netWorth.showNetWorthModal}
          transparent
          animationType="fade"
          onRequestClose={() => netWorth.setShowNetWorthModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => netWorth.setShowNetWorthModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Update Net Worth</Text>

                <View style={styles.netWorthInputContainer}>
                  <Text style={styles.currencySymbol}>{currency.currentCurrencyInfo.symbol}</Text>
                  <TextInput
                    style={styles.netWorthInput}
                    value={netWorth.netWorthInput}
                    onChangeText={netWorth.setNetWorthInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.neutral600}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={netWorth.handleSaveNetWorth}
                  accessibilityLabel="Save net worth"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalSaveBtnText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => netWorth.setShowNetWorthModal(false)}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* Currency Selector Modal */}
        <Modal
          visible={currency.showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => currency.setShowCurrencyModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => currency.setShowCurrencyModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.currencyModalContent}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <ScrollView style={styles.currencyList}>
                  {currency.currencies.map((curr) => (
                    <TouchableOpacity
                      key={curr.code}
                      style={[
                        styles.currencyItem,
                        curr.code === preferences.currency && styles.currencyItemActive,
                      ]}
                      onPress={() => currency.handleCurrencySelect(curr.code)}
                      accessibilityLabel={`Select ${curr.name}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.currencySymbolText}>{curr.symbol}</Text>
                      <Text style={styles.currencyName}>{curr.name}</Text>
                      <Text style={styles.currencyCode}>{curr.code}</Text>
                      {curr.code === preferences.currency && (
                        <Ionicons name="checkmark" size={20} color={colors.mint} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => currency.setShowCurrencyModal(false)}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

// Add missing import for useCallback
import { useCallback } from 'react';
import { TextInput } from 'react-native';

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
  avatarContainer: {
    position: 'relative',
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.surface200,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.black,
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
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[1],
  },
  deleteAccountText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  version: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral600,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  // Net Worth styles
  netWorthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  netWorthIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 165, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  netWorthLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginBottom: spacing[1],
  },
  netWorthAmount: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
    fontFamily: 'monospace',
  },
  editNetWorthBtn: {
    padding: spacing[2],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '85%',
    maxWidth: 340,
  },
  currencyModalContent: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '85%',
    maxWidth: 340,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  modalOptionDanger: {
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
  },
  modalOptionText: {
    fontSize: typography.fontSizes.base,
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
  modalOptionTextDanger: {
    color: colors.danger,
  },
  modalCancel: {
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  modalCancelText: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral400,
    fontWeight: typography.fontWeights.medium,
  },
  modalSaveBtn: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[4],
  },
  modalSaveBtnText: {
    color: colors.black,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
  },
  netWorthInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    height: 56,
  },
  currencySymbol: {
    fontSize: typography.fontSizes.xl,
    color: colors.mint,
    fontWeight: typography.fontWeights.bold,
    marginRight: spacing[2],
  },
  netWorthInput: {
    flex: 1,
    color: colors.white,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: 'monospace',
  },
  // Bill Reminder Settings styles
  reminderSettings: {
    overflow: 'hidden',
  },
  settingSection: {
    padding: spacing[4],
  },
  settingLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
    marginBottom: spacing[3],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface300,
  },
  optionPillWide: {
    paddingHorizontal: spacing[3],
  },
  optionPillActive: {
    backgroundColor: colors.mintMuted,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 165, 0.5)',
  },
  optionPillText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    fontWeight: typography.fontWeights.medium,
  },
  optionPillTextActive: {
    color: colors.mint,
  },
  // Currency modal styles
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  currencyItemActive: {
    backgroundColor: 'rgba(0, 217, 165, 0.1)',
  },
  currencySymbolText: {
    fontSize: typography.fontSizes.lg,
    width: 40,
    textAlign: 'center',
  },
  currencyName: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
  currencyCode: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginRight: spacing[2],
  },
});

export default Profile;
