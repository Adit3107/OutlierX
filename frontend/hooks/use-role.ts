'use client';

import { useAuthData } from '../providers/auth-provider';

export function useRole() {
  const { auth, isLoading } = useAuthData();

  return {
    role: auth?.role ?? null,
    isLoading,
  };
}
