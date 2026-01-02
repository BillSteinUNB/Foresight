import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import { Subscription, SubscriptionOverlap, formatFrequency, getUpcomingCharges } from '../utils/subscriptions';
import { InsightsStackParamList } from '../navigation/TabNavigator';
import { RecurringFrequency } from '../types';
import { getFrequencyLabel, getMonthlyAmount, getYearlyAmount, RecurringPattern } from '../utils/recurring';
import { CATEGORY_LABELS } from '../utils/trends';
import RecurringEditModal from '../components/RecurringEditModal';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Video Streaming': 'tv-outline',
  'Music Streaming': 'musical-notes-outline',
  'Cloud Storage': 'cloud-outline',
  'News/Reading': 'newspaper-outline',
  'Fitness': 'fitness-outline',
  'AI Tools': 'sparkles-outline',
  'Productivity': 'checkbox-outline',
  subscriptions: 'refresh-outline',
  entertainment: 'game-controller-outline',
  other: 'apps-outline',
};

const getSubscriptionIcon = (sub: Subscription): keyof typeof Ionicons.glyphMap => {
  if (sub.tags[0]) {
    return CATEGORY_ICONS[sub.tags[0]] || 'card-outline';
  }
  return CATEGORY_ICONS[sub.category] || 'card-outline';
};

interface SubscriptionCardProps {
  subscription: Subscription;
  index: number;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, index }) => {
  const icon = getSubscriptionIcon(subscription);
  
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      style={styles.subscriptionCard}
    >
      <View style={styles.subscriptionIcon}>
        <Ionicons name={icon} size={20} color={colors.mint} />
      </View>
      <View style={styles.subscriptionInfo}>
        <Text style={styles.subscriptionName} numberOfLines={1}>
          {subscription.merchantName}
        </Text>
        <Text style={styles.subscriptionFrequency}>
          {formatFrequency(subscription.frequency)}
        </Text>
      </View>
      <View style={styles.subscriptionAmount}>
        <Text style={styles.amountValue}>{formatCurrency(subscription.monthlyAmount)}</Text>
        <Text style={styles.amountPeriod}>/mo</Text>
      </View>
    </MotiView>
  );
};

interface OverlapWarningProps {
  overlap: SubscriptionOverlap;
  index: number;
}

const OverlapWarning: React.FC<OverlapWarningProps> = ({ overlap, index }) => (
  <MotiView
    from={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'timing', duration: 300, delay: index * 100 }}
    style={styles.overlapCard}
  >
    <View style={styles.overlapHeader}>
      <View style={styles.overlapIconContainer}>
        <Ionicons name="warning-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.overlapTitleContainer}>
        <Text style={styles.overlapCategory}>{overlap.category}</Text>
        <Text style={styles.overlapCount}>
          {overlap.subscriptions.length} services
        </Text>
      </View>
      <View style={styles.overlapSavings}>
        <Text style={styles.savingsLabel}>Save up to</Text>
        <Text style={styles.savingsValue}>{formatCurrency(overlap.potentialSavings)}/yr</Text>
      </View>
    </View>
    <Text style={styles.overlapDescription}>{overlap.description}</Text>
    <View style={styles.overlapServices}>
      {overlap.subscriptions.map((sub, i) => (
        <View key={sub.id} style={styles.overlapServicePill}>
          <Text style={styles.overlapServiceText}>{sub.merchantName}</Text>
        </View>
      ))}
    </View>
  </MotiView>
);

interface UpcomingChargeProps {
  subscription: Subscription;
  daysUntil: number;
  index: number;
}

const UpcomingCharge: React.FC<UpcomingChargeProps> = ({ subscription, daysUntil, index }) => {
  const urgencyColor = daysUntil <= 3 ? colors.danger : daysUntil <= 7 ? colors.warning : colors.neutral400;
  const daysText = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`;
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200, delay: index * 50 }}
      style={styles.upcomingItem}
    >
      <View style={[styles.upcomingDot, { backgroundColor: urgencyColor }]} />
      <Text style={styles.upcomingName} numberOfLines={1}>{subscription.merchantName}</Text>
      <Text style={[styles.upcomingDays, { color: urgencyColor }]}>{daysText}</Text>
      <Text style={styles.upcomingAmount}>{formatCurrency(subscription.lastChargeAmount)}</Text>
    </MotiView>
  );
};

interface RecurringPatternCardProps {
  pattern: RecurringPattern;
  index: number;
  onPress: () => void;
}

const RecurringPatternCard: React.FC<RecurringPatternCardProps> = ({ pattern, index, onPress }) => {
  const monthlyAmount = getMonthlyAmount(pattern);
  const confidenceColor = pattern.confidence > 0.7 ? colors.mint : pattern.confidence > 0.4 ? colors.warning : colors.danger;
  
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      style={styles.recurringCard}
    >
      <TouchableOpacity style={styles.recurringCardContent} onPress={onPress} activeOpacity={0.7} accessibilityLabel={`Edit recurring pattern ${pattern.merchantName}`} accessibilityRole="button">
        <View style={styles.recurringIcon}>
          <Ionicons 
            name={pattern.isSubscription ? 'repeat' : 'refresh-outline'} 
            size={18} 
            color={confidenceColor} 
          />
        </View>
        <View style={styles.recurringInfo}>
          <Text style={styles.recurringName} numberOfLines={1}>
            {pattern.merchantName}
          </Text>
          <Text style={styles.recurringCategory}>
            {CATEGORY_LABELS[pattern.category]}
          </Text>
        </View>
        <View style={styles.recurringAmount}>
          <Text style={styles.recurringAmountValue}>{formatCurrency(monthlyAmount)}</Text>
          <Text style={styles.recurringFrequency}>{getFrequencyLabel(pattern.frequency)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.neutral500} />
      </TouchableOpacity>
    </MotiView>
  );
};

const Subscriptions: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  const { 
    subscriptions, 
    subscriptionOverlaps, 
    totalMonthlySubscriptions, 
    totalYearlySubscriptions,
    recurringPatterns,
  } = useApp();

  // Recurring patterns state
  const [selectedPattern, setSelectedPattern] = useState<RecurringPattern | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const upcomingCharges = useMemo(() => {
    return getUpcomingCharges(subscriptions, 14); // Next 14 days
  }, [subscriptions]);

  const hasSubscriptions = subscriptions.length > 0;
  const hasOverlaps = subscriptionOverlaps.length > 0;
  const hasUpcoming = upcomingCharges.length > 0;
  const hasRecurringPatterns = recurringPatterns.length > 0;

  // Handle pattern confirmation (user confirms the detected pattern)
  const handleConfirmPattern = (pattern: RecurringPattern) => {
    // In a real app, this would save the confirmed pattern to state/storage
    console.log('Confirmed pattern:', pattern);
  };

  // Handle pattern deletion (user removes a detected pattern)
  const handleDeletePattern = (patternId: string) => {
    // In a real app, this would remove the pattern from state/storage
    console.log('Deleted pattern:', patternId);
  };

  // Handle frequency update
  const handleUpdateFrequency = (patternId: string, frequency: RecurringFrequency) => {
    // In a real app, this would update the pattern's frequency
    console.log('Updated frequency:', patternId, frequency);
  };

  const openPatternEditor = (pattern: RecurringPattern) => {
    setSelectedPattern(pattern);
    setShowRecurringModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscriptions</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryGlow} />
          <Text style={styles.summaryLabel}>Total Subscriptions</Text>
          <View style={styles.summaryAmounts}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalMonthlySubscriptions)}</Text>
              <Text style={styles.summaryPeriod}>per month</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatCurrency(totalYearlySubscriptions)}</Text>
              <Text style={styles.summaryPeriod}>per year</Text>
            </View>
          </View>
          {hasSubscriptions && (
            <Text style={styles.subscriptionCount}>
              {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
            </Text>
          )}
        </MotiView>

        {/* Overlap Warnings */}
        {hasOverlaps && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.sectionTitle}>Potential Savings</Text>
            </View>
            {subscriptionOverlaps.map((overlap, index) => (
              <OverlapWarning key={overlap.category} overlap={overlap} index={index} />
            ))}
          </View>
        )}

        {/* Upcoming Charges */}
        {hasUpcoming && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.mint} />
              <Text style={styles.sectionTitle}>Upcoming Charges</Text>
            </View>
            <View style={styles.upcomingCard}>
              {upcomingCharges.map((item, index) => (
                <UpcomingCharge 
                  key={item.subscription.id} 
                  subscription={item.subscription}
                  daysUntil={item.daysUntil}
                  index={index}
                />
              ))}
            </View>
          </View>
        )}

        {/* Detected Recurring Patterns */}
        {hasRecurringPatterns && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="repeat-outline" size={18} color={colors.blue400} />
              <Text style={styles.sectionTitle}>Detected Recurring</Text>
            </View>
            <View style={styles.recurringList}>
              {recurringPatterns.slice(0, 5).map((pattern, index) => (
                <RecurringPatternCard
                  key={`${pattern.merchantName}-${index}`}
                  pattern={pattern}
                  index={index}
                  onPress={() => openPatternEditor(pattern)}
                />
              ))}
              {recurringPatterns.length > 5 && (
                <Text style={styles.morePatterns}>
                  +{recurringPatterns.length - 5} more patterns detected
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Subscription List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="refresh-outline" size={18} color={colors.neutral400} />
            <Text style={styles.sectionTitle}>All Subscriptions</Text>
          </View>
          
          {hasSubscriptions ? (
            <View style={styles.subscriptionList}>
              {subscriptions.map((sub, index) => (
                <SubscriptionCard key={sub.id} subscription={sub} index={index} />
              ))}
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.emptyState}
            >
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No subscriptions detected</Text>
              <Text style={styles.emptyText}>
                Add more transactions and we'll automatically detect your recurring subscriptions.
              </Text>
            </MotiView>
          )}
        </View>
      </ScrollView>

      {/* Recurring Pattern Edit Modal */}
      <RecurringEditModal
        visible={showRecurringModal}
        onClose={() => {
          setShowRecurringModal(false);
          setSelectedPattern(null);
        }}
        pattern={selectedPattern}
        onConfirm={handleConfirmPattern}
        onDelete={handleDeletePattern}
        onUpdateFrequency={handleUpdateFrequency}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
    marginBottom: spacing[6],
    overflow: 'hidden',
  },
  summaryGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.mint,
    opacity: 0.1,
  },
  summaryLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    fontFamily: 'monospace',
  },
  summaryPeriod: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginTop: spacing[1],
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.surface400,
    marginHorizontal: spacing[4],
  },
  subscriptionCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.mint,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  overlapCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    marginBottom: spacing[3],
  },
  overlapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  overlapIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  overlapTitleContainer: {
    flex: 1,
  },
  overlapCategory: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  overlapCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  overlapSavings: {
    alignItems: 'flex-end',
  },
  savingsLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  savingsValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
  },
  overlapDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  overlapServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  overlapServicePill: {
    backgroundColor: colors.surface300,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  overlapServiceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral300,
  },
  upcomingCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[3],
  },
  upcomingName: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.white,
  },
  upcomingDays: {
    fontSize: typography.fontSizes.xs,
    marginRight: spacing[3],
  },
  upcomingAmount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    fontFamily: 'monospace',
  },
  subscriptionList: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    marginBottom: spacing[0.5],
  },
  subscriptionFrequency: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  subscriptionAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    fontFamily: 'monospace',
  },
  amountPeriod: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginLeft: spacing[0.5],
  },
  recurringList: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  recurringCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  recurringCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  recurringIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  recurringInfo: {
    flex: 1,
  },
  recurringName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    marginBottom: spacing[0.5],
  },
  recurringCategory: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  recurringAmount: {
    alignItems: 'flex-end',
    marginRight: spacing[3],
  },
  recurringAmountValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  recurringFrequency: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  morePatterns: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    textAlign: 'center',
    padding: spacing[4],
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    textAlign: 'center',
    maxWidth: 260,
    paddingHorizontal: spacing[4],
  },
});

export default Subscriptions;
