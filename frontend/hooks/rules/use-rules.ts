'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type {
  PaginatedResponse,
  Rule,
  RuleEvaluationResponse,
  RuleExecution,
  RuleGroupNode,
  RuleSeverity,
  RuleCategory,
} from '@anomaly/shared';

export interface RuleFilters {
  page: number;
  limit: number;
  search?: string;
  category?: RuleCategory | '';
  severity?: RuleSeverity | '';
  enabled?: boolean | '';
  sortBy?: 'name' | 'category' | 'severity' | 'priority' | 'weight' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RulePayload {
  name: string;
  description?: string | null;
  category: RuleCategory;
  severity: RuleSeverity;
  enabled: boolean;
  priority: number;
  weight: number;
  conditionTree: RuleGroupNode;
}

export function useRules(client: AxiosInstance, filters: RuleFilters) {
  return useQuery({
    queryKey: ['rules', filters],
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<Rule> }>('/rules', {
        params: filters,
      });
      return response.data.data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useRule(client: AxiosInstance, id: string) {
  return useQuery({
    queryKey: ['rules', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await client.get<{ data: Rule }>(`/rules/${id}`);
      return response.data.data;
    },
  });
}

export function useRuleHistory(
  client: AxiosInstance,
  input: { page: number; limit: number; ruleId?: string; transactionId?: string; matched?: boolean }
) {
  return useQuery({
    queryKey: ['rules', 'history', input],
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<RuleExecution> }>('/rules/history', {
        params: input,
      });
      return response.data.data;
    },
  });
}

export function useCreateRule(client: AxiosInstance) {
  return useMutation({
    mutationFn: async (payload: RulePayload) => {
      const response = await client.post<{ data: Rule }>('/rules', payload);
      return response.data.data;
    },
  });
}

export function useUpdateRule(client: AxiosInstance, id: string) {
  return useMutation({
    mutationFn: async (payload: Partial<RulePayload>) => {
      const response = await client.patch<{ data: Rule }>(`/rules/${id}`, payload);
      return response.data.data;
    },
  });
}

export function useDeleteRule(client: AxiosInstance) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.delete<{ data: { id: string } }>(`/rules/${id}`);
      return response.data.data;
    },
  });
}

export function useToggleRule(client: AxiosInstance) {
  return useMutation({
    mutationFn: async (input: { id: string; enabled: boolean }) => {
      const endpoint = input.enabled ? 'enable' : 'disable';
      const response = await client.post<{ data: Rule }>(`/rules/${input.id}/${endpoint}`);
      return response.data.data;
    },
  });
}

export function useDuplicateRule(client: AxiosInstance) {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await client.post<{ data: Rule }>(`/rules/${id}/duplicate`);
      return response.data.data;
    },
  });
}

export function useTestRules(client: AxiosInstance) {
  return useMutation({
    mutationFn: async (payload: { transaction: Record<string, unknown>; ruleIds?: string[] }) => {
      const response = await client.post<{ data: RuleEvaluationResponse }>('/rules/test', payload);
      return response.data.data;
    },
  });
}
