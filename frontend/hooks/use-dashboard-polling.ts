'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type {
  Alert,
  AlertDetail,
  AnalyticsPayload,
  DashboardActivity,
  DashboardCharts,
  DashboardSummary,
  PaginatedResponse,
} from '@anomaly/shared';

export const DASHBOARD_POLL_INTERVAL = 30_000;

export function useDashboardSummary(client: AxiosInstance) {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await client.get<{ data: DashboardSummary }>('/dashboard/summary');
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}

export function useDashboardCharts(client: AxiosInstance) {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      const response = await client.get<{ data: DashboardCharts }>('/dashboard/charts');
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}

export function useDashboardActivity(client: AxiosInstance) {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const response = await client.get<{ data: DashboardActivity }>('/dashboard/activity');
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}

export function useAnalytics(client: AxiosInstance) {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await client.get<{ data: AnalyticsPayload }>('/analytics');
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}

export function useAlerts(client: AxiosInstance, params: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<Alert> }>('/alerts', { params });
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}

export function useAlertDetail(client: AxiosInstance, id: string) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: async () => {
      const response = await client.get<{ data: AlertDetail }>(`/alerts/${id}`);
      return response.data.data;
    },
    refetchInterval: DASHBOARD_POLL_INTERVAL,
  });
}
