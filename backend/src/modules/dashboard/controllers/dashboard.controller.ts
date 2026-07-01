import { NextFunction, Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UnauthorizedError } from '../../../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.dashboardService.getSummary(auth.organization.id, auth.user.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  charts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.dashboardService.getCharts(auth.organization.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  activity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.dashboardService.getActivity(auth.organization.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.analyticsService.getAnalytics(auth.organization.id, auth.user.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
