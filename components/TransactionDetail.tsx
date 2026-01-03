import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Transaction } from '../types';
import { formatCurrency, getCategoryIcon, getCategoryColor } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';
import AddTransaction from './AddTransaction';
import { useApp } from '../context/AppContext';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetail: React.FC<Props> = ({ transaction, isOpen, onClose }) => {
  const { updateTransaction, deleteTransaction } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [receiptPreviewVisible, setReceiptPreviewVisible] = useState(false);

  if (!transaction) return null;

  const isExpense = transaction.type === 'expense';
  const categoryColor = getCategoryColor(transaction.category);

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.merchantName} transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteTransaction(transaction.id);
            onClose();
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  const { date, time } = formatDateTime(transaction.date);

  const DetailRow = ({ icon, label, value, valueColor }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    valueColor?: string;
  }) => (
    <View style={styles.detailRow}>
      <View style={commonStyles.row}>
        <Ionicons name={icon} size={18} color={colors.neutral500} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} accessibilityLabel="Close modal" accessibilityRole="button" />

        <MotiView
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={styles.sheet}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Close Button */}
          <View style={styles.closeRow}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Merchant Header */}
            <View style={styles.merchantHeader}>
              <View style={[styles.merchantIcon, { backgroundColor: `${categoryColor}20` }]}>
                <Text style={styles.merchantEmoji}>{getCategoryIcon(transaction.category)}</Text>
              </View>
              <Text style={styles.merchantName}>{transaction.merchantName}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {transaction.category.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, !isExpense && { color: colors.mint }]}>
                {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
              </Text>
              {transaction.status === 'pending' && (
                <Text style={styles.pendingText}>PENDING • May change</Text>
              )}
            </View>

            {/* Details Card */}
            <View style={styles.detailsCard}>
              <DetailRow icon="calendar-outline" label="Date" value={date} />
              <DetailRow icon="time-outline" label="Time" value={time} />
              <DetailRow icon="card-outline" label="Account" value="Chase ****4521" />
              <DetailRow icon="pricetag-outline" label="Category" value={transaction.category.replace('_', ' ')} valueColor={categoryColor} />
              <DetailRow icon="repeat-outline" label="Recurring" value="No" />
              <DetailRow icon="location-outline" label="Location" value="New York, NY" />
            </View>

            {/* Notes Section */}
            {transaction.notes && (
              <View style={styles.notesCard}>
                <View style={commonStyles.row}>
                  <Ionicons name="document-text-outline" size={16} color={colors.neutral500} />
                  <Text style={styles.notesLabel}>Notes</Text>
                </View>
                <Text style={styles.notesText}>{transaction.notes}</Text>
              </View>
            )}

            {/* Receipt Section */}
            {transaction.receiptUri && (
              <View style={styles.receiptCard}>
                <View style={commonStyles.row}>
                  <Ionicons name="receipt-outline" size={16} color={colors.neutral500} />
                  <Text style={styles.notesLabel}>Receipt</Text>
                </View>
                <TouchableOpacity 
                  style={styles.receiptPreview}
                  onPress={() => setReceiptPreviewVisible(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="View receipt"
                  accessibilityRole="button"
                >
                  <Image source={{ uri: transaction.receiptUri }} style={styles.receiptImage} />
                  <View style={styles.receiptOverlay}>
                    <Ionicons name="expand-outline" size={16} color={colors.white} />
                    <Text style={styles.receiptOverlayText}>View Full</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditing(true);
                }}
                accessibilityLabel="Edit transaction"
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={20} color={colors.neutral400} />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} accessibilityLabel="Share transaction" accessibilityRole="button">
                <Ionicons name="share-outline" size={20} color={colors.neutral400} />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete} accessibilityLabel="Delete transaction" accessibilityRole="button">
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.secondaryBtn} accessibilityLabel="Split transaction" accessibilityRole="button">
                <Text style={styles.secondaryBtnText}>Split Transaction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} accessibilityLabel="Mark as recurring" accessibilityRole="button">
                <Ionicons name="repeat" size={16} color={colors.black} />
                <Text style={styles.primaryBtnText}>Mark Recurring</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </MotiView>
      </View>

      {/* Receipt Full Screen Preview */}
      {transaction.receiptUri && (
        <Modal
          visible={receiptPreviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReceiptPreviewVisible(false)}
        >
          <TouchableOpacity 
            style={styles.receiptFullScreenBackdrop}
            onPress={() => setReceiptPreviewVisible(false)}
            activeOpacity={1}
          >
            <Image 
              source={{ uri: transaction.receiptUri }} 
              style={styles.receiptFullScreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.receiptCloseBtn}
              onPress={() => setReceiptPreviewVisible(false)}
              accessibilityLabel="Close full screen preview"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </Modal>

      {/* Edit Transaction Modal */}
      <AddTransaction
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onAdd={() => {}} // Not used in edit mode
        onUpdate={updateTransaction}
        mode="edit"
        initialTransaction={transaction}
      />
    </>
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
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.surface400,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantHeader: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  merchantIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  merchantEmoji: {
    fontSize: 40,
  },
  merchantName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
    marginBottom: spacing[1],
  },
  categoryBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    textTransform: 'capitalize',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  amount: {
    fontSize: typography.fontSizes['4xl'],
    fontFamily: 'monospace',
    fontWeight: typography.fontWeights.light,
    color: colors.white,
  },
  pendingText: {
    fontSize: typography.fontSizes.xs,
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginTop: spacing[2],
  },
  detailsCard: {
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  notesCard: {
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  notesLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginLeft: spacing[2],
  },
  notesText: {
    fontSize: typography.fontSizes.base,
    color: colors.white,
    lineHeight: 22,
  },
  receiptCard: {
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  receiptPreview: {
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.lg,
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing[2],
  },
  receiptOverlayText: {
    fontSize: typography.fontSizes.xs,
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
  receiptFullScreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptFullScreenImage: {
    width: '100%',
    height: '80%',
  },
  receiptCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 26, 26, 0.5)',
  },
  detailLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
    marginLeft: spacing[3],
  },
  detailValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    textTransform: 'capitalize',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
  },
  actionBtnText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral400,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
  },
  secondaryBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
  },
  primaryBtnText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.black,
  },
});

export default TransactionDetail;
