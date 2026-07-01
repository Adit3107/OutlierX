'use client';

import { useAuthData } from '../providers/auth-provider';

export function useCurrentUser() {
  const { auth, isLoading, error, refetch } = useAuthData();

  return {
    user: auth?.user ?? null,
    isLoading,
    error,
    refetch,
  };
}
