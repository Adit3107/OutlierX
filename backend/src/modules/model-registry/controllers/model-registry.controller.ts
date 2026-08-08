import type { Request, Response, NextFunction } from 'express';
import { ModelRegistryService } from '../services/model-registry.service.js';
import { sendSuccess } from '../../../utils/response.js';

export class ModelRegistryController {
  constructor(private service: ModelRegistryService) {}

  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getRegistryStatus();
      sendSuccess(res, data, 200, 'Model Registry status retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  listModels = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.listModels();
      sendSuccess(res, data, 200, 'Models retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getModelByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.params;
      const data = await this.service.getModelByName(name);
      sendSuccess(res, data, 200, `Model '${name}' retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  getVersionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { versionId } = req.params;
      const data = await this.service.getVersionById(versionId);
      sendSuccess(res, data, 200, 'Model version retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  activateVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { versionId } = req.params;
      const { reason } = req.body;
      const authCtx = (req as any).authContext;
      const orgId = authCtx?.organization?.id ?? 'default-org';
      const userId = authCtx?.user?.id ?? 'system';

      const data = await this.service.activateVersion(orgId, userId, versionId, reason);
      sendSuccess(res, data, 200, `Model version '${data.version}' activated successfully`);
    } catch (error) {
      next(error);
    }
  };

  rollbackVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetVersionId, reason } = req.body;
      const authCtx = (req as any).authContext;
      const orgId = authCtx?.organization?.id ?? 'default-org';
      const userId = authCtx?.user?.id ?? 'system';

      const data = await this.service.rollbackVersion(orgId, userId, targetVersionId, reason);
      sendSuccess(res, data, 200, `Rolled back successfully to version '${data.version}'`);
    } catch (error) {
      next(error);
    }
  };

  archiveVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { versionId } = req.params;
      const { reason } = req.body;
      const authCtx = (req as any).authContext;
      const orgId = authCtx?.organization?.id ?? 'default-org';
      const userId = authCtx?.user?.id ?? 'system';

      const data = await this.service.archiveVersion(orgId, userId, versionId, reason);
      sendSuccess(res, data, 200, `Model version '${data.version}' archived successfully`);
    } catch (error) {
      next(error);
    }
  };

  compareVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { versionAId, versionBId } = req.body;
      const data = await this.service.compareVersions(versionAId, versionBId);
      sendSuccess(res, data, 200, 'Model comparison matrix generated successfully');
    } catch (error) {
      next(error);
    }
  };

  getDeploymentHistory = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.listDeploymentHistory();
      sendSuccess(res, data, 200, 'Deployment history retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
