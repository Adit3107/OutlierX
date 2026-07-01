import { createClerkClient } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../lib/logger.js';

// Initialize Clerk SDK
export const clerkClient = createClerkClient({
  secretKey: config.auth.clerkSecretKey,
  publishableKey: config.auth.clerkPublishableKey,
});

/**
 * Placeholder authentication middleware.
 * Verifies standard Authorization header existence and mocks request context.
 * Role validation and Clerk token verification will be fully implemented in subsequent phases.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (config.server.env === 'production') {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header credentials');
    }
  }

  logger.debug('Auth middleware placeholder called, attaching mock auth credentials');

  // Attach mock auth profile to Express request interface
  (req as any).auth = {
    userId: 'user_dev_placeholder_99',
    orgId: 'org_dev_placeholder_88',
    role: 'ADMIN',
  };

  next();
}
export default requireAuth;
