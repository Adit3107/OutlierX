import { NextFunction, Request, Response } from 'express';
import { DecisionService } from '../services/decision.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UnauthorizedError } from '../../../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class DecisionController {
  constructor(private decisionService: DecisionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.decisionService.listDecisions(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        transactionId: req.query.transactionId as string | undefined,
        riskLevel: req.query.riskLevel as never,
        recommendation: req.query.recommendation as never,
        decisionStrategy: req.query.decisionStrategy as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.decisionService.getDecision(auth.organization.id, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  recalculate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.decisionService.recalculate(
        auth.organization.id,
        auth.user.id,
        req.body.transactionIds,
        'RECALCULATED'
      );
      sendSuccess(res, data, 201, 'Decision recalculation completed');
    } catch (error) {
      next(error);
    }
  };

  test = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = this.decisionService.test({
        rule: {
          executionId: null,
          score: req.body.rule.score,
          riskLevel: null,
          confidence: req.body.rule.confidence ?? 0.8,
          triggeredRules: req.body.rule.triggeredRules,
          executionTimeMs: 0,
          createdAt: new Date(),
        },
        ml: {
          predictionId: null,
          score: req.body.ml.score,
          prediction: req.body.ml.prediction,
          confidence: req.body.ml.confidence ?? 0.8,
          modelVersion: req.body.ml.modelVersion,
          processingTime: req.body.ml.processingTime,
          processedAt: new Date(),
        },
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getTransactionDecision = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.decisionService.getTransactionDecision(
        auth.organization.id,
        req.params.id
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
