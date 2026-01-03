import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';
import TransactionDetail from '../components/TransactionDetail';
import { formatDate } from '../utils';
import { formatCurrency as formatCurrencyNew } from '../utils/currency';
import { Transaction, BudgetCategory } from '../types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import { useFiltering, filterTransactions } from '../hooks/useFiltering';
import { useBulkSelection } from '../hooks/useBulkSelection';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food_dining: '🍔 Food',
  transportation: '🚕 Transport',
  shopping: '🛍️ Shopping',
  entertainment: '🎬 Fun',
  bills_utilities: '💡 Bills',
  health_fitness: '💪 Health',
  travel: '✈️ Travel',
  income: '💰 Income',
  subscriptions: '🔄 Subs',
  other: '📦 Other',
};

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterChip, active && styles.filterChipActive]}
    activeOpacity={0.7}
    accessibilityLabel={`Show ${label} transactions`}
    accessibilityRole="button"
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Activity: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransactions, recurringTransactionIds } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Use the filtering hook
  const filtering = useFiltering(transactions);

  // Use bulk selection hook
  const bulkSelection = useBulkSelection<Transaction>({
    onBulkDelete: (ids) => deleteTransactions(ids),
  });

  // Filter transactions using the helper function
  const filteredTransactions = useMemo(() => {
    return filterTransactions(
      transactions,
      filtering.filter,
      filtering.dateRangeBounds,
      filtering.searchQuery,
      filtering.selectedCategories
    );
  }, [transactions, filtering.filter, filtering.dateRangeBounds, filtering.searchQuery, filtering.selectedCategories]);

  // Group by date
  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const date = formatDate(t.date);
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  // Totals
  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => formatCurrencyNew(amount, 'USD'); // Default to USD for now

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {bulkSelection.selectionMode ? (
            <>
              <TouchableOpacity onPress={bulkSelection.exitSelectionMode} style={styles.cancelBtn} accessibilityLabel="Cancel selection" accessibilityRole="button">
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.selectionCount}>
                {bulkSelection.selectedCount} selected
              </Text>
              <View style={commonStyles.row}>
                <TouchableOpacity onPress={() => bulkSelection.toggleSelectAll(filteredTransactions)} style={styles.selectAllBtn} accessibilityLabel="Select all transactions" accessibilityRole="button">
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Activity</Text>
              <View style={commonStyles.row}>
                <TouchableOpacity
                  onPress={() => filtering.setSearchQuery(filtering.searchQuery ? '' : '')}
                  style={[styles.iconButton, filtering.searchQuery.length > 0 && styles.iconButtonActive]}
                  accessibilityLabel="Search transactions"
                  accessibilityRole="button"
                >
                  <Ionicons name="search" size={18} color={filtering.searchQuery.length > 0 ? colors.black : colors.neutral400} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={filtering.toggleFilters}
                  style={[styles.iconButton, filtering.showFilters && styles.iconButtonActive]}
                  accessibilityLabel="Filter transactions"
                  accessibilityRole="button"
                >
                  <Ionicons name="options-outline" size={18} color={filtering.showFilters ? colors.black : colors.neutral400} />
                  {filtering.hasActiveFilters && !filtering.showFilters && <View style={styles.filterBadge} />}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {bulkSelection.selectionMode && bulkSelection.selectedCount > 0 && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 56 }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.bulkActionBar}
            >
              <TouchableOpacity onPress={bulkSelection.handleBulkDelete} style={styles.bulkDeleteBtn} accessibilityLabel={`Delete ${bulkSelection.selectedCount} transactions`} accessibilityRole="button">
                <Ionicons name="trash-outline" size={18} color={colors.white} />
                <Text style={styles.bulkDeleteText}>Delete ({bulkSelection.selectedCount})</Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <AnimatePresence>
          {filtering.searchQuery !== undefined && filtering.searchQuery !== null && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 56 }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.searchContainer}
            >
              <Ionicons name="search" size={18} color={colors.neutral500} style={styles.searchIcon} />
              <TextInput
                value={filtering.searchQuery}
                onChangeText={filtering.setSearchQuery}
                placeholder="Search transactions..."
                placeholderTextColor={colors.neutral600}
                style={styles.searchInput}
                autoFocus
              />
              {filtering.searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => filtering.setSearchQuery('')} style={styles.clearButton} accessibilityLabel="Clear search" accessibilityRole="button">
                  <Ionicons name="close-circle" size={18} color={colors.neutral400} />
                </TouchableOpacity>
              )}
            </MotiView>
          )}
        </AnimatePresence>

        {/* Type Filters */}
        <View style={styles.filterRow}>
          <FilterChip label="All" active={filtering.filter === 'all'} onPress={() => filtering.setFilter('all')} />
          <FilterChip label="Income" active={filtering.filter === 'income'} onPress={() => filtering.setFilter('income')} />
          <FilterChip label="Expenses" active={filtering.filter === 'expense'} onPress={() => filtering.setFilter('expense')} />
        </View>

        {/* Category Filters */}
        <AnimatePresence>
          {filtering.showFilters && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.categoryFilters}
            >
              {/* Date Range Section */}
              <View style={styles.filterSection}>
                <Text style={styles.categoryLabel}>Date Range</Text>
                <View style={styles.dateRangePills}>
                  <TouchableOpacity
                    onPress={() => filtering.setDateRange('all')}
                    style={[styles.dateRangePill, filtering.dateRange === 'all' && styles.dateRangePillActive]}
                    accessibilityLabel="Filter by All Time"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dateRangePillText, filtering.dateRange === 'all' && styles.dateRangePillTextActive]}>
                      All Time
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => filtering.setDateRange('today')}
                    style={[styles.dateRangePill, filtering.dateRange === 'today' && styles.dateRangePillActive]}
                    accessibilityLabel="Filter by Today"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dateRangePillText, filtering.dateRange === 'today' && styles.dateRangePillTextActive]}>
                      Today
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => filtering.setDateRange('week')}
                    style={[styles.dateRangePill, filtering.dateRange === 'week' && styles.dateRangePillActive]}
                    accessibilityLabel="Filter by This Week"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dateRangePillText, filtering.dateRange === 'week' && styles.dateRangePillTextActive]}>
                      This Week
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => filtering.setDateRange('month')}
                    style={[styles.dateRangePill, filtering.dateRange === 'month' && styles.dateRangePillActive]}
                    accessibilityLabel="Filter by This Month"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dateRangePillText, filtering.dateRange === 'month' && styles.dateRangePillTextActive]}>
                      This Month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Categories Section */}
              <View style={styles.filterSection}>
                <View style={commonStyles.rowBetween}>
                  <Text style={styles.categoryLabel}>Categories</Text>
                  {filtering.selectedCategories.size > 0 && (
                    <TouchableOpacity onPress={() => filtering.clearFilters()} accessibilityLabel="Clear category filters" accessibilityRole="button">
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.categoryPills}>
                  {filtering.allCategories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => filtering.toggleCategory(cat)}
                      style={[styles.categoryPill, filtering.selectedCategories.has(cat) && styles.categoryPillActive]}
                      accessibilityLabel={`Filter by ${CATEGORY_LABELS[cat]}`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.categoryPillText, filtering.selectedCategories.has(cat) && styles.categoryPillTextActive]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        {filteredTransactions.length > 0 && (
          <View style={styles.statsSummary}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: colors.mint }]}>+{formatCurrency(totals.income)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>-{formatCurrency(totals.expenses)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={[styles.statValue, { color: totals.net >= 0 ? colors.mint : colors.danger }]}>
                {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
              </Text>
            </View>
          </View>
        )}

        {/* Transaction List */}
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyText}>
              {filtering.hasActiveFilters ? 'Try adjusting your filters' : 'Add your first transaction'}
            </Text>
            {filtering.hasActiveFilters && (
              <TouchableOpacity onPress={filtering.clearFilters} style={styles.clearFiltersBtn} accessibilityLabel="Clear all filters" accessibilityRole="button">
                <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          Object.entries(grouped).map(([date, dateTransactions]) => {
            const dailyTotal = dateTransactions.reduce(
              (sum, t) => t.type === 'expense' ? sum - t.amount : sum + t.amount, 0
            );
            return (
              <MotiView
                key={date}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.dateSection}
              >
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{date}</Text>
                  <Text style={[styles.dailyTotal, dailyTotal > 0 && { color: colors.mint }]}>
                    {dailyTotal > 0 ? '+' : ''}{formatCurrency(dailyTotal)}
                  </Text>
                </View>
                <View style={styles.transactionList}>
                  {dateTransactions.map(t => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onPress={() => bulkSelection.selectionMode ? bulkSelection.toggleSelection(t.id) : setSelectedTransaction(t)}
                      onLongPress={() => bulkSelection.enterSelectionMode(t.id)}
                      selectionMode={bulkSelection.selectionMode}
                      selected={bulkSelection.isSelected(t.id)}
                      onToggleSelected={() => bulkSelection.toggleSelection(t.id)}
                      isRecurring={recurringTransactionIds.has(t.id)}
                    />
                  ))}
                </View>
              </MotiView>
            );
          })
        )}
      </ScrollView>

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
    marginBottom: spacing[4],
    marginTop: spacing[4],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface200,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  iconButtonActive: {
    backgroundColor: colors.mint,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mint,
    borderWidth: 2,
    borderColor: colors.black,
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface200,
  },
  filterChipActive: {
    backgroundColor: colors.mint,
  },
  filterChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral400,
  },
  filterChipTextActive: {
    color: colors.black,
  },
  categoryFilters: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  filterSection: {
    marginBottom: spacing[4],
  },
  categoryLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing[3],
  },
  dateRangePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dateRangePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface300,
  },
  dateRangePillActive: {
    backgroundColor: colors.mintMuted,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 165, 0.5)',
  },
  dateRangePillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
  },
  dateRangePillTextActive: {
    color: colors.mint,
  },
  clearText: {
    fontSize: typography.fontSizes.xs,
    color: colors.mint,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  categoryPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface300,
  },
  categoryPillActive: {
    backgroundColor: colors.mintMuted,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 165, 0.5)',
  },
  categoryPillText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
  },
  categoryPillTextActive: {
    color: colors.mint,
  },
  statsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.5)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.5)',
    padding: spacing[3],
    marginBottom: spacing[6],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    marginBottom: spacing[0.5],
  },
  statValue: {
    fontSize: typography.fontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.surface300,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
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
    maxWidth: 240,
  },
  clearFiltersBtn: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.full,
  },
  clearFiltersBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
  dateSection: {
    marginBottom: spacing[6],
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    marginBottom: spacing[2],
  },
  dateText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  dailyTotal: {
    fontSize: typography.fontSizes.sm,
    fontFamily: 'monospace',
    color: colors.neutral500,
  },
  transactionList: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  // Selection mode styles
  cancelBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  cancelBtnText: {
    fontSize: typography.fontSizes.md,
    color: colors.mint,
    fontWeight: typography.fontWeights.medium,
  },
  selectionCount: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  selectAllBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  selectAllText: {
    fontSize: typography.fontSizes.sm,
    color: colors.mint,
    fontWeight: typography.fontWeights.medium,
  },
  bulkActionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.danger,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  bulkDeleteText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
});

export default Activity;
