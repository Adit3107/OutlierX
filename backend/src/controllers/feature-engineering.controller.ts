import type { NextFunction, Request, Response } from 'express';
import type { FeatureEngineeringService } from '../services/feature-engineering.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class FeatureEngineeringController {
  constructor(private featureService: FeatureEngineeringService) {}

  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const metrics = await this.featureService.getPipelineMetrics(auth.organization.id);
      sendSuccess(res, metrics, 200, 'Feature engineering metrics retrieved');
    } catch (error) {
      next(error);
    }
  };

  getByTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const { transactionId } = req.params;
      const featureVector = await this.featureService.getFeatureVectorByTransaction(auth.organization.id, transactionId);

      if (!featureVector) {
        sendError(res, 'Feature vector not found for transaction', 'NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, featureVector, 200, 'Feature vector retrieved');
    } catch (error) {
      next(error);
    }
  };
}
