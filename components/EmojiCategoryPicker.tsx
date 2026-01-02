import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { BudgetCategory } from '../types';
import { getCategoryIcon, getCategoryColor } from '../utils';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: BudgetCategory) => void;
  selectedCategory?: BudgetCategory;
}

const CATEGORIES: BudgetCategory[] = [
  'food_dining',
  'transportation',
  'shopping',
  'entertainment',
  'bills_utilities',
  'health_fitness',
  'travel',
  'income',
  'subscriptions',
  'other',
];

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

const EmojiCategoryPicker: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  selectedCategory,
}) => {
  const handleSelect = (category: BudgetCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(category);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
          accessibilityLabel="Close category picker"
          accessibilityRole="button"
        />

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Category</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Grid */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                const icon = getCategoryIcon(category);
                const color = getCategoryColor(category);
                const label = CATEGORY_LABELS[category];

                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => handleSelect(category)}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                      { borderColor: isSelected ? color : colors.surface300 },
                    ]}
                    activeOpacity={0.7}
                    accessibilityLabel={`Select ${label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
                      <Text style={styles.icon}>{icon}</Text>
                    </View>
                    <Text style={styles.label}>{label}</Text>
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: color }]}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: colors.neutral400,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  categoryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    borderWidth: 2,
    gap: spacing[3],
    position: 'relative',
  },
  categoryItemSelected: {
    borderWidth: 2,
    backgroundColor: colors.surface300,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  checkmark: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    color: colors.black,
    fontWeight: typography.fontWeights.bold,
  },
});

export default EmojiCategoryPicker;
