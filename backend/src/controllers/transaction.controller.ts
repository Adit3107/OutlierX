import { NextFunction, Request, Response } from 'express';
import { TransactionService, UploadService } from '../services/transaction.service.js';
import { sendSuccess } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';

function requireRequestAuth(req: Request) {
  if (!req.auth) {
    throw new UnauthorizedError('Authentication is required');
  }

  return req.auth;
}

export class UploadController {
  constructor(private uploadService: UploadService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.uploadService.uploadCsv({
        organizationId: auth.organization.id,
        userId: auth.user.id,
        file: req.file,
      });
      sendSuccess(res, data, 201, 'Upload processed');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.uploadService.listUploads(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        status: req.query.status as never,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.uploadService.getUpload(auth.organization.id, req.params.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.uploadService.deleteUpload(
        auth.organization.id,
        auth.user.id,
        req.params.id
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.listTransactions(auth.organization.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sortBy: (req.query.sortBy as never) ?? 'timestamp',
        sortOrder: (req.query.sortOrder as never) ?? 'desc',
        search: req.query.search as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        country: req.query.country as string | undefined,
        merchant: req.query.merchant as string | undefined,
        merchantCategory: req.query.merchantCategory as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
        currency: req.query.currency as string | undefined,
        minAmount: req.query.minAmount as number | undefined,
        maxAmount: req.query.maxAmount as number | undefined,
        uploadId: req.query.uploadId as string | undefined,
        status: req.query.status as string | undefined,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  export = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.exportTransactions(auth.organization.id, auth.user.id, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sortBy: (req.query.sortBy as never) ?? 'timestamp',
        sortOrder: (req.query.sortOrder as never) ?? 'desc',
        search: req.query.search as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        country: req.query.country as string | undefined,
        merchant: req.query.merchant as string | undefined,
        merchantCategory: req.query.merchantCategory as string | undefined,
        paymentMethod: req.query.paymentMethod as string | undefined,
        currency: req.query.currency as string | undefined,
        minAmount: req.query.minAmount as number | undefined,
        maxAmount: req.query.maxAmount as number | undefined,
        uploadId: req.query.uploadId as string | undefined,
        status: req.query.status as string | undefined,
        ids: req.query.ids as string | undefined,
        format: (req.query.format as never) ?? 'csv',
        scope: (req.query.scope as never) ?? 'filtered',
      });

      res.setHeader('Content-Type', data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
      res.status(200).send(data.body);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.getTransaction(
        auth.organization.id,
        auth.user.id,
        req.params.id
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.deleteTransaction(
        auth.organization.id,
        auth.user.id,
        req.params.id
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.deleteTransactions(
        auth.organization.id,
        auth.user.id,
        req.body.ids
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  bulkAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.logBulkAction(
        auth.organization.id,
        auth.user.id,
        req.body
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listByUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = requireRequestAuth(req);
      const data = await this.transactionService.listUploadTransactions(
        auth.organization.id,
        req.params.id,
        {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 20,
          sortBy: (req.query.sortBy as never) ?? 'timestamp',
          sortOrder: (req.query.sortOrder as never) ?? 'desc',
          search: req.query.search as string | undefined,
          country: req.query.country as string | undefined,
          merchant: req.query.merchant as string | undefined,
          status: req.query.status as string | undefined,
        }
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
