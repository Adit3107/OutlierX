import type { NextFunction, Request, Response } from 'express';
import type { ModelRegistryService } from '../services/model-registry.service.js';
import { sendSuccess } from '../utils/response.js';

export class ModelRegistryController {
  constructor(private registryService: ModelRegistryService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.registryService.listModels();
      sendSuccess(res, data, 200, 'Model registry list retrieved');
    } catch (error) {
      next(error);
    }
  };

  health = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.registryService.getModelsHealth();
      sendSuccess(res, data, 200, 'Model health metrics retrieved');
    } catch (error) {
      next(error);
    }
  };

  stats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.registryService.getModelStats();
      sendSuccess(res, data, 200, 'Model statistics retrieved');
    } catch (error) {
      next(error);
    }
  };
}
