import type { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/monitoring.service.js';
import { sendSuccess } from '../../../utils/response.js';

export class MonitoringController {
  constructor(private service: MonitoringService) {}

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const timeWindow = (req.query.timeWindow as string) || '24h';
      const data = await this.service.getOverview(orgId, timeWindow);
      sendSuccess(res, data, 200, 'Monitoring overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  runMonitoring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const { modelId, modelVersion, timeWindow } = req.body;
      const data = await this.service.runMonitoring(orgId, modelId, modelVersion, timeWindow);
      sendSuccess(res, data, 200, 'Automated monitoring job completed successfully');
    } catch (error) {
      next(error);
    }
  };

  getFeatureDrift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const data = await this.service.getFeatureDrift(orgId);
      sendSuccess(res, data, 200, 'Feature drift metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getPredictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const data = await this.service.getPredictionAnalytics(orgId);
      sendSuccess(res, data, 200, 'Prediction analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const data = await this.service.getPerformanceAnalytics(orgId);
      sendSuccess(res, data, 200, 'Performance analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const data = await this.service.listSnapshots(orgId);
      sendSuccess(res, data, 200, 'Monitoring history retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getHealthLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = (req as any).authContext?.organization?.id ?? 'default-org';
      const data = await this.service.listHealthLogs(orgId);
      sendSuccess(res, data, 200, 'Health logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
