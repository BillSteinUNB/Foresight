import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';
import TransactionDetail from '../components/TransactionDetail';
import { formatDate, formatCurrency } from '../utils';
import { Transaction, BudgetCategory } from '../types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';

type FilterType = 'all' | 'income' | 'expense';

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
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Activity: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { transactions } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<BudgetCategory>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // All available categories
  const allCategories = useMemo(() => {
    const cats = new Set<BudgetCategory>();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats);
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filter === 'income' && t.type !== 'income') return false;
      if (filter === 'expense' && t.type !== 'expense') return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(t.category)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMerchant = t.merchantName.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        if (!matchesMerchant && !matchesCategory) return false;
      }
      return true;
    });
  }, [transactions, filter, searchQuery, selectedCategories]);

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

  const toggleCategory = useCallback((category: BudgetCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    setSelectedCategories(new Set());
    setShowFilters(false);
  }, []);

  const hasActiveFilters = filter !== 'all' || searchQuery.trim() || selectedCategories.size > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          <View style={commonStyles.row}>
            <TouchableOpacity
              onPress={() => setIsSearchOpen(!isSearchOpen)}
              style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
            >
              <Ionicons name="search" size={18} color={isSearchOpen ? colors.black : colors.neutral400} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.iconButton, showFilters && styles.iconButtonActive]}
            >
              <Ionicons name="options-outline" size={18} color={showFilters ? colors.black : colors.neutral400} />
              {hasActiveFilters && !showFilters && <View style={styles.filterBadge} />}
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
                placeholder="Search transactions..."
                placeholderTextColor={colors.neutral600}
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={colors.neutral400} />
                </TouchableOpacity>
              )}
            </MotiView>
          )}
        </AnimatePresence>

        {/* Type Filters */}
        <View style={styles.filterRow}>
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Income" active={filter === 'income'} onPress={() => setFilter('income')} />
          <FilterChip label="Expenses" active={filter === 'expense'} onPress={() => setFilter('expense')} />
        </View>

        {/* Category Filters */}
        <AnimatePresence>
          {showFilters && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.categoryFilters}
            >
              <View style={commonStyles.rowBetween}>
                <Text style={styles.categoryLabel}>Categories</Text>
                {selectedCategories.size > 0 && (
                  <TouchableOpacity onPress={() => setSelectedCategories(new Set())}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.categoryPills}>
                {allCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[styles.categoryPill, selectedCategories.has(cat) && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryPillText, selectedCategories.has(cat) && styles.categoryPillTextActive]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first transaction'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersBtn}>
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
                      onPress={() => setSelectedTransaction(t)}
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
  categoryLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
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
});

export default Activity;
