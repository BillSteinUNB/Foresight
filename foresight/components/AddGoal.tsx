import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SavingsGoal } from '../types';
import { validateGoalInput } from '../utils/validation';
import { colors, spacing, borderRadius, typography, commonStyles } from '../theme';

const GOAL_ICONS = ['🏖️', '🚗', '🏠', '💍', '📱', '🎓', '💼', '🎮', '✈️', '👶', '🏋️', '🎸'];
const GOAL_COLORS = ['#00D9A5', '#4ECDC4', '#3498DB', '#9B59B6', '#E74C3C', '#F39C12', '#FF6B35', '#FF69B4'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void;
}

const AddGoal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [step, setStep] = useState<1 | 2>(1);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setSelectedIcon('🎯');
      setSelectedColor(GOAL_COLORS[0]);
      setStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    const target = parseFloat(targetAmount);
    const validation = validateGoalInput(name, target);
    
    if (!validation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Could show error message here if needed
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  }, [name, targetAmount]);

  const handleSubmit = useCallback(() => {
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    const validation = validateGoalInput(name, target, current);
    
    if (!validation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      name: name.trim(),
      targetAmount: target,
      currentAmount: current,
      icon: selectedIcon,
      color: selectedColor,
    });
    onClose();
  }, [name, targetAmount, currentAmount, selectedIcon, selectedColor, onAdd, onClose]);

  const isStep1Valid = name.trim() && parseFloat(targetAmount) > 0;

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
            <View style={commonStyles.row}>
              <View style={styles.headerIcon}>
                <Ionicons name="flag" size={20} color={colors.mint} />
              </View>
              <Text style={styles.title}>New Savings Goal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.neutral400} />
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
            <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AnimatePresence>
              {step === 1 ? (
                <MotiView
                  key="step1"
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: -20 }}
                  style={styles.stepContent}
                >
                  {/* Goal Name */}
                  <View style={styles.field}>
                    <Text style={styles.label}>GOAL NAME</Text>
                    <TextInput
                      ref={nameInputRef}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g., Dream Vacation"
                      placeholderTextColor={colors.neutral600}
                      style={styles.input}
                    />
                  </View>

                  {/* Target Amount */}
                  <View style={styles.field}>
                    <Text style={styles.label}>TARGET AMOUNT</Text>
                    <View style={styles.amountInput}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        placeholder="5,000"
                        placeholderTextColor={colors.neutral600}
                        style={styles.amountTextInput}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  {/* Starting Amount */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      STARTING AMOUNT <Text style={styles.optional}>(Optional)</Text>
                    </Text>
                    <View style={styles.amountInput}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        value={currentAmount}
                        onChangeText={setCurrentAmount}
                        placeholder="0"
                        placeholderTextColor={colors.neutral600}
                        style={styles.amountTextInput}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={!isStep1Valid}
                    style={[styles.continueBtn, !isStep1Valid && styles.continueBtnDisabled]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.continueBtnText}>Continue</Text>
                  </TouchableOpacity>
                </MotiView>
              ) : (
                <MotiView
                  key="step2"
                  from={{ opacity: 0, translateX: 20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, translateX: 20 }}
                  style={styles.stepContent}
                >
                  {/* Icon Selection */}
                  <View style={styles.field}>
                    <Text style={styles.label}>CHOOSE AN ICON</Text>
                    <View style={styles.iconGrid}>
                      {GOAL_ICONS.map(icon => (
                        <TouchableOpacity
                          key={icon}
                          onPress={() => {
                            setSelectedIcon(icon);
                            Haptics.selectionAsync();
                          }}
                          style={[styles.iconBtn, selectedIcon === icon && styles.iconBtnActive]}
                        >
                          <Text style={styles.iconText}>{icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Color Selection */}
                  <View style={styles.field}>
                    <Text style={styles.label}>CHOOSE A COLOR</Text>
                    <View style={styles.colorRow}>
                      {GOAL_COLORS.map(color => (
                        <TouchableOpacity
                          key={color}
                          onPress={() => {
                            setSelectedColor(color);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.colorBtn,
                            { backgroundColor: color },
                            selectedColor === color && styles.colorBtnActive,
                          ]}
                        >
                          {selectedColor === color && (
                            <Ionicons name="checkmark" size={18} color={colors.black} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Preview */}
                  <View style={styles.preview}>
                    <Text style={styles.previewLabel}>PREVIEW</Text>
                    <View style={styles.previewCard}>
                      <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
                        <Text style={styles.previewIconText}>{selectedIcon}</Text>
                      </View>
                      <View>
                        <Text style={styles.previewName}>{name || 'Goal Name'}</Text>
                        <Text style={styles.previewProgress}>
                          ${parseFloat(currentAmount) || 0} / ${parseFloat(targetAmount) || 0}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => setStep(1)}
                      style={styles.backBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSubmit}
                      style={styles.createBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.black} />
                      <Text style={styles.createBtnText}>Create Goal</Text>
                    </TouchableOpacity>
                  </View>
                </MotiView>
              )}
            </AnimatePresence>
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
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.mintMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
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
  progressBar: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface400,
  },
  progressStepActive: {
    backgroundColor: colors.mint,
  },
  stepContent: {
    gap: spacing[5],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
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
    fontSize: typography.fontSizes.md,
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
    fontSize: typography.fontSizes.md,
    fontFamily: 'monospace',
    color: colors.neutral400,
  },
  amountTextInput: {
    flex: 1,
    padding: spacing[4],
    paddingLeft: spacing[2],
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontFamily: 'monospace',
  },
  continueBtn: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.mintMuted,
    borderWidth: 2,
    borderColor: colors.mint,
  },
  iconText: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  colorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnActive: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  preview: {
    gap: spacing[3],
  },
  previewLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral500,
    letterSpacing: typography.letterSpacing.wider,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface100,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface300,
    padding: spacing[4],
    gap: spacing[4],
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIconText: {
    fontSize: 28,
  },
  previewName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  previewProgress: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  backBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
  },
  backBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.mint,
    borderRadius: borderRadius.xl,
  },
  createBtnText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.black,
  },
});

export default AddGoal;
