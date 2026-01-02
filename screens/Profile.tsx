import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal, Image, TouchableWithoutFeedback } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { exportData, ExportFormat } from '../utils/exportData';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import { DEFAULT_BILL_REMINDER_PREFS } from '../utils/notifications';
import { BillReminderPreferences } from '../types';
import { canUseBiometrics, authenticate, checkBiometricCapability, getBiometricTypeName } from '../utils/biometrics';
import { useAuthStore } from '../stores/useAuthStore';
import { syncService } from '../lib/syncService';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, value, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7} accessibilityLabel={label} accessibilityRole="button">
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
          onPress={() => onUpdate({ enabled: !prefs.enabled })}
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
                    onPress={() => onUpdate({ daysBeforeDue: days })}
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
                    onPress={() => onUpdate({ timeOfDay: { hour, minute: 0 } })}
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showNetWorthModal, setShowNetWorthModal] = useState(false);
  const [netWorthInput, setNetWorthInput] = useState('');

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const capability = await checkBiometricCapability();
      setBiometricAvailable(capability.isAvailable && capability.isEnrolled);
      setBiometricName(getBiometricTypeName(capability.biometricTypes));
    };
    checkBiometrics();
  }, []);

  const handleBiometricToggle = useCallback(async () => {
    // If trying to enable biometrics
    if (!preferences.biometricEnabled) {
      // First check if available
      const isAvailable = await canUseBiometrics();
      if (!isAvailable) {
        Alert.alert(
          'Biometrics Unavailable',
          'Please set up Face ID or Touch ID in your device settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Verify with biometric before enabling
      const result = await authenticate({
        promptMessage: `Enable ${biometricName} for Foresight`,
      });

      if (result.success) {
        updatePreferences({ biometricEnabled: true });
      } else if (result.error && result.error !== 'Authentication cancelled') {
        Alert.alert('Authentication Failed', result.error);
      }
    } else {
      // Disabling - confirm with biometric first
      const result = await authenticate({
        promptMessage: `Disable ${biometricName} for Foresight`,
      });

      if (result.success) {
        updatePreferences({ biometricEnabled: false });
      } else if (result.error && result.error !== 'Authentication cancelled') {
        Alert.alert('Authentication Failed', result.error);
      }
    }
  }, [preferences.biometricEnabled, biometricName, updatePreferences]);

  const handleExportData = useCallback(async (format: ExportFormat = 'json') => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      await exportData(
        { transactions, goals, bills, user, preferences },
        format
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      setExportError(message);
      Alert.alert('Export Failed', message);
    } finally {
      setIsExporting(false);
    }
  }, [transactions, goals, bills, user, preferences]);

  const showExportOptions = useCallback(() => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => handleExportData('csv') },
        { text: 'JSON', onPress: () => handleExportData('json') },
      ]
    );
  }, [handleExportData]);

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
                      await syncService.deleteAllUserData(authUser.id);
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

  const handleSync = useCallback(async () => {
    if (!authUser?.id || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Push local changes first, then pull remote
      await syncService.pushAll(authUser.id);
      await syncService.pullAll(authUser.id);
      setLastSyncTime(new Date());
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [authUser, isSyncing]);

  const handleAvatarPick = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        updateUser({ avatarUri: uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setShowAvatarModal(false);
    }
  }, [updateUser]);

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            updateUser({ avatarUri: null });
            setShowAvatarModal(false);
          },
        },
      ]
    );
  }, [updateUser]);

  const handleSaveNetWorth = useCallback(() => {
    const amount = parseFloat(netWorthInput.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number.');
      return;
    }
    updateUser({ netWorth: amount });
    setShowNetWorthModal(false);
  }, [netWorthInput, updateUser]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={styles.avatarContainer}>
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
            {authUser?.email && (
              <Text style={styles.profileEmail}>{authUser.email}</Text>
            )}
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
                onPress={() => {
                  setNetWorthInput((user.netWorth || 0).toString());
                  setShowNetWorthModal(true);
                }}
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
              label={biometricAvailable ? `${biometricName} Login` : 'Biometric Login'}
              enabled={preferences.biometricEnabled}
              onToggle={handleBiometricToggle}
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
              onPress={handleSync}
              disabled={isSyncing}
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
                {isSyncing ? (
                  <ActivityIndicator size="small" color={colors.mint} />
                ) : lastSyncTime ? (
                  <Text style={styles.menuValue}>
                    {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              onPress={showExportOptions}
              disabled={isExporting}
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
          visible={showAvatarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAvatarModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Profile Photo</Text>
                
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleAvatarPick('camera')}
                  accessibilityLabel="Take photo"
                  accessibilityRole="button"
                >
                  <Ionicons name="camera-outline" size={22} color={colors.white} />
                  <Text style={styles.modalOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleAvatarPick('gallery')}
                  accessibilityLabel="Choose from library"
                  accessibilityRole="button"
                >
                  <Ionicons name="images-outline" size={22} color={colors.white} />
                  <Text style={styles.modalOptionText}>Choose from Library</Text>
                </TouchableOpacity>
                
                {user.avatarUri && (
                  <TouchableOpacity
                    style={[styles.modalOption, styles.modalOptionDanger]}
                    onPress={handleRemoveAvatar}
                    accessibilityLabel="Remove photo"
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.danger} />
                    <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowAvatarModal(false)}
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
          visible={showNetWorthModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNetWorthModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNetWorthModal(false)}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Update Net Worth</Text>
                
                <View style={styles.netWorthInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.netWorthInput}
                    value={netWorthInput}
                    onChangeText={setNetWorthInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.neutral600}
                    autoFocus
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveNetWorth}
                  accessibilityLabel="Save net worth"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalSaveBtnText}>Save</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowNetWorthModal(false)}
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
  profileEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginBottom: spacing[1],
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
});

export default Profile;
