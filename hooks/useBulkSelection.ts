import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Transaction } from '../types';

interface UseBulkSelectionOptions {
  onBulkDelete?: (ids: string[]) => void;
  onBulkSelect?: (ids: string[]) => void;
}

interface UseBulkSelectionReturn<T extends { id: string }> {
  selectionMode: boolean;
  selectedIds: Set<string>;
  enterSelectionMode: (initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  toggleSelectAll: (items: T[]) => void;
  handleBulkDelete: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
  hasSelection: boolean;
}

export function useBulkSelection<T extends { id: string }>(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn<T> {
  const { onBulkDelete, onBulkSelect } = options;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const hasSelection = useMemo(() => selectedIds.size > 0, [selectedIds]);

  const enterSelectionMode = useCallback((initialId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onBulkSelect?.(Array.from(next));
      return next;
    });
  }, [onBulkSelect]);

  const selectAll = useCallback((items: T[]) => {
    Haptics.selectionAsync();
    const allIds = items.map((item) => item.id);
    setSelectedIds(new Set(allIds));
    onBulkSelect?.(allIds);
  }, [onBulkSelect]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    onBulkSelect?.([]);
  }, [onBulkSelect]);

  const toggleSelectAll = useCallback(
    (items: T[]) => {
      if (selectedIds.size === items.length) {
        deselectAll();
      } else {
        selectAll(items);
      }
    },
    [selectedIds.size, selectAll, deselectAll]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onBulkDelete?.(Array.from(selectedIds));
            exitSelectionMode();
          },
        },
      ]
    );
  }, [selectedIds, onBulkDelete, exitSelectionMode]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return {
    selectionMode,
    selectedIds,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    handleBulkDelete,
    isSelected,
    selectedCount,
    hasSelection,
  };
}

// Transaction-specific bulk selection hook
export function useTransactionBulkSelection(
  onDeleteTransactions?: (ids: string[]) => void
) {
  return useBulkSelection<Transaction>({
    onBulkDelete: onDeleteTransactions,
  });
}
