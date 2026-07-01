import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { TransactionController } from '../controllers/transaction.controller.js';
import { TransactionService } from '../services/transaction.service.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../middlewares/validation.middleware.js';
import { createTransactionValidator, queryTransactionsValidator } from '../validators/transaction.validator.js';

const apiRouter = Router();

// Initialize composition components
const healthController = new HealthController();

const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(transactionRepository);
const transactionController = new TransactionController(transactionService);

// ----------------------------------------------------
// Health / Diagnostic Routes (Unauthenticated)
// ----------------------------------------------------
apiRouter.get('/health', healthController.getHealth);
apiRouter.get('/status', healthController.getStatus);
apiRouter.get('/version', healthController.getVersion);

// ----------------------------------------------------
// Transactions Routes (Authenticated)
// ----------------------------------------------------
apiRouter.post(
  '/transactions',
  requireAuth,
  validateBody(createTransactionValidator),
  transactionController.create
);

apiRouter.get(
  '/transactions',
  requireAuth,
  validateQuery(queryTransactionsValidator),
  transactionController.list
);

apiRouter.get(
  '/transactions/:id',
  requireAuth,
  transactionController.getById
);

export default apiRouter;
