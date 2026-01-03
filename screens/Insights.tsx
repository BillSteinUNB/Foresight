import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils';
import { Insight } from '../types';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import BudgetManager from '../components/BudgetManager';
import { InsightsStackParamList } from '../navigation/TabNavigator';
import { generatePredictiveInsights, GeneratedInsight, toStorableInsight } from '../utils/predictiveInsights';
import { useDebouncedEffect } from '../utils/useDebouncedEffect';
import { getHealthScoreBreakdown, getHealthScoreInfo, getImprovementSuggestions } from '../utils/healthScore';

const LOADING_DELAY_MS = 1200;

const getInsightIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'alert': return 'warning';
    case 'positive': return 'trending-up';
    case 'prediction': return 'time';
    default: return 'bulb';
  }
};

const getInsightColor = (type: string): string => {
  switch (type) {
    case 'alert': return colors.warning;
    case 'positive': return colors.mint;
    case 'prediction': return colors.blue400;
    default: return colors.purple400;
  }
};

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss, onAction }) => {
  const [isActioning, setIsActioning] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const color = getInsightColor(insight.type);

  const handleAction = useCallback(() => {
    setIsActioning(true);
    setTimeout(() => {
      onAction(insight.id);
      setIsActioning(false);
    }, 1000);
  }, [insight.id, onAction]);

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => onDismiss(insight.id), 300);
  }, [insight.id, onDismiss]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: isDismissing ? 0 : 1, translateY: 0, scale: isDismissing ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.insightCard}
    >
      <View style={[styles.insightGlow, { backgroundColor: color }]} />
      
      <View style={styles.insightHeader}>
        <View style={[styles.insightIconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={getInsightIcon(insight.type)} size={24} color={color} />
        </View>
        <View style={styles.insightContent}>
          <View style={commonStyles.rowBetween}>
            <Text style={styles.insightTitle} numberOfLines={2}>{insight.title}</Text>
            {!insight.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.insightDescription}>{insight.description}</Text>
        </View>
      </View>

      {insight.data && (
        <View style={styles.insightData}>
          {insight.data.saved && (
            <View style={styles.savingsDisplay}>
              <Text style={styles.savingsLabel}>Potential Savings</Text>
              <Text style={styles.savingsAmount}>
                {formatCurrency(insight.data.saved)}
                <Text style={styles.savingsPeriod}>/yr</Text>
              </Text>
            </View>
          )}
          {insight.data.amount && !insight.data.saved && (
            <View style={styles.progressContainer}>
              <View style={commonStyles.rowBetween}>
                <Text style={styles.progressLabel}>This month</Text>
                <Text style={styles.progressValue}>{formatCurrency(insight.data.amount)}</Text>
              </View>
              <View style={styles.progressBar}>
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: '75%' }}
                  transition={{ type: 'timing', duration: 1000 }}
                  style={styles.progressFill}
                />
              </View>
              <View style={commonStyles.rowBetween}>
                <Text style={styles.progressLabel}>Your average</Text>
                <Text style={styles.progressValue}>$300.00</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.insightActions}>
        <TouchableOpacity
          onPress={handleDismiss}
          disabled={isDismissing}
          style={styles.dismissButton}
          activeOpacity={0.7}
          accessibilityLabel="Dismiss insight"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={colors.white} />
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAction}
          disabled={isActioning}
          style={styles.actionButton}
          activeOpacity={0.7}
          accessibilityLabel="Take action"
          accessibilityRole="button"
        >
          {isActioning ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <>
              <Text style={styles.actionButtonText}>Take Action</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.black} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const Insights: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<InsightsStackParamList>>();
  const { 
    insights, 
    dismissInsight, 
    markInsightRead,
    predictiveInsightsInput,
    healthScoreBreakdown,
    healthScoreSuggestions,
  } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [liveInsights, setLiveInsights] = useState<GeneratedInsight[]>([]);

  // Initial loading animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Generate predictive insights on initial mount
  useEffect(() => {
    const generated = generatePredictiveInsights(predictiveInsightsInput);
    setLiveInsights(generated);
  }, []); // Only run on mount

  // Regenerate insights when transactions or bills change (debounced)
  useDebouncedEffect(() => {
    const generated = generatePredictiveInsights(predictiveInsightsInput);
    setLiveInsights(generated);
  }, [
    predictiveInsightsInput.transactions.length,
    predictiveInsightsInput.bills.length,
    predictiveInsightsInput.budgets.length,
    predictiveInsightsInput.goals.length,
    predictiveInsightsInput.monthlyIncome,
  ], 1500);

  // Convert live insights to displayable format with generated IDs
  const displayInsights = useMemo((): Insight[] => {
    return liveInsights.map((insight, index) => ({
      id: `live_${index}_${insight.title.slice(0, 10)}`,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      data: insight.data,
      isRead: false,
    }));
  }, [liveInsights]);

  // Combine stored insights with live predictive insights (live ones first)
  const allInsights = useMemo(() => {
    // Deduplicate by title to avoid showing same insight from both sources
    const storedTitles = new Set(insights.map(i => i.title));
    const uniqueLiveInsights = displayInsights.filter(i => !storedTitles.has(i.title));
    return [...uniqueLiveInsights, ...insights];
  }, [insights, displayInsights]);

  const unreadCount = allInsights.filter(i => !i.isRead).length;

  // Get health score info for the breakdown section
  const scoreInfo = useMemo(() => getHealthScoreInfo(healthScoreBreakdown.total), [healthScoreBreakdown.total]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Insights</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => navigation.navigate('SpendingTrends')}
              activeOpacity={0.7}
              accessibilityLabel="View spending trends"
              accessibilityRole="button"
            >
              <Ionicons name="trending-up-outline" size={18} color={colors.mint} />
              <Text style={styles.headerBtnText}>Trends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Subscriptions')}
              activeOpacity={0.7}
              accessibilityLabel="View subscriptions"
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={18} color={colors.mint} />
              <Text style={styles.headerBtnText}>Subs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => setShowBudgetManager(true)}
              activeOpacity={0.7}
              accessibilityLabel="Manage budgets"
              accessibilityRole="button"
            >
              <Ionicons name="wallet-outline" size={18} color={colors.mint} />
              <Text style={styles.headerBtnText}>Budgets</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>AI-powered suggestions for your wallet.</Text>

        <AnimatePresence>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.mint} />
              <Text style={styles.loadingText}>Analyzing your finances...</Text>
            </View>
          ) : allInsights.length === 0 ? (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.emptyState}
            >
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                You've reviewed all your insights. Check back later for new suggestions.
              </Text>
            </MotiView>
          ) : (
            <>
              {/* Health Score Breakdown Section */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
                style={styles.healthScoreCard}
              >
                <View style={styles.healthScoreHeader}>
                  <View style={[styles.healthScoreIconContainer, { backgroundColor: `${scoreInfo.color}20` }]}>
                    <Ionicons name="fitness" size={24} color={scoreInfo.color} />
                  </View>
                  <View style={styles.healthScoreHeaderText}>
                    <Text style={styles.healthScoreTitle}>Financial Health</Text>
                    <Text style={[styles.healthScoreValue, { color: scoreInfo.color }]}>
                      {healthScoreBreakdown.total} / 100
                    </Text>
                  </View>
                  <View style={[styles.healthScoreBadge, { backgroundColor: `${scoreInfo.color}20` }]}>
                    <Text style={[styles.healthScoreBadgeText, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
                  </View>
                </View>

                {/* Factor Breakdown */}
                <View style={styles.factorsContainer}>
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
                      <View key={factor.key} style={styles.factorRow}>
                        <View style={styles.factorLabelRow}>
                          <Ionicons name={factor.icon} size={14} color={colors.neutral400} />
                          <Text style={styles.factorLabel}>{factor.label}</Text>
                          <Text style={styles.factorScore}>{data.score}/{data.maxScore}</Text>
                        </View>
                        <View style={styles.factorBar}>
                          <MotiView
                            from={{ width: '0%' }}
                            animate={{ width: `${percentage}%` as any }}
                            transition={{ type: 'timing', duration: 800, delay: 200 }}
                            style={[styles.factorFill, { backgroundColor: percentage >= 70 ? colors.mint : percentage >= 40 ? colors.warning : colors.danger }]}
                          />
                        </View>
                        <Text style={styles.factorDetails}>{data.details}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Improvement Suggestions */}
                {healthScoreSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Quick Wins</Text>
                    {healthScoreSuggestions.slice(0, 3).map((suggestion, index) => (
                      <View key={index} style={styles.suggestionRow}>
                        <Ionicons name="bulb" size={14} color={colors.mint} />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </MotiView>

              {/* AI Insights */}
              {allInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={dismissInsight}
                  onAction={markInsightRead}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </ScrollView>
      
      <BudgetManager 
        isOpen={showBudgetManager} 
        onClose={() => setShowBudgetManager(false)} 
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
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  badge: {
    marginLeft: spacing[3],
    backgroundColor: colors.mintMuted,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    backgroundColor: colors.mintMuted,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
  },
  headerBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.mint,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.neutral400,
    marginBottom: spacing[8],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[20],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  insightCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
    marginBottom: spacing[6],
    overflow: 'hidden',
  },
  insightGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
  },
  insightHeader: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    flex: 1,
    marginBottom: spacing[1],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
    marginLeft: spacing[2],
    marginTop: spacing[2],
  },
  insightDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    lineHeight: 20,
  },
  insightData: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  savingsDisplay: {
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing[1],
  },
  savingsAmount: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.light,
    color: colors.white,
  },
  savingsPeriod: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral400,
  },
  progressContainer: {
    gap: spacing[2],
  },
  progressLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
  },
  progressValue: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.neutral400,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.surface400,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: borderRadius.full,
  },
  insightActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2.5],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
  },
  dismissButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2.5],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
  },
  actionButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyIcon: {
    fontSize: 64,
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
  },
  // Health Score Card styles
  healthScoreCard: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.surface300,
    marginBottom: spacing[6],
    overflow: 'hidden',
  },
  healthScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[5],
  },
  healthScoreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScoreHeaderText: {
    flex: 1,
  },
  healthScoreTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[0.5],
  },
  healthScoreValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
  },
  healthScoreBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  healthScoreBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  factorsContainer: {
    gap: spacing[4],
  },
  factorRow: {
    gap: spacing[1.5],
  },
  factorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  factorLabel: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral300,
  },
  factorScore: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
    fontFamily: 'monospace',
  },
  factorBar: {
    height: 6,
    backgroundColor: colors.surface400,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  factorDetails: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral500,
  },
  suggestionsContainer: {
    marginTop: spacing[6],
    paddingTop: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.surface400,
    gap: spacing[3],
  },
  suggestionsTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  suggestionText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    lineHeight: 18,
  },
});

export default Insights;
