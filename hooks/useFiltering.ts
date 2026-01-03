import { useState, useCallback, useMemo } from 'react';
import { BudgetCategory } from '../types';

export type FilterType = 'all' | 'income' | 'expense';
export type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface DateRangeBounds {
  start: Date;
  end: Date;
}

export interface FilterState {
  filter: FilterType;
  dateRange: DateRangeType;
  searchQuery: string;
  selectedCategories: Set<BudgetCategory>;
}

export interface UseFilteringReturn {
  // State
  filter: FilterType;
  dateRange: DateRangeType;
  searchQuery: string;
  selectedCategories: Set<BudgetCategory>;
  showFilters: boolean;
  hasActiveFilters: boolean;
  dateRangeBounds: DateRangeBounds | null;

  // Actions
  setFilter: (filter: FilterType) => void;
  setDateRange: (dateRange: DateRangeType) => void;
  setSearchQuery: (query: string) => void;
  setShowFilters: (show: boolean) => void;
  toggleCategory: (category: BudgetCategory) => void;
  clearFilters: () => void;
  toggleFilters: () => void;

  // Derived
  allCategories: BudgetCategory[];
}

export const useFiltering = (
  transactions?: Array<{ category: BudgetCategory; type: 'income' | 'expense'; date: string }>,
  onFilterChange?: (filters: FilterState) => void
): UseFilteringReturn => {
  const [filter, setFilterState] = useState<FilterType>('all');
  const [dateRange, setDateRangeState] = useState<DateRangeType>('all');
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedCategories, setSelectedCategoriesState] = useState<Set<BudgetCategory>>(new Set());
  const [showFilters, setShowFiltersState] = useState(false);

  // Calculate date range boundaries
  const dateRangeBounds = useMemo((): DateRangeBounds | null => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case 'today':
        return { start: startOfToday, end: now };
      case 'week': {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
        return { start: startOfWeek, end: now };
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      }
      default:
        return null; // 'all' - no date filtering
    }
  }, [dateRange]);

  // Get all available categories from transactions
  const allCategories = useMemo((): BudgetCategory[] => {
    if (!transactions) return [];
    const cats = new Set<BudgetCategory>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [transactions]);

  const hasActiveFilters = useMemo(
    () =>
      filter !== 'all' ||
      dateRange !== 'all' ||
      searchQuery.trim().length > 0 ||
      selectedCategories.size > 0,
    [filter, dateRange, searchQuery, selectedCategories]
  );

  const setFilter = useCallback((newFilter: FilterType) => {
    setFilterState(newFilter);
    onFilterChange?.({ filter: newFilter, dateRange, searchQuery, selectedCategories });
  }, [dateRange, searchQuery, selectedCategories, onFilterChange]);

  const setDateRange = useCallback((newDateRange: DateRangeType) => {
    setDateRangeState(newDateRange);
    onFilterChange?.({ filter, dateRange: newDateRange, searchQuery, selectedCategories });
  }, [filter, searchQuery, selectedCategories, onFilterChange]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    onFilterChange?.({ filter, dateRange, searchQuery: query, selectedCategories });
  }, [filter, dateRange, selectedCategories, onFilterChange]);

  const setShowFilters = useCallback((show: boolean) => {
    setShowFiltersState(show);
  }, []);

  const toggleCategory = useCallback((category: BudgetCategory) => {
    setSelectedCategoriesState((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState('all');
    setDateRangeState('all');
    setSearchQueryState('');
    setSelectedCategoriesState(new Set());
    setShowFiltersState(false);
    onFilterChange?.({
      filter: 'all',
      dateRange: 'all',
      searchQuery: '',
      selectedCategories: new Set(),
    });
  }, [onFilterChange]);

  const toggleFilters = useCallback(() => {
    setShowFiltersState((prev) => !prev);
  }, []);

  return {
    filter,
    dateRange,
    searchQuery,
    selectedCategories,
    showFilters,
    hasActiveFilters,
    dateRangeBounds,
    setFilter,
    setDateRange,
    setSearchQuery,
    setShowFilters,
    toggleCategory,
    clearFilters,
    toggleFilters,
    allCategories,
  };
};

// Helper function to filter transactions based on filter state
export const filterTransactions = <T extends { category: BudgetCategory; type: 'income' | 'expense'; date: string; merchantName: string }>(
  transactions: T[],
  filterType: FilterType,
  dateRangeBoundsValue: DateRangeBounds | null,
  searchQueryValue: string,
  selectedCategoriesValue: Set<BudgetCategory>
): T[] => {
  return transactions.filter((t) => {
    // Type filter
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterType === 'expense' && t.type !== 'expense') return false;

    // Date range filter
    if (dateRangeBoundsValue) {
      const txDate = new Date(t.date);
      if (txDate < dateRangeBoundsValue.start || txDate > dateRangeBoundsValue.end) return false;
    }

    // Category filter
    if (selectedCategoriesValue.size > 0 && !selectedCategoriesValue.has(t.category)) return false;

    // Search filter
    if (searchQueryValue.trim().length > 0) {
      const query = searchQueryValue.toLowerCase();
      const matchesMerchant = t.merchantName.toLowerCase().includes(query);
      const matchesCategory = t.category.toLowerCase().includes(query);
      if (!matchesMerchant && !matchesCategory) return false;
    }
    return true;
  });
};
