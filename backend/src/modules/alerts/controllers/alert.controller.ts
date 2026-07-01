import { NextFunction, Request, Response } from 'express';
import { AlertService } from '../services/alert.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UnauthorizedError } from '../../../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class AlertController {
  constructor(private alertService: AlertService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.alertService.listAlerts(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search as string | undefined,
        severity: req.query.severity as never,
        status: req.query.status as never,
        isRead: req.query.isRead === undefined ? undefined : req.query.isRead === 'true',
        recommendation: req.query.recommendation as never,
        assigned: req.query.assigned as never,
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
      const data = await this.alertService.getAlert(auth.organization.id, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.alertService.updateAlert(
        auth.organization.id,
        auth.user.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, data, 200, 'Alert updated');
    } catch (error) {
      next(error);
    }
  };

  bulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.alertService.bulkAction(auth.organization.id, auth.user.id, req.body);
      sendSuccess(res, data, 200, 'Alert bulk action completed');
    } catch (error) {
      next(error);
    }
  };
}
