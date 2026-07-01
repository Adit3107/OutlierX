'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import type { AuthContext, Permission } from '@anomaly/shared';
import { createApiClient } from '../lib/api-client';

interface AuthState {
  auth: AuthContext | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthDataContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const client = useMemo(() => createApiClient(() => getToken()), [getToken]);

  const authQuery = useQuery({
    queryKey: ['auth', 'me'],
    enabled: Boolean(isLoaded && isSignedIn),
    queryFn: async () => {
      const response = await client.get<{ data: AuthContext }>('/auth/me');
      return response.data.data;
    },
    retry: false,
  });

  const value = useMemo<AuthState>(
    () => ({
      auth: authQuery.data ?? null,
      isSignedIn: Boolean(isSignedIn),
      isLoaded,
      isLoading: authQuery.isLoading,
      error: authQuery.error,
      refetch: () => {
        void authQuery.refetch();
      },
      hasPermission: (permission: Permission) =>
        Boolean(authQuery.data?.permissions.includes(permission)),
    }),
    [authQuery, isLoaded, isSignedIn]
  );

  return <AuthDataContext.Provider value={value}>{children}</AuthDataContext.Provider>;
}

export function useAuthData() {
  const context = useContext(AuthDataContext);
  if (!context) {
    throw new Error('useAuthData must be used within AuthProvider');
  }

  return context;
}
