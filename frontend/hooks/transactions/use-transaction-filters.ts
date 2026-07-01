'use client';

import React from 'react';

export type TransactionSortBy = 'timestamp' | 'amount' | 'merchant' | 'country' | 'createdAt' | 'transactionId';
export type TransactionSortOrder = 'asc' | 'desc';

export interface TransactionFiltersState {
  search: string;
  startDate: string;
  endDate: string;
  country: string;
  merchant: string;
  merchantCategory: string;
  paymentMethod: string;
  currency: string;
  minAmount: string;
  maxAmount: string;
  status: string;
  uploadId: string;
  sortBy: TransactionSortBy;
  sortOrder: TransactionSortOrder;
}

const DEFAULT_FILTERS: TransactionFiltersState = {
  search: '',
  startDate: '',
  endDate: '',
  country: '',
  merchant: '',
  merchantCategory: '',
  paymentMethod: '',
  currency: '',
  minAmount: '',
  maxAmount: '',
  status: '',
  uploadId: '',
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

export function useTransactionFilters() {
  const [filters, setFilters] = React.useState<TransactionFiltersState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const setFilter = React.useCallback(
    <Key extends keyof TransactionFiltersState>(key: Key, value: TransactionFiltersState[Key]) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const clearFilter = React.useCallback((key: keyof TransactionFiltersState) => {
    setFilters((current) => ({ ...current, [key]: DEFAULT_FILTERS[key] }));
  }, []);

  const clearAll = React.useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const queryParams = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
      endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
      country: filters.country || undefined,
      merchant: filters.merchant || undefined,
      merchantCategory: filters.merchantCategory || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      currency: filters.currency || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      status: filters.status || undefined,
      uploadId: filters.uploadId || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }),
    [debouncedSearch, filters]
  );

  return {
    filters,
    debouncedSearch,
    queryParams,
    setFilter,
    clearFilter,
    clearAll,
  };
}
