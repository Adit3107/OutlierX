import type { AuthContext, Permission, Role } from '@anomaly/shared';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext & {
        clerkUserId: string;
        role: Role;
        permissions: Permission[];
      };
    }
  }
}

export {};
