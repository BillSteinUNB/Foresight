import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, typography } from '../theme';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  feature: 'goals' | 'bills';
  currentCount: number;
  limit: number;
}

const FEATURE_CONFIG = {
  goals: {
    title: 'Unlock Unlimited Goals',
    description: 'You\'ve reached the free limit of 3 savings goals. Upgrade to Foresight Pro to create unlimited goals and take full control of your financial future.',
    icon: 'flag',
    benefits: [
      'Unlimited savings goals',
      'Advanced progress analytics',
      'Priority support',
      'Early access to new features',
    ],
  },
  bills: {
    title: 'Unlock Unlimited Bills',
    description: 'You\'ve reached the free limit of 3 bills. Upgrade to Foresight Pro to track unlimited bills and never miss a payment.',
    icon: 'receipt',
    benefits: [
      'Unlimited bill tracking',
      'Smart payment reminders',
      'Bill comparison insights',
      'Export your data',
    ],
  },
};

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  feature,
  currentCount,
  limit,
}) => {
  const config = FEATURE_CONFIG[feature];

  const handleUpgrade = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement upgrade flow (IAP, Supabase subscription, etc.)
    console.log('Upgrade to Pro initiated');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={styles.container}
        >
          {/* Header with icon */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={config.icon as any} size={32} color={colors.black} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>

            {/* Usage indicator */}
            <View style={styles.usageContainer}>
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageProgress,
                    { width: `${Math.min((currentCount / limit) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.usageText}>
                {currentCount} of {limit} free {feature} used
              </Text>
            </View>

            {/* Benefits list */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Pro Benefits</Text>
              {config.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.mint} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
              <Text style={styles.priceLabel}>Foresight Pro</Text>
              <Text style={styles.priceText}>
                <Text style={styles.priceAmount}>$4.99</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleUpgrade}
              style={styles.upgradeBtn}
              activeOpacity={0.8}
              accessibilityLabel="Upgrade to Pro"
              accessibilityRole="button"
            >
              <Ionicons name="star" size={20} color={colors.black} />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.laterBtn}
              activeOpacity={0.7}
              accessibilityLabel="Maybe later"
              accessibilityRole="button"
            >
              <Text style={styles.laterBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          {/* Terms note */}
          <Text style={styles.termsText}>
            Cancel anytime. Terms apply.
          </Text>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.surface300,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing[8],
    paddingHorizontal: spacing[6],
    position: 'relative',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: spacing[6],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing[6],
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral400,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  usageContainer: {
    marginBottom: spacing[6],
  },
  usageBar: {
    height: 8,
    backgroundColor: colors.surface300,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  usageProgress: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  usageText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  benefitsTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral400,
    marginBottom: spacing[2],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  benefitText: {
    fontSize: typography.fontSizes.md,
    color: colors.white,
    flex: 1,
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  priceLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
    marginBottom: spacing[1],
  },
  priceText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.mint,
  },
  pricePeriod: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral500,
  },
  actions: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
  },
  upgradeBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
  laterBtn: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral400,
  },
  termsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral600,
    textAlign: 'center',
    paddingVertical: spacing[4],
    paddingBottom: spacing[6],
  },
});

export default PaywallModal;
