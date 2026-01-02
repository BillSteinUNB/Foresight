import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Bill } from '../types';
import { validateBillInput } from '../utils/validation';
import { colors, spacing, borderRadius, typography } from '../theme';

type Mode = 'create' | 'edit';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (bill: { name: string; amount: number; dueDate: string }) => void;
  onUpdate?: (id: string, updates: Partial<Bill>) => void;
  onDelete?: (id: string) => void;
  mode?: Mode;
  initialBill?: Bill;
}

const BillFormModal: React.FC<Props> = ({
  visible,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  mode = 'create',
  initialBill,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize from initial bill in edit mode
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialBill) {
        setName(initialBill.name);
        setAmount(initialBill.amount.toString());
        setDueDate(initialBill.dueDate);
        setError(null);
      } else {
        // Create mode: reset form
        setName('');
        setAmount('');
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString());
        setError(null);
      }
    }
  }, [visible, mode, initialBill]);

  const handleSave = useCallback(() => {
    // Use centralized validation
    const amountNum = parseFloat(amount);
    const validation = validateBillInput(name.trim(), amountNum, dueDate);
    
    if (!validation.isValid) {
      setError(validation.errors[0].message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Success
    const billData = {
      name: name.trim(),
      amount: amountNum,
      dueDate,
    };

    if (mode === 'edit' && initialBill && onUpdate) {
      onUpdate(initialBill.id, billData);
    } else {
      onAdd(billData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [name, amount, dueDate, mode, initialBill, onUpdate, onAdd, onClose]);

  const handleDelete = useCallback(() => {
    if (mode === 'edit' && initialBill && onDelete) {
      Alert.alert(
        'Delete Bill',
        `Are you sure you want to delete "${initialBill.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(initialBill.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onClose();
            },
          },
        ],
      );
    }
  }, [mode, initialBill, onDelete, onClose]);

  const title = mode === 'edit' ? 'Edit Bill' : 'Add Bill';
  const saveButtonText = mode === 'edit' ? 'Save' : 'Add';

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Bill Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bill Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Rent, Netflix, Electric"
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
                  style={[styles.input, styles.amountTextInput]}
                />
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  // Simple date picker - in production, use @react-native-community/datetimepicker
                  Alert.alert(
                    'Select Date',
                    `Due: ${formatDueDate(dueDate)}\n\nFor production, integrate a date picker.`,
                    [{ text: 'OK', onPress: () => {} }],
                  );
                }}
              >
                <View style={commonStyles.row}>
                  <Ionicons name="calendar-outline" size={20} color={colors.neutral400} />
                  <Text style={styles.dateText}>{formatDueDate(dueDate)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.neutral600} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            {mode === 'edit' && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, mode === 'edit' && styles.saveBtnEdit]}>
              <Ionicons name="checkmark" size={18} color={colors.black} />
              <Text style={styles.saveBtnText}>{saveButtonText}</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const commonStyles = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as const,
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
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
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
    gap: spacing[5],
  },
  inputGroup: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral400,
    marginBottom: spacing[2],
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
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
  dateText: {
    fontSize: typography.fontSizes.base,
    color: colors.white,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255, 89, 89, 0.1)',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.warning,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
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
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: 'rgba(255, 59, 92, 0.1)',
    borderRadius: borderRadius.xl,
  },
  deleteBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.danger,
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

export default BillFormModal;
