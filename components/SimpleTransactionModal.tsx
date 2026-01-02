import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Transaction, BudgetCategory } from '../types';
import { formatCurrency, validateTransactionInput } from '../utils';
import { colors, spacing, borderRadius, typography } from '../theme';
import DatePickerModal from './DatePickerModal';
import EmojiCategoryPicker from './EmojiCategoryPicker';

type Mode = 'create' | 'edit';
type TransactionType = 'income' | 'expense';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (t: Partial<Transaction>) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  mode?: Mode;
  initialTransaction?: Transaction;
}

const SimpleTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  onAdd,
  onUpdate,
  mode = 'create',
  initialTransaction,
}) => {
  // Form state
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('other');
  const [date, setDate] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize from initial transaction in edit mode
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialTransaction) {
        setMerchantName(initialTransaction.merchantName);
        setAmount(initialTransaction.amount.toString());
        setCategory(initialTransaction.category);
        setDate(initialTransaction.date);
        setTransactionType(initialTransaction.type);
        setNotes(initialTransaction.notes || '');
        setError(null);
      } else {
        // Create mode: reset form
        setMerchantName('');
        setAmount('');
        setCategory('other');
        const today = new Date().toISOString();
        setDate(today);
        setTransactionType('expense');
        setNotes('');
        setError(null);
      }
    }
  }, [visible, mode, initialTransaction]);

  const handleSave = useCallback(() => {
    const amountNum = parseFloat(amount);

    const validation = validateTransactionInput(
      merchantName.trim(),
      amountNum
    );

    if (!validation.isValid) {
      setError(validation.errors[0].message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const transactionData: Partial<Transaction> = {
      merchantName: merchantName.trim(),
      amount: amountNum,
      category,
      date,
      type: transactionType,
      notes: notes.trim() || undefined,
    };

    if (mode === 'edit' && initialTransaction && onUpdate) {
      onUpdate(initialTransaction.id, transactionData);
    } else {
      onAdd(transactionData);
    }

    onClose();
  }, [
    merchantName,
    amount,
    category,
    date,
    transactionType,
    notes,
    mode,
    initialTransaction,
    onUpdate,
    onAdd,
    onClose,
  ]);

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const title = mode === 'edit' ? 'Edit Transaction' : 'Add Transaction';
  const saveButtonText = mode === 'edit' ? 'Save' : 'Add';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
        />

        <MotiView
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={styles.sheet}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
            {/* Transaction Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'expense' && styles.typeButtonActiveExpense,
                ]}
                onPress={() => {
                  setTransactionType('expense');
                  Haptics.selectionAsync();
                }}
                accessibilityLabel="Expense"
                accessibilityRole="radio"
                accessibilityState={{ checked: transactionType === 'expense' }}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={transactionType === 'expense' ? colors.danger : colors.neutral500}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'income' && styles.typeButtonActiveIncome,
                ]}
                onPress={() => {
                  setTransactionType('income');
                  Haptics.selectionAsync();
                }}
                accessibilityLabel="Income"
                accessibilityRole="radio"
                accessibilityState={{ checked: transactionType === 'income' }}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={transactionType === 'income' ? colors.mint : colors.neutral500}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Merchant Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Merchant / Description</Text>
              <TextInput
                value={merchantName}
                onChangeText={setMerchantName}
                placeholder="e.g., Walmart, Salary, Coffee"
                placeholderTextColor={colors.neutral600}
                style={styles.input}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.neutral600}
                  keyboardType="decimal-pad"
                  style={styles.amountTextInput}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.categoryInput}
                onPress={() => setShowCategoryPicker(true)}
                accessibilityLabel="Select category"
                accessibilityRole="button"
              >
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>
                    {category === 'other' ? '📦' : null}
                  </Text>
                  <Text style={styles.categoryText}>
                    {category.replace('_', ' ')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.neutral600} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
                accessibilityLabel="Select date"
                accessibilityRole="button"
              >
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={20} color={colors.neutral400} />
                  <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.neutral600} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Notes (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Notes <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes..."
                placeholderTextColor={colors.neutral600}
                style={styles.notesInput}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                mode === 'edit' && styles.saveBtnEdit,
              ]}
              accessibilityLabel={saveButtonText}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={18} color={colors.black} />
              <Text style={styles.saveBtnText}>{saveButtonText}</Text>
            </TouchableOpacity>
          </View>

          {/* Category Picker Modal */}
          <EmojiCategoryPicker
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            onSelect={setCategory}
            selectedCategory={category}
          />

          {/* Date Picker Modal */}
          <DatePickerModal
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={(selectedDate) => setDate(selectedDate.toISOString())}
            selectedDate={date ? new Date(date) : undefined}
            title="Select Date"
          />
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
    padding: spacing[6],
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginBottom: spacing[4],
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[1],
    marginBottom: spacing[5],
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  typeButtonActiveExpense: {
    backgroundColor: `${colors.danger}20`,
  },
  typeButtonActiveIncome: {
    backgroundColor: `${colors.mint}20`,
  },
  typeButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  typeButtonTextActive: {
    fontWeight: typography.fontWeights.semibold,
  },
  inputGroup: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
  },
  optional: {
    color: colors.neutral600,
  },
  input: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    color: colors.white,
    fontSize: typography.fontSizes.base,
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
    fontSize: typography.fontSizes.lg,
    color: colors.neutral400,
    marginRight: spacing[2],
  },
  amountTextInput: {
    flex: 1,
    padding: spacing[4],
    paddingLeft: spacing[2],
    color: colors.white,
    fontSize: typography.fontSizes.base,
    fontFamily: 'monospace',
  },
  categoryInput: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.white,
    textTransform: 'capitalize',
  },
  dateInput: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  dateText: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.white,
  },
  notesInput: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    color: colors.white,
    fontSize: typography.fontSizes.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.warning,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
  },
  saveBtnEdit: {
    flex: 1,
  },
  saveBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
});

export default SimpleTransactionModal;
