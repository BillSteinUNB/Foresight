import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { BudgetCategory } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';
import { formatCurrency } from '../utils';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../utils/trends';

interface CategoryPieChartProps {
  data: Array<{ category: BudgetCategory; total: number; percentage: number }>;
  title?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PieDataItem {
  value: number;
  color: string;
  label: string;
  category: BudgetCategory;
  percentage: number;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, title = 'Spending by Category' }) => {
  const pieData = useMemo((): PieDataItem[] => {
    return data.map((item) => ({
      value: item.total,
      color: CATEGORY_COLORS[item.category] || colors.neutral500,
      label: CATEGORY_LABELS[item.category] || item.category,
      category: item.category,
      percentage: item.percentage,
    }));
  }, [data]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data]);

  const noData = data.length === 0 || total === 0;

  // Calculate legend items (show top 5, group rest as "Other")
  const legendItems = useMemo(() => {
    if (pieData.length <= 5) return pieData;

    const top5 = pieData.slice(0, 5);
    const rest = pieData.slice(5);
    const restTotal = rest.reduce((sum, item) => sum + item.value, 0);

    return [
      ...top5,
      {
        value: restTotal,
        color: colors.neutral500,
        label: 'Other',
        category: 'other' as BudgetCategory,
        percentage: (restTotal / total) * 100,
      },
    ];
  }, [pieData, total]);

  if (noData) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No category data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          showText
          textColor={colors.white}
          textSize={12}
          fontWeight="600"
          radius={90}
          innerRadius={55}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelValue}>{formatCurrency(total)}</Text>
              <Text style={styles.centerLabelText}>Total</Text>
            </View>
          )}
          showValuesAsLabels={false}
        />
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {legendItems.map((item, index) => (
          <View key={`${item.category}-${index}`} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
            <Text style={styles.legendPercent}>{Math.round(item.percentage)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[4],
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelValue: {
    color: colors.white,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  centerLabelText: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.sm,
  },
  legendContainer: {
    marginTop: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    marginRight: spacing[3],
  },
  legendLabel: {
    flex: 1,
    color: colors.neutral200,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  legendValue: {
    color: colors.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    marginRight: spacing[3],
  },
  legendPercent: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.xs,
    width: 40,
    textAlign: 'right',
  },
});

export default CategoryPieChart;
