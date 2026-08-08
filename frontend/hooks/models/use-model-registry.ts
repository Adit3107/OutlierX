import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import type {
  MLModel,
  MLModelVersion,
  ModelComparison,
  ModelDeploymentHistory,
  RegistryStatusPayload,
} from '@anomaly/shared';

export function useModelRegistryStatus(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['model-registry', 'status'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: RegistryStatusPayload }>('/models/status');
      return res.data.data;
    },
  });
}

export function useModelsList(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['models', 'list'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: MLModel[] }>('/models');
      return res.data.data;
    },
  });
}

export function useModelDeploymentHistory(client: AxiosInstance | null | undefined) {
  return useQuery({
    queryKey: ['models', 'deployment-history'],
    enabled: Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error('API client required');
      const res = await client.get<{ data: ModelDeploymentHistory[] }>('/models/history');
      return res.data.data;
    },
  });
}

export function useActivateModelVersion(client: AxiosInstance | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ versionId, reason }: { versionId: string; reason?: string }) => {
      if (!client) throw new Error('API client required');
      const res = await client.post<{ data: MLModelVersion }>(`/models/versions/${versionId}/activate`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['models'] });
      void queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
  });
}

export function useRollbackModelVersion(client: AxiosInstance | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetVersionId, reason }: { targetVersionId?: string; reason?: string }) => {
      if (!client) throw new Error('API client required');
      const res = await client.post<{ data: MLModelVersion }>('/models/rollback', { targetVersionId, reason });
      return res.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['models'] });
      void queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
  });
}

export function useArchiveModelVersion(client: AxiosInstance | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ versionId, reason }: { versionId: string; reason?: string }) => {
      if (!client) throw new Error('API client required');
      const res = await client.post<{ data: MLModelVersion }>(`/models/versions/${versionId}/archive`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['models'] });
      void queryClient.invalidateQueries({ queryKey: ['model-registry'] });
    },
  });
}

export function useCompareModelVersions(client: AxiosInstance | null | undefined) {
  return useMutation({
    mutationFn: async ({ versionAId, versionBId }: { versionAId: string; versionBId: string }) => {
      if (!client) throw new Error('API client required');
      const res = await client.post<{ data: ModelComparison }>('/models/compare', { versionAId, versionBId });
      return res.data.data;
    },
  });
}
