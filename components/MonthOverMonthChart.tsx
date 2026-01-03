import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { colors, typography, spacing, borderRadius } from '../theme';
import { formatCompactCurrency } from '../utils';

interface MonthOverMonthChartProps {
  currentPeriodSpending: number;
  previousPeriodSpending: number;
  periodLabel?: string;
  previousPeriodLabel?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Top label component for previous period bar - extracted to prevent re-renders
const PreviousPeriodTopLabel: React.FC<{ value: number }> = React.memo(({ value }) => {
  return (
    <Text style={styles.topLabel}>
      {value > 0 ? formatCompactCurrency(value) : '$0'}
    </Text>
  );
});

PreviousPeriodTopLabel.displayName = 'PreviousPeriodTopLabel';

// Top label component for current period bar - extracted to prevent re-renders
const CurrentPeriodTopLabel: React.FC<{ value: number }> = React.memo(({ value }) => {
  return (
    <Text style={styles.topLabel}>
      {value > 0 ? formatCompactCurrency(value) : '$0'}
    </Text>
  );
});

CurrentPeriodTopLabel.displayName = 'CurrentPeriodTopLabel';

const MonthOverMonthChart: React.FC<MonthOverMonthChartProps> = React.memo(
  ({
    currentPeriodSpending,
    previousPeriodSpending,
    periodLabel = 'This Month',
    previousPeriodLabel = 'Last Month',
  }) => {
    const chartData = useMemo(() => {
      return [
        {
          value: previousPeriodSpending,
          label: previousPeriodLabel,
          frontColor: colors.surface400,
          topLabelComponent: () => <PreviousPeriodTopLabel value={previousPeriodSpending} />,
        },
        {
          value: currentPeriodSpending,
          label: periodLabel,
          frontColor: currentPeriodSpending > previousPeriodSpending ? colors.danger : colors.mint,
          topLabelComponent: () => <CurrentPeriodTopLabel value={currentPeriodSpending} />,
        },
      ];
    }, [currentPeriodSpending, previousPeriodSpending, periodLabel, previousPeriodLabel]);

    const percentChange = useMemo(() => {
      if (previousPeriodSpending === 0) {
        return currentPeriodSpending > 0 ? 100 : 0;
      }
      return ((currentPeriodSpending - previousPeriodSpending) / previousPeriodSpending) * 100;
    }, [currentPeriodSpending, previousPeriodSpending]);

    const isIncrease = percentChange > 0;
    const isNeutral = percentChange === 0;

    const maxValue = useMemo(() => 
      Math.max(currentPeriodSpending, previousPeriodSpending) * 1.3,
      [currentPeriodSpending, previousPeriodSpending]
    );

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Month-over-Month</Text>
          <View style={[
            styles.changeBadge,
            {
              backgroundColor: isNeutral
                ? colors.surface300
                : isIncrease
                  ? colors.dangerMuted
                  : 'rgba(0, 217, 165, 0.2)',
            },
          ]}>
            <Text style={[
              styles.changeText,
              {
                color: isNeutral
                  ? colors.neutral500
                  : isIncrease
                    ? colors.danger
                    : colors.mint,
              },
            ]}>
              {isNeutral ? '—' : `${isIncrease ? '+' : ''}${Math.round(percentChange)}%`}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            barWidth={60}
            spacing={SCREEN_WIDTH - spacing[12] - 140}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            xAxisLabelTextStyle={styles.axisText}
            noOfSections={3}
            maxValue={maxValue}
            height={180}
            width={SCREEN_WIDTH - spacing[12]}
            initialSpacing={20}
            yAxisLabelPrefix="$"
            yAxisLabelWidth={40}
            hideYAxisText={true}
            isAnimated
            animationDuration={600}
            barBorderRadius={6}
          />
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surface400 }]} />
            <Text style={styles.legendText}>{previousPeriodLabel}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mint }]} />
            <Text style={styles.legendText}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.comparisonSummary}>
          {isIncrease ? (
            <Text style={styles.summaryText}>
              You spent <Text style={styles.highlightText}>${formatCompactCurrency(Math.abs(currentPeriodSpending - previousPeriodSpending))}</Text> more this month
            </Text>
          ) : isNeutral ? (
            <Text style={styles.summaryText}>
              Spending is the same as last month
            </Text>
          ) : (
            <Text style={styles.summaryText}>
              You saved <Text style={styles.highlightText}>${formatCompactCurrency(Math.abs(currentPeriodSpending - previousPeriodSpending))}</Text> compared to last month
            </Text>
          )}
        </View>
      </View>
    );
  }
);

MonthOverMonthChart.displayName = 'MonthOverMonthChart';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  changeBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  changeText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisText: {
    color: colors.neutral500,
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing[2],
  },
  topLabel: {
    color: colors.white,
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginTop: spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  legendText: {
    color: colors.neutral400,
    fontSize: typography.fontSizes.xs,
  },
  comparisonSummary: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
    alignItems: 'center',
  },
  summaryText: {
    color: colors.neutral400,
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
  },
  highlightText: {
    color: colors.mint,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default MonthOverMonthChart;
