import { NextFunction, Request, Response } from 'express';
import { PredictionService } from '../services/prediction.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }

  return req.auth;
}

export class PredictionController {
  constructor(private predictionService: PredictionService) {}

  predictTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.predictionService.predictStoredTransaction(
        auth.organization.id,
        req.params.id
      );
      sendSuccess(res, data, 200, 'ML prediction processed');
    } catch (error) {
      next(error);
    }
  };
}
