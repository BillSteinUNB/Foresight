import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { TrendPoint, TrendPeriod } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';

interface SpendingTrendsChartProps {
  data: TrendPoint[];
  period: TrendPeriod;
  showCategories?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Top label component for chart bars - extracted to prevent re-renders
const TopLabelComponent: React.FC<{ value: number }> = React.memo(({ value }) => {
  if (value <= 0) return null;

  return (
    <Text style={styles.topLabel}>
      {value >= 1000
        ? `$${(value / 1000).toFixed(1)}k`
        : `$${Math.round(value)}`}
    </Text>
  );
});

TopLabelComponent.displayName = 'TopLabelComponent';

const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = React.memo(({ 
  data, 
  period,
  showCategories = false 
}) => {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      value: point.totalExpense,
      label: point.label,
      frontColor: point.totalExpense === 0 ? colors.surface300 : colors.mint,
      topLabelComponent: () => <TopLabelComponent value={point.totalExpense} />,
    }));
  }, [data]);

  const maxVal = useMemo(() => Math.max(...data.map(d => d.totalExpense), 1), [data]);
  const noData = useMemo(() => data.every(d => d.totalExpense === 0), [data]);

  // Calculate dynamic width based on data points to ensure bars aren't too thin or crowded
  const barWidth = period === 'year' ? 12 : 20;
  const spacing_ = period === 'year' ? 12 : 20;

  const renderEmptyContainer = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No spending data for this period</Text>
    </View>
  ), []);

  if (noData) {
    return renderEmptyContainer();
  }

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        barWidth={barWidth}
        spacing={spacing_}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        noOfSections={4}
        maxValue={maxVal * 1.2} // Add some headroom
        height={220}
        width={SCREEN_WIDTH - spacing[16]} // Adjust for container padding
        initialSpacing={10}
        yAxisLabelPrefix="$"
        yAxisLabelWidth={40}
        hideYAxisText={true} // Clean look, relying on top labels or interaction
        isAnimated
        animationDuration={500}
        barBorderRadius={4}
        // Gradient effect
        showGradient
        gradientColor={colors.mintHover}
      />
    </View>
  );
});

SpendingTrendsChart.displayName = 'SpendingTrendsChart';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    paddingTop: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  axisText: {
    color: colors.neutral500,
    fontSize: 10,
    fontFamily: 'System', // Use system font as fallback or specific font from theme if available
  },
  topLabel: {
    color: colors.white,
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContainer: {
    height: 250,
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.sm,
  },
});

export default SpendingTrendsChart;
