import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { sendSuccess } from '../utils/response.js';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Retrieve organization context from auth middleware
      const orgId = (req as any).auth.orgId;
      const data = await this.transactionService.createTransaction(orgId, req.body);
      sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.transactionService.getTransaction(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const category = req.query.category as string | undefined;

      const data = await this.transactionService.getTransactions({
        page,
        limit,
        category,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
