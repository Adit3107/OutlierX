import { NextFunction, Request, Response } from 'express';
import { RuleService } from '../services/rule.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UnauthorizedError } from '../../../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class RuleController {
  constructor(private ruleService: RuleService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.listRules(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search as string | undefined,
        category: req.query.category as never,
        severity: req.query.severity as never,
        enabled: req.query.enabled as boolean | undefined,
        sortBy: (req.query.sortBy as never) ?? 'priority',
        sortOrder: (req.query.sortOrder as never) ?? 'asc',
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.getRule(auth.organization.id, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.createRule(auth.organization.id, auth.user.id, req.body);
      sendSuccess(res, data, 201, 'Rule created');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.updateRule(
        auth.organization.id,
        auth.user.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.deleteRule(auth.organization.id, auth.user.id, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  enable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.setEnabled(auth.organization.id, auth.user.id, req.params.id, true);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  disable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.setEnabled(auth.organization.id, auth.user.id, req.params.id, false);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.duplicateRule(auth.organization.id, auth.user.id, req.params.id);
      sendSuccess(res, data, 201, 'Rule duplicated');
    } catch (error) {
      next(error);
    }
  };

  reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.reorderRules(auth.organization.id, auth.user.id, req.body.items);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  test = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.testRules(
        auth.organization.id,
        req.body.transaction,
        req.body.ruleIds
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  evaluate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.evaluateStored(
        auth.organization.id,
        auth.user.id,
        req.body.transactionIds,
        req.body.source,
        req.body.ruleIds
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.ruleService.history(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        ruleId: req.query.ruleId as string | undefined,
        transactionId: req.query.transactionId as string | undefined,
        matched: req.query.matched as boolean | undefined,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
