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
import { TransactionController, UploadController } from '../controllers/transaction.controller.js';
import { RuleController } from '../modules/rules/controllers/rule.controller.js';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware.js';
import { uploadCsvMiddleware } from '../middlewares/upload.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import {
  apiKeyCreateValidator,
  apiKeyQueryValidator,
  idParamsValidator,
  memberCreateValidator,
  memberUpdateValidator,
  organizationUpdateValidator,
  paginationQueryValidator,
  transactionQueryValidator,
  uploadQueryValidator,
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
import {
  TransactionRepository,
  UploadRepository,
} from '../repositories/transaction.repository.js';
import {
  bulkTransactionActionValidator,
  bulkDeleteTransactionsValidator,
  queryTransactionsValidator,
} from '../validators/transaction.validator.js';
import {
  ruleCreateValidator,
  ruleEvaluateValidator,
  ruleHistoryQueryValidator,
  ruleQueryValidator,
  ruleReorderValidator,
  ruleTestValidator,
  ruleUpdateValidator,
} from '../modules/rules/validators/rule.validator.js';
import {
  CsvParserService,
  CsvValidationService,
  TransactionPersistenceService,
} from '../services/csv-ingestion.service.js';
import { TransactionService, UploadService } from '../services/transaction.service.js';
import { createStorageProvider } from '../services/storage.service.js';
import { RuleRepository } from '../modules/rules/repositories/rule.repository.js';
import { RuleEngineService } from '../modules/rules/services/rule-engine.service.js';
import { ExecutionRecorder } from '../modules/rules/services/execution-recorder.js';
import { RuleService } from '../modules/rules/services/rule.service.js';

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
const uploadRepository = new UploadRepository();
const transactionRepository = new TransactionRepository();
const ruleRepository = new RuleRepository();
const ruleService = new RuleService(
  ruleRepository,
  new RuleEngineService(),
  new ExecutionRecorder(ruleRepository),
  activityService
);
const transactionPersistenceService = new TransactionPersistenceService(transactionRepository);
const csvParserService = new CsvParserService(
  new CsvValidationService(),
  transactionPersistenceService
);
const storageProvider = createStorageProvider();
const uploadController = new UploadController(
  new UploadService(
    uploadRepository,
    csvParserService,
    storageProvider,
    activityService,
    transactionRepository,
    ruleService
  )
);
const transactionController = new TransactionController(
  new TransactionService(transactionRepository, uploadRepository, activityService)
);
const ruleController = new RuleController(ruleService);

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

apiRouter.get(
  '/rules',
  requirePermission(PERMISSIONS.RULES_READ),
  validateQuery(ruleQueryValidator),
  ruleController.list
);
apiRouter.post(
  '/rules',
  requirePermission(PERMISSIONS.RULES_CREATE),
  validateBody(ruleCreateValidator),
  ruleController.create
);
apiRouter.post(
  '/rules/reorder',
  requirePermission(PERMISSIONS.RULES_UPDATE),
  validateBody(ruleReorderValidator),
  ruleController.reorder
);
apiRouter.post(
  '/rules/test',
  requirePermission(PERMISSIONS.RULES_TEST),
  validateBody(ruleTestValidator),
  ruleController.test
);
apiRouter.post(
  '/rules/evaluate',
  requirePermission(PERMISSIONS.RULES_EVALUATE),
  validateBody(ruleEvaluateValidator),
  ruleController.evaluate
);
apiRouter.get(
  '/rules/history',
  requirePermission(PERMISSIONS.RULES_READ),
  validateQuery(ruleHistoryQueryValidator),
  ruleController.history
);
apiRouter.get(
  '/rules/:id',
  requirePermission(PERMISSIONS.RULES_READ),
  validateParams(idParamsValidator),
  ruleController.getById
);
apiRouter.patch(
  '/rules/:id',
  requirePermission(PERMISSIONS.RULES_UPDATE),
  validateParams(idParamsValidator),
  validateBody(ruleUpdateValidator),
  ruleController.update
);
apiRouter.delete(
  '/rules/:id',
  requirePermission(PERMISSIONS.RULES_DELETE),
  validateParams(idParamsValidator),
  ruleController.delete
);
apiRouter.post(
  '/rules/:id/enable',
  requirePermission(PERMISSIONS.RULES_UPDATE),
  validateParams(idParamsValidator),
  ruleController.enable
);
apiRouter.post(
  '/rules/:id/disable',
  requirePermission(PERMISSIONS.RULES_UPDATE),
  validateParams(idParamsValidator),
  ruleController.disable
);
apiRouter.post(
  '/rules/:id/duplicate',
  requirePermission(PERMISSIONS.RULES_CREATE),
  validateParams(idParamsValidator),
  ruleController.duplicate
);

apiRouter.post(
  '/uploads',
  requirePermission(PERMISSIONS.UPLOADS_CREATE),
  uploadCsvMiddleware,
  uploadController.create
);
apiRouter.get(
  '/uploads',
  requirePermission(PERMISSIONS.UPLOADS_READ),
  validateQuery(uploadQueryValidator),
  uploadController.list
);
apiRouter.get(
  '/uploads/:id',
  requirePermission(PERMISSIONS.UPLOADS_READ),
  validateParams(idParamsValidator),
  uploadController.getById
);
apiRouter.delete(
  '/uploads/:id',
  requirePermission(PERMISSIONS.UPLOADS_DELETE),
  validateParams(idParamsValidator),
  uploadController.delete
);
apiRouter.get(
  '/transactions/export',
  requirePermission(PERMISSIONS.TRANSACTIONS_READ),
  validateQuery(queryTransactionsValidator),
  transactionController.export
);
apiRouter.get(
  '/transactions',
  requirePermission(PERMISSIONS.TRANSACTIONS_READ),
  validateQuery(queryTransactionsValidator),
  transactionController.list
);
apiRouter.post(
  '/transactions/bulk-actions',
  requirePermission(PERMISSIONS.TRANSACTIONS_READ),
  validateBody(bulkTransactionActionValidator),
  transactionController.bulkAction
);
apiRouter.get(
  '/transactions/:id',
  requirePermission(PERMISSIONS.TRANSACTIONS_READ),
  validateParams(idParamsValidator),
  transactionController.getById
);
apiRouter.delete(
  '/transactions/:id',
  requirePermission(PERMISSIONS.TRANSACTIONS_DELETE),
  validateParams(idParamsValidator),
  transactionController.delete
);
apiRouter.delete(
  '/transactions',
  requirePermission(PERMISSIONS.TRANSACTIONS_DELETE),
  validateBody(bulkDeleteTransactionsValidator),
  transactionController.deleteMany
);

apiRouter.get(
  '/uploads/:id/transactions',
  requirePermission(PERMISSIONS.TRANSACTIONS_READ),
  validateParams(idParamsValidator),
  validateQuery(transactionQueryValidator),
  transactionController.listByUpload
);

export default apiRouter;
