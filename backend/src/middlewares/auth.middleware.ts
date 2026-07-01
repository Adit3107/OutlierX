import { createClerkClient, verifyToken } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { getPermissionsForRole, hasPermission } from '../config/permissions.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService, mapClerkUserToProfile } from '../services/auth.service.js';
import { ApiError, ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const clerkClient = createClerkClient({
  secretKey: config.auth.clerkSecretKey,
  publishableKey: config.auth.clerkPublishableKey,
});

const authService = new AuthService(new AuthRepository());

function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header credentials');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }

  return token;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = getBearerToken(req);
    const verifiedToken = await verifyToken(token, {
      secretKey: config.auth.clerkSecretKey,
      authorizedParties: [config.server.frontendUrl],
    });

    const clerkUserId = verifiedToken.sub;
    if (!clerkUserId) {
      throw new UnauthorizedError('Invalid Clerk token subject');
    }

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const authContext = await authService.syncAuthenticatedUser(
      mapClerkUserToProfile(clerkUser, clerkUserId)
    );

    req.auth = {
      ...authContext,
      clerkUserId,
      role: authContext.role,
      permissions: getPermissionsForRole(authContext.role),
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...roles: NonNullable<Request['auth']>['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new UnauthorizedError('Authentication is required');
    }

    if (!roles.includes(req.auth.role)) {
      throw new ForbiddenError('Insufficient role for this operation');
    }

    next();
  };
}

export function requirePermission(permission: NonNullable<Request['auth']>['permissions'][number]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new UnauthorizedError('Authentication is required');
    }

    if (!hasPermission(req.auth.role, permission)) {
      throw new ForbiddenError('Insufficient permission for this operation');
    }

    next();
  };
}

export default requireAuth;
