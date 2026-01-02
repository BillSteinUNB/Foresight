import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Transaction, TransactionUpdate, BudgetCategory } from '../types';
import { formatCurrency, validateTransactionInput } from '../utils';
import { colors, spacing, borderRadius, typography } from '../theme';
import ReceiptPicker from './ReceiptPicker';

const AI_PROCESSING_DELAY_MS = 1500;

type Mode = 'create' | 'edit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Partial<Transaction>) => void;
  onUpdate?: (id: string, updates: TransactionUpdate) => void;
  mode?: Mode;
  initialTransaction?: Transaction;
}

const AddTransaction: React.FC<Props> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  mode = 'create',
  initialTransaction,
}) => {
  // Form state
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null);
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);

  // Initialize from initial transaction in edit mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialTransaction) {
        // In edit mode, skip AI parsing and use existing data
        setParsedData(initialTransaction);
        setInput(`${initialTransaction.merchantName} $${initialTransaction.amount}`);
        setNotes(initialTransaction.notes || '');
        setReceiptUri(initialTransaction.receiptUri);
        setIsProcessing(false);
        setIsListening(false);
      } else {
        // In create mode, reset to initial state
        setInput('');
        setParsedData(null);
        setNotes('');
        setReceiptUri(undefined);
        setIsProcessing(false);
        setIsListening(false);
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    }
  }, [isOpen, mode, initialTransaction]);

  const handleSimulatedAI = useCallback(() => {
    if (mode === 'edit') return; // Skip AI in edit mode
    if (!input.trim()) return;
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      const amountMatch = input.match(/\d+(\.\d{1,2})?/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

      let category: BudgetCategory = 'other';
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('food') || lowerInput.includes('lunch') || lowerInput.includes('dinner') || lowerInput.includes('coffee')) {
        category = 'food_dining';
      } else if (lowerInput.includes('uber') || lowerInput.includes('taxi') || lowerInput.includes('lyft')) {
        category = 'transportation';
      } else if (lowerInput.includes('netflix') || lowerInput.includes('spotify')) {
        category = 'subscriptions';
      }

      const merchant = input.replace(/\d+(\.\d{1,2})?/, '').replace(/for|at|spent|on|\$/gi, '').trim();
      const merchantName = merchant.charAt(0).toUpperCase() + merchant.slice(1) || 'Unknown';

      setParsedData({
        amount: isValidAmount(amount) ? amount : 0,
        merchantName,
        category,
        date: new Date().toISOString(),
        type: 'expense',
      });
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, AI_PROCESSING_DELAY_MS);
  }, [input, mode]);

  const handleConfirm = useCallback(() => {
    if (parsedData) {
      const validation = validateTransactionInput(
        parsedData.merchantName || '',
        parsedData.amount || 0
      );
      
      if (!validation.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Add notes and receipt to parsed data
      const finalData = {
        ...parsedData,
        notes: notes.trim() || undefined,
        receiptUri,
      };

      if (mode === 'edit' && initialTransaction && onUpdate) {
        // Edit mode: update existing transaction
        const { id, merchantLogo, status, ...updates } = finalData;
        onUpdate(initialTransaction.id, updates as TransactionUpdate);
      } else if (mode === 'create') {
        // Create mode: add new transaction
        onAdd(finalData);
      }

      onClose();
    }
  }, [parsedData, notes, receiptUri, mode, initialTransaction, onAdd, onUpdate, onClose]);

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
    Haptics.selectionAsync();
  }, []);

  const title = mode === 'edit' ? 'Edit Transaction' : 'Add Transaction';
  const buttonText = mode === 'edit' ? 'Save' : 'Confirm';

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} accessibilityLabel="Close modal" accessibilityRole="button" />

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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close add transaction modal" accessibilityRole="button">
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(!parsedData || mode === 'edit') && mode !== 'edit' && (
              /* Input State - only in create mode */
              <View style={styles.inputState}>
                <Text style={styles.subtitle}>Tell me what you spent...</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder='e.g., "Lunch at Chipotle for $15"'
                    placeholderTextColor={colors.neutral600}
                    style={styles.textInput}
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity
                    onPress={() => setIsListening(!isListening)}
                    style={[styles.micBtn, isListening && styles.micBtnActive]}
                    accessibilityLabel={isListening ? "Stop voice input" : "Start voice input"}
                    accessibilityRole="button"
                  >
                    <Ionicons name="mic" size={20} color={isListening ? colors.white : colors.neutral400} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleSimulatedAI}
                  disabled={!input.trim() || isProcessing}
                  style={[styles.analyzeBtn, (!input.trim() || isProcessing) && styles.analyzeBtnDisabled]}
                  activeOpacity={0.8}
                  accessibilityLabel="Analyze transaction"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !input.trim() || isProcessing }}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator size="small" color={colors.black} />
                      <Text style={styles.analyzeBtnText}>Parsing...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.analyzeBtnText}>Analyze</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.black} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Suggestions - only in create mode */}
                <View style={styles.suggestions}>
                  <Text style={styles.suggestionsLabel}>SUGGESTIONS</Text>
                  <View style={styles.suggestionChips}>
                    <TouchableOpacity
                      onPress={() => handleSuggestion('Starbucks coffee $6.50')}
                      style={styles.suggestionChip}
                      accessibilityLabel="Starbucks coffee suggestion, $6.50"
                      accessibilityRole="button"
                    >
                      <Text style={styles.suggestionText}>☕ Starbucks $6.50</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSuggestion('Uber to work $25')}
                      style={styles.suggestionChip}
                      accessibilityLabel="Uber to work suggestion, $25"
                      accessibilityRole="button"
                    >
                      <Text style={styles.suggestionText}>🚕 Uber $25</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {parsedData && (
              /* Confirmation State - shown after parsing or in edit mode */
              <View style={styles.confirmState}>
                <View style={styles.merchantPreview}>
                  <View style={styles.merchantIcon}>
                    <Text style={styles.merchantInitial}>{parsedData.merchantName?.charAt(0)}</Text>
                  </View>
                  <Text style={styles.merchantName}>{parsedData.merchantName}</Text>
                  <Text style={styles.parsedAmount}>{formatCurrency(parsedData.amount || 0)}</Text>
                </View>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category</Text>
                    <Text style={styles.detailValue}>{parsedData.category?.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {parsedData.date
                        ? new Date(parsedData.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>
                      {parsedData.type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </View>
                </View>

                {/* Notes Section */}
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>NOTES (OPTIONAL)</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes about this transaction..."
                    placeholderTextColor={colors.neutral600}
                    style={styles.notesInput}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Receipt Section */}
                <View style={styles.receiptSection}>
                  <Text style={styles.notesLabel}>RECEIPT (OPTIONAL)</Text>
                  <ReceiptPicker
                    receiptUri={receiptUri}
                    onReceiptChange={setReceiptUri}
                    transactionId={initialTransaction?.id}
                  />
                </View>

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    onPress={() => {
                      if (mode === 'edit') {
                        // In edit mode, go back to input state
                        setParsedData(null);
                      } else {
                        // In create mode, reset input
                        setInput('');
                        setParsedData(null);
                      }
                    }}
                    style={styles.editBtn}
                    activeOpacity={0.7}
                    accessibilityLabel={mode === 'edit' ? "Go back to edit" : "Edit transaction"}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editBtnText}>
                      {mode === 'edit' ? 'Back' : 'Edit'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!parsedData?.merchantName?.trim() || !parsedData?.amount || parsedData.amount <= 0}
                    style={styles.confirmBtn}
                    activeOpacity={0.8}
                    accessibilityLabel={buttonText}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !parsedData?.merchantName?.trim() || !parsedData?.amount || parsedData.amount <= 0 }}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.black} />
                    <Text style={styles.confirmBtnText}>{buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
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
  inputState: {
    gap: spacing[4],
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    paddingRight: spacing[14],
    color: colors.white,
    fontSize: typography.fontSizes.lg,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  micBtn: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.danger,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  analyzeBtnDisabled: {
    opacity: 0.5,
  },
  analyzeBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
  suggestions: {
    marginTop: spacing[4],
  },
  suggestionsLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing[2],
  },
  suggestionChips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  suggestionChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.full,
  },
  suggestionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral300,
  },
  confirmState: {
    gap: spacing[6],
  },
  merchantPreview: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  merchantIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  merchantInitial: {
    fontSize: 28,
    fontWeight: typography.fontWeights.semibold,
    color: colors.mint,
  },
  merchantName: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  parsedAmount: {
    fontSize: typography.fontSizes['3xl'],
    fontFamily: 'monospace',
    color: colors.mint,
    marginTop: spacing[2],
  },
  detailsCard: {
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  notesSection: {
    gap: spacing[2],
  },
  notesLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
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
  receiptSection: {
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  detailValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.white,
    textTransform: 'capitalize',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  editBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
  },
  editBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
  },
  confirmBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
});

export default AddTransaction;
