import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { prisma } from '../lib/prisma.js';

export class HealthController {
  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Basic ping test to confirm PostgreSQL connection through Prisma client
      await prisma.$queryRaw`SELECT 1`;

      sendSuccess(res, {
        status: 'UP',
        database: 'CONNECTED',
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        status: 'OK',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getVersion = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, {
        version: '1.0.0-beta',
        name: 'anomaly-detection-backend',
      });
    } catch (error) {
      next(error);
    }
  };
}
export default HealthController;
