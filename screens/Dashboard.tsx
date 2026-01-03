import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

import { useApp } from '../context/AppContext';
import { formatCurrency, formatCompactCurrency, getGreeting, getDaysUntilEndOfMonth } from '../utils';
import { SavingsGoal, Transaction, Bill } from '../types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import HealthDial from '../components/HealthDial';
import LiquidGauge from '../components/LiquidGauge';
import TransactionItem from '../components/TransactionItem';
import TransactionDetail from '../components/TransactionDetail';
import AddGoal from '../components/AddGoal';
import BillFormModal from '../components/BillFormModal';
import PaywallModal from '../components/PaywallModal';
import { TabParamList } from '../navigation/TabNavigator';
import { getHealthScoreInfo } from '../utils/healthScore';

// Pro feature limits
const GOAL_LIMIT = 3;
const BILL_LIMIT = 3;

// Bill input type (matches AppContext expectations)
type NewBillInput = Omit<Bill, 'id' | 'status' | 'isPaid'> & { isPaid?: boolean };

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Dashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const {
    transactions,
    goals,
    bills,
    user,
    addGoal,
    addBill,
    updateBill,
    deleteBill,
    safeToSpend,
    safeToSpendBreakdown,
    healthScoreBreakdown,
    healthScoreSuggestions,
  } = useApp();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paywallFeature, setPaywallFeature] = useState<'goals' | 'bills' | null>(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  // Health score info
  const scoreInfo = useMemo(() => getHealthScoreInfo(healthScoreBreakdown.total), [healthScoreBreakdown.total]);

  // Pro feature limit checks
  const showPaywallForGoals = goals.length >= GOAL_LIMIT;
  const showPaywallForBills = bills.length >= BILL_LIMIT;

  // Memoized calculations
  const totalBills = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.amount, 0),
    [bills]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 4),
    [transactions]
  );

  // Filter bills and goals based on search query
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const query = searchQuery.toLowerCase();
    return bills.filter(bill => bill.name.toLowerCase().includes(query));
  }, [bills, searchQuery]);

  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    const query = searchQuery.toLowerCase();
    return goals.filter(goal => goal.name.toLowerCase().includes(query));
  }, [goals, searchQuery]);

  const daysUntilReset = useMemo(() => getDaysUntilEndOfMonth(), []);
  const greeting = useMemo(() => getGreeting(), []);

  // Callbacks
  const handleAddGoal = useCallback((newGoal: Omit<SavingsGoal, 'id'>) => {
    addGoal(newGoal);
    setIsAddGoalOpen(false);
  }, [addGoal]);

  const handleAddBill = useCallback(() => {
    if (showPaywallForBills) {
      setPaywallFeature('bills');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setEditingBill(null);
    setIsBillModalOpen(true);
  }, [showPaywallForBills]);

  const handleOpenGoalsModal = useCallback(() => {
    if (showPaywallForGoals) {
      setPaywallFeature('goals');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setIsAddGoalOpen(true);
  }, [showPaywallForGoals]);

  const handleEditBill = useCallback((bill: Bill) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  }, []);

  const handleDeleteBill = useCallback((bill: Bill) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete "${bill.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            deleteBill(bill.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, [deleteBill]);

  const handleAddBillForm = useCallback((billData: NewBillInput) => {
    addBill(billData);
    setIsBillModalOpen(false);
  }, [addBill]);

  // Hardcoded for demo
  const hardcodedSafeToSpend = 547.01;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={commonStyles.row}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSearchOpen(!isSearchOpen);
              }}
              style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
              accessibilityLabel={isSearchOpen ? "Close search" : "Open search"}
              accessibilityRole="button"
            >
              <Ionicons name="search" size={18} color={isSearchOpen ? colors.black : colors.neutral400} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationBtn} 
              accessibilityLabel="View notifications" 
              accessibilityRole="button"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 56 }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.searchContainer}
            >
              <Ionicons name="search" size={18} color={colors.neutral500} style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search bills & goals..."
                placeholderTextColor={colors.neutral600}
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton} accessibilityLabel="Clear search" accessibilityRole="button">
                  <Ionicons name="close-circle" size={18} color={colors.neutral400} />
                </TouchableOpacity>
              )}
            </MotiView>
          )}
        </AnimatePresence>

        {/* Safe To Spend Card */}
        <MotiView
          from={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.heroLabel}>SAFE TO SPEND</Text>
          <Text style={styles.heroAmount}>{formatCurrency(hardcodedSafeToSpend)}</Text>
          <Text style={styles.heroSubtext}>
            until end of month{' '}
            <View style={styles.daysChip}>
              <Text style={styles.daysChipText}>↻ {daysUntilReset} days</Text>
            </View>
          </Text>

          {/* Breakdown */}
          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Income</Text>
              <Text style={styles.breakdownValue}>{formatCompactCurrency(safeToSpendBreakdown.monthlyIncome)}</Text>
            </View>
            <Text style={styles.breakdownDivider}>-</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Bills</Text>
              <Text style={styles.breakdownValue}>{formatCompactCurrency(safeToSpendBreakdown.unpaidBills)}</Text>
            </View>
            <Text style={styles.breakdownDivider}>=</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Safe</Text>
              <Text style={[styles.breakdownValue, { color: colors.mint }]}>
                {formatCompactCurrency(hardcodedSafeToSpend)}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Health Dial & Net Worth */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.dialCard}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowHealthDetails(!showHealthDetails);
            }}
            accessibilityLabel="View health score details"
            accessibilityRole="button"
          >
            <View style={commonStyles.rowBetween}>
              <Text style={styles.sectionLabel}>FIN HEALTH</Text>
              <Ionicons 
                name={showHealthDetails ? "chevron-up" : "chevron-down"} 
                size={14} 
                color={colors.neutral500} 
              />
            </View>
            <HealthDial score={healthScoreBreakdown.total} />
          </TouchableOpacity>
          <View style={styles.netWorthCard}>
            <View style={commonStyles.rowBetween}>
              <Text style={styles.sectionLabel}>NET WORTH</Text>
              <Ionicons name="trending-up" size={16} color={colors.mint} />
            </View>
            <Text style={styles.netWorthAmount}>{formatCompactCurrency(user.netWorth || 0)}</Text>
            <View style={commonStyles.row}>
              <Ionicons name="arrow-up" size={12} color={colors.mint} />
              <Text style={styles.netWorthChange}>+$1.2k this month</Text>
            </View>
          </View>
        </View>

        {/* Health Score Details (Collapsible) */}
        <AnimatePresence>
          {showHealthDetails && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.healthDetailsCard}
            >
              {/* Score Badge */}
              <View style={[styles.healthBadge, { backgroundColor: `${scoreInfo.color}20` }]}>
                <Text style={[styles.healthBadgeText, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
              </View>

              {/* Factor Breakdown */}
              <View style={styles.healthFactors}>
                {[
                  { key: 'savingsRate', label: 'Savings Rate', icon: 'wallet' as const },
                  { key: 'budgetAdherence', label: 'Budget Adherence', icon: 'pie-chart' as const },
                  { key: 'billPunctuality', label: 'Bill Punctuality', icon: 'calendar' as const },
                  { key: 'debtToIncome', label: 'Debt to Income', icon: 'trending-down' as const },
                  { key: 'emergencyFund', label: 'Emergency Fund', icon: 'shield-checkmark' as const },
                ].map((factor) => {
                  const data = healthScoreBreakdown[factor.key as keyof typeof healthScoreBreakdown] as { score: number; maxScore: number; details: string };
                  const percentage = (data.score / data.maxScore) * 100;
                  return (
                    <View key={factor.key} style={styles.healthFactorRow}>
                      <View style={styles.healthFactorLabel}>
                        <Ionicons name={factor.icon} size={12} color={colors.neutral400} />
                        <Text style={styles.healthFactorName}>{factor.label}</Text>
                      </View>
                      <View style={styles.healthFactorBarContainer}>
                        <View style={styles.healthFactorBar}>
                          <View 
                            style={[
                              styles.healthFactorFill, 
                              { 
                                width: `${percentage}%`,
                                backgroundColor: percentage >= 70 ? colors.mint : percentage >= 40 ? colors.warning : colors.danger 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.healthFactorScore}>{data.score}/{data.maxScore}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Quick Improvement Suggestions */}
              {healthScoreSuggestions.length > 0 && (
                <View style={styles.healthSuggestions}>
                  <Text style={styles.healthSuggestionsTitle}>Quick Wins</Text>
                  {healthScoreSuggestions.slice(0, 2).map((suggestion, index) => (
                    <View key={index} style={styles.healthSuggestionRow}>
                      <Ionicons name="bulb" size={12} color={colors.mint} />
                      <Text style={styles.healthSuggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </MotiView>
          )}
        </AnimatePresence>

        {/* Upcoming Bills */}
        <View style={styles.section}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleAddBill();
              }} 
              accessibilityLabel="Add bill" 
              accessibilityRole="button"
            >
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {filteredBills.map(bill => (
            <TouchableOpacity
              key={bill.id}
              style={styles.billItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleEditBill(bill);
              }}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleDeleteBill(bill);
              }}
              accessibilityLabel={`Edit bill ${bill.name}`}
              accessibilityRole="button"
            >
              <View style={commonStyles.row}>
                <View style={[
                  styles.billIndicator,
                  { backgroundColor: bill.status === 'danger' ? colors.danger :
                                    bill.status === 'warning' ? colors.warning : colors.mint }
                ]} />
                <View>
                  <Text style={styles.billName}>{bill.name}</Text>
                  <Text style={styles.billDate}>
                    Due {new Date(bill.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={commonStyles.row}>
                <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text>
                <Ionicons name="create-outline" size={16} color={colors.neutral500} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Savings Goals */}
        <View style={styles.section}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleOpenGoalsModal();
            }} accessibilityLabel="Add savings goal" accessibilityRole="button">
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalsScroll}
          >
            {filteredGoals.map(goal => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <TouchableOpacity 
                  key={goal.id} 
                  style={styles.goalCard} 
                  activeOpacity={0.8}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  accessibilityLabel={`${goal.name}, ${Math.round(percentage)}% complete`} 
                  accessibilityRole="button"
                >
                  <View style={styles.goalIconContainer}>
                    <LiquidGauge percentage={percentage} color={goal.color} size={80} />
                    <View style={styles.goalEmoji}>
                      <Text style={styles.goalEmojiText}>{goal.icon}</Text>
                    </View>
                  </View>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalProgress}>{formatCompactCurrency(goal.currentAmount)}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity 
              style={styles.addGoalCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleOpenGoalsModal();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Add new savings goal"
              accessibilityRole="button"
            >
              <Text style={styles.addGoalIcon}>➕</Text>
              <Text style={styles.addGoalText}>Add Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Activity');
              }} 
              accessibilityLabel="View all activity" 
              accessibilityRole="button"
            >
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {recentTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onPress={() => setSelectedTransaction(t)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddGoal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAdd={handleAddGoal}
      />
      <BillFormModal
        visible={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setEditingBill(null);
        }}
        onAdd={handleAddBillForm}
        onUpdate={updateBill}
        onDelete={deleteBill}
        mode={editingBill ? 'edit' : 'create'}
        initialBill={editingBill || undefined}
      />
      <TransactionDetail
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      {/* Paywall Modal */}
      <PaywallModal
        visible={paywallFeature !== null}
        onClose={() => setPaywallFeature(null)}
        feature={paywallFeature || 'goals'}
        currentCount={paywallFeature === 'goals' ? goals.length : bills.length}
        limit={paywallFeature === 'goals' ? GOAL_LIMIT : BILL_LIMIT}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[4],
  },
  greeting: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  userName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface200,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  iconButtonActive: {
    backgroundColor: colors.mint,
  },
  searchContainer: {
    marginBottom: spacing[4],
  },
  searchIcon: {
    position: 'absolute',
    left: spacing[4],
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.surface200,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[3],
    paddingLeft: spacing[11],
    paddingRight: spacing[10],
    color: colors.white,
    fontSize: typography.fontSizes.base,
  },
  clearButton: {
    position: 'absolute',
    right: spacing[3],
    top: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: colors.danger,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.black,
  },
  heroCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  heroGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    backgroundColor: colors.mintMuted,
    borderRadius: 100,
    opacity: 0.3,
  },
  heroLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing[2],
  },
  heroAmount: {
    fontSize: typography.fontSizes['5xl'],
    fontWeight: typography.fontWeights.light,
    color: colors.mint,
    marginBottom: spacing[1],
  },
  heroSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginBottom: spacing[6],
  },
  daysChip: {
    backgroundColor: colors.surface300,
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  daysChipText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral300,
  },
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 26, 26, 0.5)',
    paddingTop: spacing[4],
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginBottom: spacing[1],
  },
  breakdownValue: {
    fontSize: typography.fontSizes.sm,
    fontFamily: 'monospace',
    color: colors.white,
  },
  breakdownDivider: {
    color: colors.neutral600,
    fontSize: typography.fontSizes.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  dialCard: {
    flex: 1,
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  netWorthCard: {
    flex: 1,
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.surface300,
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing[2],
  },
  netWorthAmount: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  netWorthChange: {
    fontSize: typography.fontSizes.xs,
    color: colors.mint,
    marginLeft: spacing[1],
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[4],
  },
  addButton: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.mint,
  },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface200,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  billIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[3],
  },
  billName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  billDate: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  billAmount: {
    fontSize: typography.fontSizes.base,
    fontFamily: 'monospace',
    color: colors.white,
  },
  goalsScroll: {
    paddingRight: spacing[4],
    gap: spacing[4],
  },
  goalCard: {
    alignItems: 'center',
    width: 100,
  },
  goalIconContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  goalEmoji: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -16 }],
    backgroundColor: colors.surface200,
    borderRadius: borderRadius.full,
    padding: spacing[1],
    borderWidth: 1,
    borderColor: colors.surface300,
    zIndex: 10,
  },
  goalEmojiText: {
    fontSize: 20,
  },
  goalName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    textAlign: 'center',
  },
  goalProgress: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  addGoalCard: {
    width: 100,
    height: 150,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.surface400,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  addGoalIcon: {
    fontSize: 24,
  },
  addGoalText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  viewAll: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  transactionList: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  // Health Score Details styles
  healthDetailsCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.surface300,
    marginBottom: spacing[4],
    marginTop: -spacing[4],
  },
  healthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
  },
  healthBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  healthFactors: {
    gap: spacing[3],
  },
  healthFactorRow: {
    gap: spacing[1],
  },
  healthFactorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  healthFactorName: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
  },
  healthFactorBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  healthFactorBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surface400,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  healthFactorFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  healthFactorScore: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.neutral500,
    width: 32,
    textAlign: 'right',
  },
  healthSuggestions: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.surface400,
    gap: spacing[2],
  },
  healthSuggestionsTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral300,
    marginBottom: spacing[1],
  },
  healthSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  healthSuggestionText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
    lineHeight: 16,
  },
});

export default Dashboard;
