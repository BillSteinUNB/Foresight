import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = Math.floor((SCREEN_WIDTH - spacing[6] * 2 - spacing[1] * 12) / 7);

const DatePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
  minDate,
  maxDate,
  title = 'Select Date',
}) => {
  const initialDate = selectedDate || new Date();
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [tempSelected, setTempSelected] = useState<Date>(initialDate);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      const date = selectedDate || new Date();
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
      setTempSelected(date);
    }
  }, [visible, selectedDate]);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Calculate days in current month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToPrevMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  }, [currentYear, currentMonth]);

  const goToNextMonth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  }, [currentYear, currentMonth]);

  const handleDayPress = useCallback((date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempSelected(date);
  }, []);

  const handleConfirm = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(tempSelected);
    onClose();
  }, [tempSelected, onSelect, onClose]);

  const isDateDisabled = useCallback((date: Date) => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  }, [minDate, maxDate]);

  const isDateSelected = useCallback((date: Date) => {
    return (
      date.getDate() === tempSelected.getDate() &&
      date.getMonth() === tempSelected.getMonth() &&
      date.getFullYear() === tempSelected.getFullYear()
    );
  }, [tempSelected]);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    return prevMonth >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }, [currentYear, currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    return nextMonth <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  }, [currentYear, currentMonth, maxDate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose} 
          activeOpacity={1} 
          accessibilityLabel="Close date picker"
          accessibilityRole="button"
        />

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.container}
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

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goToPrevMonth}
              disabled={!canGoPrev}
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={canGoPrev ? colors.white : colors.neutral600} 
              />
            </TouchableOpacity>

            <Text style={styles.monthYear}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={!canGoNext}
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              accessibilityLabel="Next month"
              accessibilityRole="button"
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={canGoNext ? colors.white : colors.neutral600} 
              />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  onPress={() => !disabled && handleDayPress(date)}
                  disabled={disabled}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    today && !selected && styles.dayCellToday,
                  ]}
                  accessibilityLabel={`${date.getDate()} ${MONTHS[date.getMonth()]}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      disabled && styles.dayTextDisabled,
                      selected && styles.dayTextSelected,
                      today && !selected && styles.dayTextToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Preview */}
          <View style={styles.preview}>
            <Ionicons name="calendar" size={18} color={colors.mint} />
            <Text style={styles.previewText}>
              {tempSelected.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

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
              onPress={handleConfirm} 
              style={styles.confirmBtn}
              accessibilityLabel="Confirm date"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={18} color={colors.black} />
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    backgroundColor: colors.surface200,
    borderRadius: borderRadius['3xl'],
    padding: spacing[5],
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.surface300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[2],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  monthYear: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  weekdayText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[0.5],
  },
  dayCellSelected: {
    backgroundColor: colors.mint,
    borderRadius: borderRadius.full,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: borderRadius.full,
  },
  dayText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  dayTextDisabled: {
    color: colors.neutral600,
  },
  dayTextSelected: {
    color: colors.black,
    fontWeight: typography.fontWeights.bold,
  },
  dayTextToday: {
    color: colors.mint,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginTop: spacing[4],
  },
  previewText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral300,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.surface300,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  cancelBtnText: {
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

export default DatePickerModal;
