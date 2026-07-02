import { Request, Response, NextFunction } from 'express';
import {
  ApiKeyService,
  ActivityService,
  MemberService,
  OrganizationService,
} from '../services/foundation.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

function getAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }

  return req.auth;
}

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      sendSuccess(res, auth.organization, 200, 'Organization loaded');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const organization = await this.organizationService.update(
        auth.organization.id,
        auth.user.id,
        req.body
      );
      sendSuccess(res, organization, 200, 'Organization updated');
    } catch (error) {
      next(error);
    }
  };

  usage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const usage = await this.organizationService.usage(auth.organization.id);
      sendSuccess(res, usage, 200, 'Organization usage loaded');
    } catch (error) {
      next(error);
    }
  };

  transferOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const member = await this.organizationService.transferOwnership(
        auth.organization.id,
        auth.user.id,
        req.body.membershipId
      );
      sendSuccess(res, member, 200, 'Ownership transferred');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const result = await this.organizationService.delete(
        auth.organization.id,
        auth.user.id,
        req.body.confirmName
      );
      sendSuccess(res, result, 200, 'Organization deleted');
    } catch (error) {
      next(error);
    }
  };
}

export class MemberController {
  constructor(private memberService: MemberService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const members = await this.memberService.list(auth.organization.id, {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        search: req.query.search as string | undefined,
        role: req.query.role as any,
        status: req.query.status as any,
      });
      sendSuccess(res, members, 200, 'Members loaded');
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const member = await this.memberService.create(auth.organization.id, auth.user.id, req.body);
      sendSuccess(res, member, 201, 'Member added');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const member = await this.memberService.update(
        auth.organization.id,
        auth.user.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, member, 200, 'Member updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const result = await this.memberService.delete(auth.organization.id, auth.user.id, req.params.id);
      sendSuccess(res, result, 200, 'Member removed');
    } catch (error) {
      next(error);
    }
  };

  resendInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      sendSuccess(
        res,
        { id: req.params.id, organizationId: auth.organization.id, status: 'QUEUED_PLACEHOLDER' },
        200,
        'Invitation resend placeholder queued'
      );
    } catch (error) {
      next(error);
    }
  };
}

export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const keys = await this.apiKeyService.list(auth.organization.id, req.query.status as any);
      sendSuccess(res, keys, 200, 'API keys loaded');
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const key = await this.apiKeyService.create(auth.organization.id, auth.user.id, req.body);
      sendSuccess(res, key, 201, 'API key created');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const key = await this.apiKeyService.delete(auth.organization.id, auth.user.id, req.params.id);
      sendSuccess(res, key, 200, 'API key revoked');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const key = await this.apiKeyService.update(
        auth.organization.id,
        auth.user.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, key, 200, req.body.rotate ? 'API key rotated' : 'API key updated');
    } catch (error) {
      next(error);
    }
  };
}

export class ActivityController {
  constructor(private activityService: ActivityService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuth(req);
      const activity = await this.activityService.list(auth.organization.id, {
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        search: req.query.search as string | undefined,
        action: req.query.action as string | undefined,
        entity: req.query.entity as any,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      });
      sendSuccess(res, activity, 200, 'Activity loaded');
    } catch (error) {
      next(error);
    }
  };
}
