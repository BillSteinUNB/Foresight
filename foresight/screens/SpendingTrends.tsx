import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { useApp } from '../context/AppContext';
import { colors, typography, spacing, borderRadius, commonStyles } from '../theme';
import { 
  aggregateTransactions, 
  getPeriodSummary, 
  getTopCategories,
  CATEGORY_COLORS,
  CATEGORY_LABELS
} from '../utils/trends';
import { TrendPeriod } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils';
import SpendingTrendsChart from '../components/SpendingTrendsChart';

const PERIODS: { label: string; value: TrendPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: '3M', value: '3months' },
  { label: 'Year', value: 'year' },
];

const SpendingTrends: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { transactions } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('month');

  // Aggregated Data
  const trendData = useMemo(() => 
    aggregateTransactions(transactions, selectedPeriod), 
  [transactions, selectedPeriod]);

  const summary = useMemo(() => 
    getPeriodSummary(transactions, selectedPeriod), 
  [transactions, selectedPeriod]);

  const topCategories = useMemo(() => 
    getTopCategories(transactions, selectedPeriod), 
  [transactions, selectedPeriod]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Spending Trends</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.periodPill,
                selectedPeriod === p.value && styles.periodPillActive
              ]}
              onPress={() => setSelectedPeriod(p.value)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === p.value && styles.periodTextActive
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.chartSection}
        >
          <SpendingTrendsChart 
            data={trendData} 
            period={selectedPeriod} 
          />
        </MotiView>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          {/* Total Spent */}
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet-outline" size={20} color={colors.mint} />
            </View>
            <Text style={styles.statLabel}>TOTAL SPENT</Text>
            <Text style={styles.statValue}>{formatCompactCurrency(summary.totalSpent)}</Text>
          </View>

          {/* Average Per Day */}
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.surface300 }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.blue400} />
            </View>
            <Text style={styles.statLabel}>DAILY AVG</Text>
            <Text style={styles.statValue}>{formatCompactCurrency(summary.averagePerDay)}</Text>
          </View>
        </View>

        {/* Top Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          
          <View style={styles.categoriesList}>
            {topCategories.length > 0 ? (
              topCategories.map((cat, index) => (
                <View key={cat.category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryInfo}>
                      <View style={[
                        styles.categoryDot, 
                        { backgroundColor: CATEGORY_COLORS[cat.category] || colors.neutral500 }
                      ]} />
                      <Text style={styles.categoryName}>
                        {CATEGORY_LABELS[cat.category] || cat.category}
                      </Text>
                    </View>
                    <View style={styles.categoryAmountContainer}>
                      <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
                      <Text style={styles.categoryPercent}>{Math.round(cat.percentage)}%</Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${cat.percentage}%`,
                          backgroundColor: CATEGORY_COLORS[cat.category] || colors.neutral500
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No spending recorded</Text>
              </View>
            )}
          </View>
        </View>

        {/* Highest Spending Day (if available) */}
        {summary.highestDay && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up" size={20} color={colors.warning} />
              <Text style={styles.insightTitle}>Highest Spending Day</Text>
            </View>
            <Text style={styles.insightDate}>
              {new Date(summary.highestDay.date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.insightAmount}>
              {formatCurrency(summary.highestDay.amount)}
            </Text>
          </View>
        )}

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
  header: {
    marginBottom: spacing[6],
    marginTop: spacing[2],
  },
  title: {
    ...commonStyles.heading1,
    fontSize: typography.fontSizes['3xl'],
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface200,
    padding: spacing[1],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  periodPill: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  periodPillActive: {
    backgroundColor: colors.surface300,
  },
  periodText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral500,
  },
  periodTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeights.semibold,
  },
  chartSection: {
    marginBottom: spacing[6],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...commonStyles.heading2,
    marginBottom: spacing[4],
  },
  categoriesList: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[4],
  },
  categoryItem: {
    marginBottom: spacing[4],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  categoryName: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral200,
    fontWeight: typography.fontWeights.medium,
  },
  categoryAmountContainer: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: typography.fontSizes.sm,
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
  categoryPercent: {
    fontSize: 10,
    color: colors.neutral500,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  emptyState: {
    padding: spacing[4],
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.sm,
  },
  insightCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)', // Warning color muted
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  insightTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginBottom: spacing[1],
  },
  insightAmount: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
});

export default SpendingTrends;
