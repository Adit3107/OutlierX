import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type {
  FeatureDriftMetric,
  MLMonitoringSnapshot,
  MonitoringOverviewPayload,
  PerformanceAnalyticsPayload,
  PredictionAnalyticsPayload,
} from '@anomaly/shared';

export function useMonitoringOverview(client: AxiosInstance | null | undefined, timeWindow = '24h') {
  return useQuery({
    queryKey: ['monitoring', 'overview', timeWindow],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: MonitoringOverviewPayload }>('/monitoring/overview', {
        params: { timeWindow },
      });
      return res.data.data;
    },
  });
}

export function useFeatureDriftMetrics(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['monitoring', 'feature-drift'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: FeatureDriftMetric[] }>('/monitoring/features');
      return res.data.data;
    },
  });
}

export function usePredictionAnalytics(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['monitoring', 'predictions'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: PredictionAnalyticsPayload }>('/monitoring/predictions');
      return res.data.data;
    },
  });
}

export function usePerformanceAnalytics(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['monitoring', 'performance'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: PerformanceAnalyticsPayload }>('/monitoring/performance');
      return res.data.data;
    },
  });
}

export function useMonitoringHistory(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['monitoring', 'history'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: MLMonitoringSnapshot[] }>('/monitoring/history');
      return res.data.data;
    },
  });
}

export function useRunMonitoringJob(client: AxiosInstance | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { modelId?: string; timeWindow?: string }) => {
      if (!client) throw new Error('API client required');
      const res = await client.post<{ data: MLMonitoringSnapshot }>('/monitoring/run', payload ?? {});
      return res.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monitoring'] });
    },
  });
}
