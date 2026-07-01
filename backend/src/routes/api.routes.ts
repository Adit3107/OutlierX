import { Router } from 'express';
import { PERMISSIONS } from '@anomaly/shared';
import { HealthController } from '../controllers/health.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import {
  ActivityController,
  ApiKeyController,
  MemberController,
  OrganizationController,
} from '../controllers/foundation.controller.js';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import {
  apiKeyCreateValidator,
  apiKeyQueryValidator,
  idParamsValidator,
  memberCreateValidator,
  memberUpdateValidator,
  organizationUpdateValidator,
  paginationQueryValidator,
} from '../validators/foundation.validator.js';
import {
  ActivityRepository,
  ApiKeyRepository,
  MemberRepository,
  OrganizationRepository,
} from '../repositories/foundation.repository.js';
import {
  ActivityService,
  ApiKeyService,
  MemberService,
  OrganizationService,
} from '../services/foundation.service.js';

const apiRouter = Router();

const healthController = new HealthController();
const authController = new AuthController();

const activityService = new ActivityService(new ActivityRepository());
const organizationController = new OrganizationController(
  new OrganizationService(new OrganizationRepository(), activityService)
);
const memberController = new MemberController(
  new MemberService(new MemberRepository(), activityService)
);
const apiKeyController = new ApiKeyController(
  new ApiKeyService(new ApiKeyRepository(), activityService)
);
const activityController = new ActivityController(activityService);

apiRouter.get('/health', healthController.getHealth);
apiRouter.get('/status', healthController.getStatus);
apiRouter.get('/version', healthController.getVersion);

apiRouter.use(requireAuth);

apiRouter.get('/auth/me', authController.me);

apiRouter.get(
  '/organization',
  requirePermission(PERMISSIONS.ORGANIZATION_READ),
  organizationController.get
);
apiRouter.patch(
  '/organization',
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  validateBody(organizationUpdateValidator),
  organizationController.update
);

apiRouter.get('/members', requirePermission(PERMISSIONS.MEMBERS_READ), memberController.list);
apiRouter.post(
  '/members',
  requirePermission(PERMISSIONS.MEMBERS_CREATE),
  validateBody(memberCreateValidator),
  memberController.create
);
apiRouter.patch(
  '/members/:id',
  requirePermission(PERMISSIONS.MEMBERS_UPDATE),
  validateParams(idParamsValidator),
  validateBody(memberUpdateValidator),
  memberController.update
);
apiRouter.delete(
  '/members/:id',
  requirePermission(PERMISSIONS.MEMBERS_DELETE),
  validateParams(idParamsValidator),
  memberController.delete
);

apiRouter.get(
  '/api-keys',
  requirePermission(PERMISSIONS.API_KEYS_READ),
  validateQuery(apiKeyQueryValidator),
  apiKeyController.list
);
apiRouter.post(
  '/api-keys',
  requirePermission(PERMISSIONS.API_KEYS_CREATE),
  validateBody(apiKeyCreateValidator),
  apiKeyController.create
);
apiRouter.delete(
  '/api-keys/:id',
  requirePermission(PERMISSIONS.API_KEYS_DELETE),
  validateParams(idParamsValidator),
  apiKeyController.delete
);

apiRouter.get(
  '/activity',
  requirePermission(PERMISSIONS.ACTIVITY_READ),
  validateQuery(paginationQueryValidator),
  activityController.list
);

export default apiRouter;
