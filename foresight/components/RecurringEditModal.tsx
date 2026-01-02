import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { colors, typography, spacing, borderRadius } from '../theme';
import { RecurringFrequency, BudgetCategory } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { getFrequencyLabel, getMonthlyAmount, getYearlyAmount, RecurringPattern } from '../utils/recurring';
import { CATEGORY_LABELS } from '../utils/trends';

interface RecurringEditModalProps {
  visible: boolean;
  onClose: () => void;
  pattern: RecurringPattern | null;
  onConfirm: (pattern: RecurringPattern) => void;
  onDelete: (patternId: string) => void;
  onUpdateFrequency: (patternId: string, frequency: RecurringFrequency) => void;
}

const FREQUENCY_OPTIONS: { label: string; value: RecurringFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

const RecurringEditModal: React.FC<RecurringEditModalProps> = ({
  visible,
  onClose,
  pattern,
  onConfirm,
  onDelete,
  onUpdateFrequency,
}) => {
  const [localFrequency, setLocalFrequency] = useState<RecurringFrequency | null>(null);
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    if (pattern) {
      setLocalFrequency(pattern.frequency);
      setIsActive(true);
    }
  }, [pattern]);

  if (!pattern) return null;

  const handleFrequencyChange = (frequency: RecurringFrequency) => {
    setLocalFrequency(frequency);
    onUpdateFrequency(pattern.merchantName, frequency);
  };

  const handleConfirm = () => {
    onConfirm({
      ...pattern,
      frequency: localFrequency || pattern.frequency,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(pattern.merchantName);
    onClose();
  };

  const monthlyAmount = getMonthlyAmount(pattern);
  const yearlyAmount = getYearlyAmount(pattern);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={pattern.isSubscription ? 'repeat' : 'refresh-outline'} 
                  size={24} 
                  color={colors.mint} 
                />
              </View>
              <View>
                <Text style={styles.merchantName}>{pattern.merchantName}</Text>
                <Text style={styles.categoryLabel}>
                  {CATEGORY_LABELS[pattern.category]}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Confidence Badge */}
            <View style={styles.confidenceContainer}>
              <View style={[
                styles.confidenceBadge,
                { 
                  backgroundColor: pattern.confidence > 0.7 
                    ? colors.mintMuted 
                    : pattern.confidence > 0.4 
                      ? 'rgba(255, 184, 0, 0.2)' 
                      : colors.dangerMuted 
                }
              ]}>
                <Ionicons 
                  name={pattern.confidence > 0.7 ? 'checkmark-circle' : 'warning'} 
                  size={16} 
                  color={pattern.confidence > 0.7 
                    ? colors.mint 
                    : pattern.confidence > 0.4 
                      ? colors.warning 
                      : colors.danger
                  } 
                />
                <Text style={[
                  styles.confidenceText,
                  { 
                    color: pattern.confidence > 0.7 
                      ? colors.mint 
                      : pattern.confidence > 0.4 
                        ? colors.warning 
                        : colors.danger
                  }
                ]}>
                  {Math.round(pattern.confidence * 100)}% confident
                </Text>
              </View>
              {pattern.isSubscription && (
                <View style={[styles.confidenceBadge, { backgroundColor: colors.purple500 + '30' }]}>
                  <Ionicons name="card" size={16} color={colors.purple400} />
                  <Text style={[styles.confidenceText, { color: colors.purple400 }]}>
                    Subscription
                  </Text>
                </View>
              )}
            </View>

            {/* Amount Summary */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              style={styles.amountCard}
            >
              <Text style={styles.amountLabel}>Average Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(pattern.averageAmount)}</Text>
              
              <View style={styles.amountBreakdown}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountSublabel}>Monthly</Text>
                  <Text style={styles.amountSubvalue}>{formatCurrency(monthlyAmount)}</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountSublabel}>Yearly</Text>
                  <Text style={styles.amountSubvalue}>{formatCurrency(yearlyAmount)}</Text>
                </View>
              </View>
            </MotiView>

            {/* Frequency Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recurrence</Text>
              <View style={styles.frequencyGrid}>
                {FREQUENCY_OPTIONS.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyOption,
                      localFrequency === freq.value && styles.frequencyOptionActive,
                    ]}
                    onPress={() => handleFrequencyChange(freq.value)}
                  >
                    <Text style={[
                      styles.frequencyText,
                      localFrequency === freq.value && styles.frequencyTextActive,
                    ]}>
                      {freq.label}
                    </Text>
                    {localFrequency === freq.value && (
                      <Ionicons name="checkmark" size={14} color={colors.black} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Next Expected Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Next Expected</Text>
              <View style={styles.nextDateCard}>
                <Ionicons name="calendar-outline" size={20} color={colors.neutral400} />
                <Text style={styles.nextDateText}>
                  {formatDate(pattern.nextExpectedDate)}
                </Text>
              </View>
            </View>

            {/* Transaction History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <View style={styles.transactionHistory}>
                {pattern.transactionIds.slice(-5).map((txId: string, index: number) => (
                  <View key={`${txId}-${index}`} style={styles.transactionItem}>
                    <View style={styles.transactionDot} />
                    <Text style={styles.transactionId}>
                      Transaction #{txId.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                ))}
                {pattern.transactionIds.length > 5 && (
                  <Text style={styles.moreTransactions}>
                    +{pattern.transactionIds.length - 5} more
                  </Text>
                )}
              </View>
            </View>

            {/* Active Toggle */}
            <View style={styles.activeToggle}>
              <View style={styles.activeToggleLeft}>
                <Ionicons 
                  name={isActive ? 'toggle-sharp' : 'toggle-outline'} 
                  size={28} 
                  color={isActive ? colors.mint : colors.neutral500} 
                />
                <Text style={styles.activeToggleLabel}>
                  {isActive ? 'Active' : 'Paused'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.surface400, true: colors.mintMuted }}
                thumbColor={isActive ? colors.mint : colors.neutral400}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={styles.deleteButtonText}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Save Changes</Text>
              <Ionicons name="checkmark" size={20} color={colors.black} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface200,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    maxHeight: '85%',
    borderWidth: 1,
    borderTopColor: colors.surface300,
    borderLeftColor: colors.surface300,
    borderRightColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  categoryLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  closeButton: {
    padding: spacing[2],
  },
  scrollContent: {
    padding: spacing[5],
  },
  confidenceContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  amountCard: {
    backgroundColor: colors.surface300,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[5],
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginBottom: spacing[2],
  },
  amountValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    marginBottom: spacing[4],
  },
  amountBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surface400,
  },
  amountSublabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginBottom: spacing[1],
  },
  amountSubvalue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral200,
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  frequencyOption: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface300,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frequencyOptionActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  frequencyText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral300,
  },
  frequencyTextActive: {
    color: colors.black,
    fontWeight: typography.fontWeights.semibold,
  },
  nextDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface300,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  nextDateText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  transactionHistory: {
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  transactionDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mint,
  },
  transactionId: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    fontFamily: 'monospace',
  },
  moreTransactions: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface300,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  activeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  activeToggleLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface300,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  deleteButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.danger,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    flex: 2,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.mint,
  },
  confirmButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
});

export default RecurringEditModal;
