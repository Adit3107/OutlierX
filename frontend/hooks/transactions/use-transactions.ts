'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type { PaginatedResponse, Transaction } from '@anomaly/shared';
import type { TransactionFiltersState } from './use-transaction-filters';

export function useTransactions(
  client: AxiosInstance,
  input: {
    page: number;
    limit: number;
    filters: Partial<TransactionFiltersState> & Record<string, string | number | undefined>;
  }
) {
  return useQuery({
    queryKey: ['transactions', input],
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<Transaction> }>('/transactions', {
        params: {
          page: input.page,
          limit: input.limit,
          ...input.filters,
        },
      });
      return response.data.data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useTransaction(client: AxiosInstance, transactionId: string) {
  return useQuery({
    queryKey: ['transactions', transactionId],
    enabled: Boolean(transactionId),
    queryFn: async () => {
      const response = await client.get<{ data: Transaction }>(`/transactions/${transactionId}`);
      return response.data.data;
    },
  });
}
