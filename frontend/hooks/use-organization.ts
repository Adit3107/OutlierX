'use client';

import { useAuthData } from '../providers/auth-provider';

export function useOrganization() {
  const { auth, isLoading, error, refetch } = useAuthData();

  return {
    organization: auth?.organization ?? null,
    isLoading,
    error,
    refetch,
  };
}
