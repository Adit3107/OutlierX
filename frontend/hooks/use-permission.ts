'use client';

import type { Permission } from '@anomaly/shared';
import { useAuthData } from '../providers/auth-provider';

export function usePermission(permission?: Permission) {
  const { auth, hasPermission } = useAuthData();

  return {
    permissions: auth?.permissions ?? [],
    hasPermission: permission ? hasPermission(permission) : false,
    can: hasPermission,
  };
}
