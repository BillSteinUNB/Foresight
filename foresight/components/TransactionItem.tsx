import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Transaction } from '../types';
import { formatCurrency, getCategoryIcon } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';

interface Props {
  transaction: Transaction;
  onPress: () => void;
}

const TransactionItem: React.FC<Props> = ({ transaction, onPress }) => {
  const isExpense = transaction.type === 'expense';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={commonStyles.row}>
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
        <Text style={[styles.amount, !isExpense && styles.incomeAmount]}>
          {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
        </Text>
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
