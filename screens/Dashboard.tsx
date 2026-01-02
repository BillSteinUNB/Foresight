import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

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
import { TabParamList } from '../navigation/TabNavigator';

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
  } = useApp();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Memoized calculations
  const totalBills = useMemo(
    () => bills.reduce((sum, bill) => sum + bill.amount, 0),
    [bills]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 4),
    [transactions]
  );

  const daysUntilReset = useMemo(() => getDaysUntilEndOfMonth(), []);
  const greeting = useMemo(() => getGreeting(), []);

  // Callbacks
  const handleAddGoal = useCallback((newGoal: Omit<SavingsGoal, 'id'>) => {
    addGoal(newGoal);
    setIsAddGoalOpen(false);
  }, [addGoal]);

  const handleAddBill = useCallback(() => {
    setEditingBill(null);
    setIsBillModalOpen(true);
  }, []);

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
          onPress: () => deleteBill(bill.id),
        },
      ],
    );
  }, [deleteBill]);

  const handleAddBillForm = useCallback((billData: any) => {
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
          <TouchableOpacity style={styles.notificationBtn} accessibilityLabel="View notifications" accessibilityRole="button">
            <Ionicons name="notifications-outline" size={20} color={colors.white} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

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
          <View style={styles.dialCard}>
            <Text style={styles.sectionLabel}>FIN HEALTH</Text>
            <HealthDial score={user.financialHealthScore} />
          </View>
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

        {/* Upcoming Bills */}
        <View style={styles.section}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <TouchableOpacity onPress={handleAddBill} accessibilityLabel="Add bill" accessibilityRole="button">
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {bills.map(bill => (
            <TouchableOpacity
              key={bill.id}
              style={styles.billItem}
              activeOpacity={0.7}
              onPress={() => handleEditBill(bill)}
              onLongPress={() => {
                // Long press to show delete option (simple implementation)
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
            <TouchableOpacity onPress={() => setIsAddGoalOpen(true)} accessibilityLabel="Add savings goal" accessibilityRole="button">
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalsScroll}
          >
            {goals.map(goal => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <TouchableOpacity key={goal.id} style={styles.goalCard} activeOpacity={0.8} accessibilityLabel={`${goal.name}, ${Math.round(percentage)}% complete`} accessibilityRole="button">
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
              onPress={() => setIsAddGoalOpen(true)}
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
            <TouchableOpacity onPress={() => navigation.navigate('Activity')} accessibilityLabel="View all activity" accessibilityRole="button">
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
});

export default Dashboard;
