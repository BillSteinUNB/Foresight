import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { CategoryBudget, BudgetCategory } from '../types';
import { useApp } from '../context/AppContext';
import { validateBudgetInput } from '../utils/validation';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import { getCategoryIcon } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Map categories to display data
const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  food_dining: 'Food & Dining',
  transportation: 'Transportation',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  bills_utilities: 'Bills & Utilities',
  health_fitness: 'Health & Fitness',
  travel: 'Travel',
  income: 'Income',
  subscriptions: 'Subscriptions',
  other: 'Other',
};

const THRESHOLD_OPTIONS = [0.5, 0.75, 0.8, 0.9, 1.0];

const BudgetManager: React.FC<Props> = ({ isOpen, onClose }) => {
  const { budgetsWithSpending, addBudget, updateBudget, deleteBudget } = useApp();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory>('food_dining');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(0.8);
  
  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setViewMode('list');
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedCategory('food_dining');
    setMonthlyLimit('');
    setAlertThreshold(0.8);
    setEditingId(null);
  };

  const handleEdit = (budget: CategoryBudget) => {
    setEditingId(budget.id);
    setSelectedCategory(budget.category);
    setMonthlyLimit(budget.monthlyLimit.toString());
    setAlertThreshold(budget.alertThreshold);
    setViewMode('form');
    Haptics.selectionAsync();
  };

  const handleAddStart = () => {
    resetForm();
    // Find first unused category if possible
    const usedCategories = budgetsWithSpending.map(b => b.category);
    const allCategories = Object.keys(CATEGORY_LABELS) as BudgetCategory[];
    const firstUnused = allCategories.find(c => !usedCategories.includes(c));
    if (firstUnused) setSelectedCategory(firstUnused);
    
    setViewMode('form');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    const limit = parseFloat(monthlyLimit);
    const validation = validateBudgetInput(selectedCategory, limit, alertThreshold);
    
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors[0].message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingId) {
      updateBudget(editingId, {
        monthlyLimit: limit,
        alertThreshold,
      });
    } else {
      addBudget({
        category: selectedCategory,
        monthlyLimit: limit,
        alertThreshold,
        isActive: true,
      });
    }
    setViewMode('list');
  };

  const handleDelete = () => {
    if (!editingId) return;
    
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteBudget(editingId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setViewMode('list');
          }
        }
      ]
    );
  };

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Helper to get color from category name (converting snake_case to camelCase for colors object key)
  const getCategoryColor = (cat: BudgetCategory): string => {
    // Map snake_case category to camelCase color key if needed, or use a manual map
    // The theme/index.ts has keys like 'foodDining', 'transportation'
    const colorMap: Record<BudgetCategory, string> = {
      food_dining: colors.foodDining,
      transportation: colors.transportation,
      shopping: colors.shopping,
      entertainment: colors.entertainment,
      bills_utilities: colors.billsUtilities,
      health_fitness: colors.healthFitness,
      travel: colors.travel,
      income: colors.income,
      subscriptions: colors.subscriptions,
      other: colors.other
    };
    return colorMap[cat] || colors.other;
  };

  // Render List Item
  const renderBudgetItem = (budget: CategoryBudget) => {
    const label = CATEGORY_LABELS[budget.category];
    const icon = getCategoryIcon(budget.category);
    const color = getCategoryColor(budget.category);
    
    const percentage = budget.currentSpent / budget.monthlyLimit;
    const isOverBudget = percentage > 1;
    const isWarning = percentage >= budget.alertThreshold;
    
    let progressColor = colors.mint;
    if (isOverBudget) progressColor = colors.danger;
    else if (isWarning) progressColor = colors.warning;

    return (
      <MotiView
        key={budget.id}
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <TouchableOpacity 
          style={styles.budgetItem} 
          onPress={() => handleEdit(budget)}
          activeOpacity={0.7}
          accessibilityLabel={`Edit budget ${label}`}
          accessibilityRole="button"
        >
          <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
            <Text style={styles.emojiIcon}>{icon}</Text>
          </View>
          
          <View style={styles.budgetInfo}>
            <View style={commonStyles.rowBetween}>
              <Text style={styles.budgetName}>{label}</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(budget.currentSpent)} <Text style={styles.budgetTotal}>/ {formatCurrency(budget.monthlyLimit)}</Text>
              </Text>
            </View>
            
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(percentage * 100, 100)}%`,
                    backgroundColor: progressColor 
                  }
                ]} 
              />
            </View>
            
            <View style={commonStyles.rowBetween}>
              <Text style={[styles.percentageText, { color: progressColor }]}>
                {(percentage * 100).toFixed(0)}% Used
              </Text>
              {isOverBudget && (
                <View style={styles.alertBadge}>
                  <Ionicons name="alert-circle" size={12} color={colors.white} />
                  <Text style={styles.alertText}>Over Limit</Text>
                </View>
              )}
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={colors.neutral600} />
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} accessibilityLabel="Close modal" accessibilityRole="button" />

        <MotiView
          from={{ translateY: 500 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 500 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={styles.sheet}
        >
          {/* Header */}
          <View style={styles.header}>
            {viewMode === 'form' ? (
              <TouchableOpacity onPress={() => setViewMode('list')} style={styles.iconBtn} accessibilityLabel="Go back to list" accessibilityRole="button">
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerIcon}>
                <Ionicons name="wallet" size={20} color={colors.mint} />
              </View>
            )}
            
            <Text style={styles.title}>
              {viewMode === 'list' ? 'Manage Budgets' : editingId ? 'Edit Budget' : 'New Budget'}
            </Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          <AnimatePresence exitBeforeEnter>
            {viewMode === 'list' ? (
              <MotiView
                key="list"
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -20 }}
                style={{ flex: 1 }}
              >
                <ScrollView 
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                >
                  {budgetsWithSpending.length > 0 ? (
                    budgetsWithSpending.map(renderBudgetItem)
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="pie-chart-outline" size={48} color={colors.neutral600} />
                      <Text style={styles.emptyText}>No budgets set up yet.</Text>
                      <Text style={styles.emptySubtext}>Create a budget to track your spending.</Text>
                    </View>
                  )}
                  <View style={{ height: 80 }} /> 
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleAddStart}
                    style={styles.addBtn}
                    activeOpacity={0.8}
                    accessibilityLabel="Add new budget"
                    accessibilityRole="button"
                  >
                    <Ionicons name="add" size={24} color={colors.black} />
                    <Text style={styles.addBtnText}>Add New Budget</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            ) : (
              <MotiView
                key="form"
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: 20 }}
                style={styles.formContent}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Category Selection */}
                  <View style={styles.field}>
                    <Text style={styles.label}>CATEGORY</Text>
                    {editingId ? (
                      <View style={styles.readOnlyCategory}>
                        <View style={[styles.categoryIcon, { backgroundColor: `${getCategoryColor(selectedCategory)}20` }]}>
                          <Text style={styles.emojiIcon}>{getCategoryIcon(selectedCategory)}</Text>
                        </View>
                        <Text style={styles.readOnlyCategoryText}>
                          {CATEGORY_LABELS[selectedCategory]}
                        </Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {(Object.keys(CATEGORY_LABELS) as BudgetCategory[]).map(cat => {
                          const label = CATEGORY_LABELS[cat];
                          const icon = getCategoryIcon(cat);
                          const color = getCategoryColor(cat);
                          const isUsed = budgetsWithSpending.some(b => b.category === cat);
                          const isSelected = selectedCategory === cat;
                          
                          if (isUsed && !isSelected) return null;

                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => {
                                setSelectedCategory(cat);
                                Haptics.selectionAsync();
                              }}
                              style={[
                                styles.categoryPill,
                                isSelected && { backgroundColor: color, borderColor: color }
                              ]}
                              accessibilityLabel={`Select category ${label}`}
                              accessibilityRole="button"
                            >
                              <Text style={styles.emojiIconSmall}>{icon}</Text>
                              <Text style={[
                                styles.categoryPillText,
                                isSelected && { color: colors.white }
                              ]}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>

                  {/* Amount Input */}
                  <View style={styles.field}>
                    <Text style={styles.label}>MONTHLY LIMIT</Text>
                    <View style={styles.amountInput}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        value={monthlyLimit}
                        onChangeText={setMonthlyLimit}
                        placeholder="0"
                        placeholderTextColor={colors.neutral600}
                        style={styles.amountTextInput}
                        keyboardType="decimal-pad"
                        autoFocus={!editingId}
                      />
                    </View>
                  </View>

                  {/* Alert Threshold */}
                  <View style={styles.field}>
                    <View style={commonStyles.rowBetween}>
                      <Text style={styles.label}>ALERT THRESHOLD</Text>
                      <Text style={styles.thresholdValue}>{(alertThreshold * 100).toFixed(0)}%</Text>
                    </View>
                    <Text style={styles.helperText}>We'll notify you when you reach this % of your budget.</Text>
                    <View style={styles.thresholdOptions}>
                      {THRESHOLD_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => {
                            setAlertThreshold(opt);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.thresholdBtn,
                            alertThreshold === opt && styles.thresholdBtnActive
                          ]}
                          accessibilityLabel={`Set alert threshold to ${opt * 100}%`}
                          accessibilityRole="button"
                        >
                          <Text style={[
                            styles.thresholdBtnText,
                            alertThreshold === opt && styles.thresholdBtnTextActive
                          ]}>
                            {opt * 100}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.actions}>
                    {editingId && (
                      <TouchableOpacity
                        onPress={handleDelete}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete budget"
                        accessibilityRole="button"
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={handleSave}
                      style={[styles.saveBtn, { flex: editingId ? 1 : 0, width: editingId ? 'auto' : '100%' }]}
                      activeOpacity={0.8}
                      accessibilityLabel={editingId ? "Save changes" : "Create budget"}
                      accessibilityRole="button"
                    >
                      <Text style={styles.saveBtnText}>
                        {editingId ? 'Save Changes' : 'Create Budget'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  sheet: {
    backgroundColor: colors.surface200,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingTop: spacing[6],
    paddingHorizontal: spacing[6],
    height: '90%',
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: spacing[3],
    paddingBottom: spacing[24],
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface100,
    padding: spacing[4],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.surface300,
    gap: spacing[3],
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
    gap: spacing[2],
  },
  budgetName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  emojiIcon: {
    fontSize: 20,
  },
  emojiIconSmall: {
    fontSize: 16,
  },
  budgetAmount: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  budgetTotal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.normal,
    color: colors.neutral500,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surface300,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  alertText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    gap: spacing[4],
  },
  emptyText: {
    color: colors.white,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  emptySubtext: {
    color: colors.neutral500,
    fontSize: typography.fontSizes.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[6],
    paddingBottom: Platform.OS === 'ios' ? spacing[10] : spacing[6],
    backgroundColor: colors.surface200,
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  addBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
  formContent: {
    flex: 1,
    gap: spacing[6],
  },
  field: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surface300,
    marginRight: spacing[2],
    gap: spacing[2],
    backgroundColor: colors.surface100,
  },
  categoryPillText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  readOnlyCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  readOnlyCategoryText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
  },
  currencySymbol: {
    fontSize: typography.fontSizes['2xl'],
    fontFamily: 'monospace',
    color: colors.neutral400,
  },
  amountTextInput: {
    flex: 1,
    padding: spacing[4],
    paddingLeft: spacing[2],
    color: colors.white,
    fontSize: typography.fontSizes['2xl'],
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginBottom: spacing[2],
  },
  thresholdValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
  },
  thresholdOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  thresholdBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.lg,
  },
  thresholdBtnActive: {
    backgroundColor: colors.mintMuted,
    borderColor: colors.mint,
  },
  thresholdBtnText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    fontWeight: typography.fontWeights.medium,
  },
  thresholdBtnTextActive: {
    color: colors.mint,
    fontWeight: typography.fontWeights.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[12],
  },
  deleteBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  saveBtn: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
});

export default BudgetManager;
