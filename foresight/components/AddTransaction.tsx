import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Transaction, BudgetCategory } from '../types';
import { formatCurrency, isValidAmount } from '../utils';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';

const AI_PROCESSING_DELAY_MS = 1500;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Partial<Transaction>) => void;
}

const AddTransaction: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<Transaction> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setParsedData(null);
      setIsProcessing(false);
      setIsListening(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSimulatedAI = useCallback(() => {
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
  }, [input]);

  const handleConfirm = useCallback(() => {
    if (parsedData && isValidAmount(parsedData.amount || 0)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdd(parsedData);
      onClose();
    }
  }, [parsedData, onAdd, onClose]);

  const handleSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion);
    Haptics.selectionAsync();
  }, []);

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
            <Text style={styles.title}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!parsedData ? (
              /* Input State */
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
                  >
                    <Ionicons name="mic" size={20} color={isListening ? colors.white : colors.neutral400} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleSimulatedAI}
                  disabled={!input.trim() || isProcessing}
                  style={[styles.analyzeBtn, (!input.trim() || isProcessing) && styles.analyzeBtnDisabled]}
                  activeOpacity={0.8}
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

                {/* Suggestions */}
                <View style={styles.suggestions}>
                  <Text style={styles.suggestionsLabel}>SUGGESTIONS</Text>
                  <View style={styles.suggestionChips}>
                    <TouchableOpacity
                      onPress={() => handleSuggestion('Starbucks coffee $6.50')}
                      style={styles.suggestionChip}
                    >
                      <Text style={styles.suggestionText}>☕ Starbucks $6.50</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSuggestion('Uber to work $25')}
                      style={styles.suggestionChip}
                    >
                      <Text style={styles.suggestionText}>🚕 Uber $25</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* Confirmation State */
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
                    <Text style={styles.detailValue}>Today</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account</Text>
                    <Text style={styles.detailValue}>Chase ****4521</Text>
                  </View>
                </View>

                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    onPress={() => setParsedData(null)}
                    style={styles.editBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!isValidAmount(parsedData.amount || 0)}
                    style={styles.confirmBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.black} />
                    <Text style={styles.confirmBtnText}>Confirm</Text>
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
