import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { formatCurrency, getCategoryIcon } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import RecurringBadge from './RecurringBadge';

interface Props {
  transaction: Transaction;
  onPress: () => void;
  onLongPress?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
  isRecurring?: boolean;
}

const TransactionItem: React.FC<Props> = ({ 
  transaction, 
  onPress, 
  onLongPress,
  selectionMode = false,
  selected = false,
  onToggleSelected,
  isRecurring = false,
}) => {
  const isExpense = transaction.type === 'expense';

  const handlePress = () => {
    if (selectionMode && onToggleSelected) {
      onToggleSelected();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[styles.container, selected && styles.selectedContainer]}
      activeOpacity={0.7}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.checkboxContainer}
        >
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && (
              <Ionicons name="checkmark" size={14} color={colors.black} />
            )}
          </View>
        </MotiView>
      )}

      <View style={[commonStyles.row, { flex: 1 }]}>
        {/* Icon/Logo */}
        <View style={styles.iconContainer}>
          {transaction.merchantLogo ? (
            <Image
              source={{ uri: transaction.merchantLogo }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.categoryIcon}>{getCategoryIcon(transaction.category)}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {transaction.merchantName}
          </Text>
          <View style={commonStyles.row}>
            <Text style={styles.category}>
              {transaction.category.replace('_', ' ')}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.account}>****4521</Text>
          </View>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <View style={styles.amountRow}>
          {isRecurring && <RecurringBadge size="small" />}
          <Text style={[styles.amount, !isExpense && styles.incomeAmount]}>
            {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        {transaction.status === 'pending' && (
          <Text style={styles.pendingLabel}>PENDING</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: 'rgba(17, 17, 17, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 26, 26, 0.3)',
  },
  selectedContainer: {
    backgroundColor: 'rgba(0, 217, 165, 0.1)',
  },
  checkboxContainer: {
    marginRight: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: spacing[4],
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  categoryIcon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  merchantName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    marginBottom: spacing[0.5],
  },
  category: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
    textTransform: 'capitalize',
  },
  dot: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral600,
    marginHorizontal: spacing[2],
  },
  account: {
    fontSize: typography.fontSizes.xs,
    fontFamily: 'monospace',
    color: colors.neutral500,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  amount: {
    fontSize: typography.fontSizes.base,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  incomeAmount: {
    color: colors.mint,
  },
  pendingLabel: {
    fontSize: 10,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginTop: spacing[0.5],
  },
});

export default React.memo(TransactionItem);
