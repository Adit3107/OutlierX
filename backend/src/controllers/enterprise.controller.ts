import { NextFunction, Request, Response } from 'express';
import {
  AdminService,
  OpenApiService,
  ProfileService,
  SettingsService,
  SystemHealthService,
} from '../services/enterprise.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';
import { config } from '../config/index.js';

function getAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }
  return req.auth;
}

export class ProfileController {
  constructor(private profileService: ProfileService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const profile = await this.profileService.get(auth.user.id, auth.organization.id, auth.membership.id);
      sendSuccess(res, profile, 200, 'Profile loaded');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const profile = await this.profileService.update(auth.user.id, auth.organization.id, req.body);
      sendSuccess(res, profile, 200, 'Profile updated');
    } catch (error) {
      next(error);
    }
  };
}

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const settings = await this.settingsService.get(auth.user.id, auth.organization.id);
      sendSuccess(res, settings, 200, 'Settings loaded');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const settings = await this.settingsService.update(auth.user.id, auth.organization.id, req.body);
      sendSuccess(res, settings, 200, 'Settings updated');
    } catch (error) {
      next(error);
    }
  };
}

export class AdminController {
  constructor(private adminService: AdminService) {}

  dashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await this.adminService.dashboard();
      sendSuccess(res, dashboard, 200, 'Admin dashboard loaded');
    } catch (error) {
      next(error);
    }
  };
}

export class SystemHealthController {
  constructor(private systemHealthService: SystemHealthService) {}

  get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.systemHealthService.get();
      sendSuccess(res, health, 200, 'System health loaded');
    } catch (error) {
      next(error);
    }
  };
}

export class OpenApiController {
  constructor(private openApiService: OpenApiService) {}

  get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(this.openApiService.getDocument(config.server.apiUrl));
    } catch (error) {
      next(error);
    }
  };
}
