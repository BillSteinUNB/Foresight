import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../theme';

interface RecurringBadgeProps {
  /** Size variant */
  size?: 'small' | 'medium';
  /** Whether to show the label text */
  showLabel?: boolean;
}

/**
 * Badge component to indicate a recurring transaction
 */
const RecurringBadge: React.FC<RecurringBadgeProps> = ({
  size = 'small',
  showLabel = false,
}) => {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall ? styles.containerSmall : styles.containerMedium]}>
      <Ionicons
        name="repeat"
        size={isSmall ? 10 : 12}
        color={colors.mint}
      />
      {showLabel && (
        <Text style={[styles.label, isSmall && styles.labelSmall]}>
          Recurring
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintMuted,
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  containerSmall: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
  },
  containerMedium: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.mint,
  },
  labelSmall: {
    fontSize: 10,
  },
});

export default RecurringBadge;
