import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Prisma, UploadStatus } from '@prisma/client';
import { PaginatedResponse, Transaction, Upload, UploadRowError, UploadSummary } from '@anomaly/shared';
import {
  TransactionFilters,
  TransactionRepository,
  UploadRepository,
} from '../repositories/transaction.repository.js';
import { ActivityService } from './foundation.service.js';
import { CsvParserService } from './csv-ingestion.service.js';
import { StorageProvider } from './storage.service.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';
import { RuleService } from '../modules/rules/services/rule.service.js';
import { PredictionService, toPredictionDto } from './prediction.service.js';

function toUpload(upload: Awaited<ReturnType<UploadRepository['create']>>): Upload {
  return {
    id: upload.id,
    organizationId: upload.organizationId,
    uploadedById: upload.uploadedById,
    filename: upload.filename,
    originalFilename: upload.originalFilename,
    storageKey: upload.storageKey,
    storageUrl: upload.storageUrl,
    mimeType: upload.mimeType,
    fileSize: upload.fileSize,
    fileHash: upload.fileHash,
    status: upload.status,
    totalRows: upload.totalRows,
    processedRows: upload.processedRows,
    failedRows: upload.failedRows,
    processingTime: upload.processingTime,
    errorSummary: (upload.errorSummary as UploadRowError[] | null) ?? null,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}

function toTransaction(
  transaction: Awaited<ReturnType<TransactionRepository['listByUpload']>>[0][number]
): Transaction {
  return {
    id: transaction.id,
    organizationId: transaction.organizationId,
    uploadId: transaction.uploadId,
    transactionId: transaction.transactionId,
    timestamp: transaction.timestamp,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    merchant: transaction.merchant,
    merchantCategory: transaction.merchantCategory,
    accountNumber: transaction.accountNumber,
    country: transaction.country,
    city: transaction.city,
    paymentMethod: transaction.paymentMethod,
    description: transaction.description,
    referenceNumber: transaction.referenceNumber,
    customerId: transaction.customerId,
    status: 'IMPORTED',
    metadata: (transaction.metadata as Record<string, unknown> | null) ?? null,
    mlPrediction: toPredictionDto(transaction.mlPrediction),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    upload: transaction.upload
      ? {
          id: transaction.upload.id,
          filename: transaction.upload.filename,
          originalFilename: transaction.upload.originalFilename,
          createdAt: transaction.upload.createdAt,
          uploadedBy: transaction.upload.uploadedBy,
          organization: transaction.upload.organization,
        }
      : undefined,
  };
}

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function transactionsToCsv(transactions: Transaction[]) {
  const headers = [
    'id',
    'transactionId',
    'timestamp',
    'merchant',
    'merchantCategory',
    'country',
    'city',
    'paymentMethod',
    'amount',
    'currency',
    'status',
    'description',
    'referenceNumber',
    'customerId',
    'accountNumber',
    'uploadFilename',
    'uploadTime',
    'uploadedBy',
    'organization',
    'sourceRow',
  ];

  const rows = transactions.map((transaction) => {
    const sourceRow = transaction.metadata?.sourceRow;
    return [
      transaction.id,
      transaction.transactionId,
      transaction.timestamp,
      transaction.merchant,
      transaction.merchantCategory,
      transaction.country,
      transaction.city,
      transaction.paymentMethod,
      transaction.amount,
      transaction.currency,
      transaction.status,
      transaction.description,
      transaction.referenceNumber,
      transaction.customerId,
      transaction.accountNumber,
      transaction.upload?.originalFilename,
      transaction.upload?.createdAt,
      transaction.upload?.uploadedBy?.email,
      transaction.upload?.organization?.name,
      sourceRow,
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
}

async function hashFile(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function sanitizeStoredFilename(originalFilename: string, fileHash: string) {
  const base = path
    .basename(originalFilename, path.extname(originalFilename))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${Date.now()}-${fileHash.slice(0, 12)}-${base || 'transactions'}.csv`;
}

export class UploadService {
  constructor(
    private uploadRepository: UploadRepository,
    private parserService: CsvParserService,
    private storageProvider: StorageProvider,
    private activityService: ActivityService,
    private transactionRepository: TransactionRepository,
    private ruleService?: RuleService,
    private predictionService?: PredictionService
  ) {}

  async uploadCsv(input: {
    organizationId: string;
    userId: string;
    file?: Express.Multer.File;
  }): Promise<{ upload: Upload; summary: UploadSummary }> {
    if (!input.file) {
      throw new BadRequestError('CSV file is required');
    }

    const startedAt = Date.now();
    let uploadRecord: Awaited<ReturnType<UploadRepository['create']>> | null = null;

    try {
      const fileHash = await hashFile(input.file.path);
      const duplicate = await this.uploadRepository.findByHash(input.organizationId, fileHash);
      if (duplicate) {
        throw new ConflictError('An identical upload already exists for this organization', {
          uploadId: duplicate.id,
        });
      }

      const storedFilename = sanitizeStoredFilename(input.file.originalname, fileHash);
      const storedFile = await this.storageProvider.upload({
        organizationId: input.organizationId,
        filename: storedFilename,
        sourcePath: input.file.path,
      });

      uploadRecord = await this.uploadRepository.create({
        organizationId: input.organizationId,
        uploadedById: input.userId,
        filename: storedFilename,
        originalFilename: input.file.originalname,
        storageKey: storedFile.key,
        storageUrl: storedFile.url,
        mimeType: input.file.mimetype,
        fileSize: input.file.size,
        fileHash,
        status: 'UPLOADED',
      });

      await this.activityService.log({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'upload.started',
        entity: 'UPLOAD',
        entityId: uploadRecord.id,
        metadata: {
          originalFilename: input.file.originalname,
          fileSize: input.file.size,
        },
      });

      uploadRecord = await this.uploadRepository.update(uploadRecord.id, input.organizationId, {
        status: 'PARSING',
      });

      const summary = await this.parserService.parseFile({
        filePath: input.file.path,
        organizationId: input.organizationId,
        uploadId: uploadRecord.id,
      });

      uploadRecord = await this.uploadRepository.update(uploadRecord.id, input.organizationId, {
        status: 'COMPLETED',
        totalRows: summary.totalRows,
        processedRows: summary.processedRows,
        failedRows: summary.failedRows,
        processingTime: Date.now() - startedAt,
        errorSummary: summary.errors as unknown as Prisma.InputJsonValue,
      });

      await this.activityService.log({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'upload.completed',
        entity: 'UPLOAD',
        entityId: uploadRecord.id,
        metadata: {
          totalRows: uploadRecord.totalRows,
          processedRows: uploadRecord.processedRows,
          failedRows: uploadRecord.failedRows,
        },
      });

      if (this.ruleService && uploadRecord.processedRows > 0) {
        try {
          const transactions = await this.transactionRepository.listAllByUpload(
            input.organizationId,
            uploadRecord.id
          );
          if (transactions.length > 0) {
            await this.ruleService.evaluateTransactions(input.organizationId, transactions, 'UPLOAD');
            await this.activityService.log({
              organizationId: input.organizationId,
              userId: input.userId,
              action: 'rule.executed',
              entity: 'RULE',
              entityId: uploadRecord.id,
              metadata: { source: 'UPLOAD', count: transactions.length },
            });
          }
        } catch (ruleError) {
          await this.activityService.log({
            organizationId: input.organizationId,
            userId: input.userId,
            action: 'rule.execution_failed',
            entity: 'RULE',
            entityId: uploadRecord.id,
            metadata: {
              source: 'UPLOAD',
              reason: ruleError instanceof Error ? ruleError.message : 'Rule evaluation failed',
            },
          });
        }
      }

      if (this.predictionService && uploadRecord.processedRows > 0) {
        try {
          const transactions = await this.transactionRepository.listAllByUpload(
            input.organizationId,
            uploadRecord.id
          );
          const result = await this.predictionService.processTransactionsBestEffort(
            input.organizationId,
            transactions
          );
          await this.activityService.log({
            organizationId: input.organizationId,
            userId: input.userId,
            action: 'ml.predicted',
            entity: 'TRANSACTION',
            entityId: uploadRecord.id,
            metadata: { processed: result.processed, failed: result.failed },
          });
        } catch (predictionError) {
          await this.activityService.log({
            organizationId: input.organizationId,
            userId: input.userId,
            action: 'ml.prediction_failed',
            entity: 'TRANSACTION',
            entityId: uploadRecord.id,
            metadata: {
              reason:
                predictionError instanceof Error
                  ? predictionError.message
                  : 'ML prediction failed',
            },
          });
        }
      }

      return {
        upload: toUpload(uploadRecord),
        summary: {
          totalRows: uploadRecord.totalRows,
          processedRows: uploadRecord.processedRows,
          failedRows: uploadRecord.failedRows,
          processingTime: uploadRecord.processingTime ?? 0,
          errors: summary.errors,
        },
      };
    } catch (error) {
      if (uploadRecord) {
        const failedSummary: UploadRowError[] = [
          {
            row: 0,
            errors: [error instanceof Error ? error.message : 'Upload processing failed'],
          },
        ];
        uploadRecord = await this.uploadRepository.update(uploadRecord.id, input.organizationId, {
          status: 'FAILED',
          processingTime: Date.now() - startedAt,
          errorSummary: failedSummary as unknown as Prisma.InputJsonValue,
        });

        await this.activityService.log({
          organizationId: input.organizationId,
          userId: input.userId,
          action: 'upload.failed',
          entity: 'UPLOAD',
          entityId: uploadRecord.id,
          metadata: {
            reason: failedSummary[0].errors[0],
          },
        });

        return {
          upload: toUpload(uploadRecord),
          summary: {
            totalRows: uploadRecord.totalRows,
            processedRows: uploadRecord.processedRows,
            failedRows: uploadRecord.failedRows,
            processingTime: uploadRecord.processingTime ?? 0,
            errors: failedSummary,
          },
        };
      }

      throw error;
    } finally {
      await fs.promises.rm(input.file.path, { force: true });
    }
  }

  async listUploads(
    organizationId: string,
    filters: { page: number; limit: number; status?: UploadStatus }
  ): Promise<PaginatedResponse<Upload>> {
    const [items, total] = await this.uploadRepository.list(organizationId, filters);
    return {
      items: items.map(toUpload),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getUpload(organizationId: string, uploadId: string): Promise<Upload> {
    const upload = await this.uploadRepository.findById(uploadId, organizationId);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }

    return toUpload(upload);
  }

  async deleteUpload(organizationId: string, userId: string, uploadId: string) {
    const upload = await this.uploadRepository.findById(uploadId, organizationId);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }

    await this.storageProvider.delete(upload.storageKey);
    const deleted = await this.uploadRepository.delete(upload.id, organizationId);

    await this.activityService.log({
      organizationId,
      userId,
      action: 'upload.deleted',
      entity: 'UPLOAD',
      entityId: upload.id,
      metadata: {
        originalFilename: upload.originalFilename,
      },
    });

    return toUpload(deleted);
  }
}

export class TransactionService {
  constructor(
    private transactionRepository: TransactionRepository,
    private uploadRepository: UploadRepository,
    private activityService: ActivityService
  ) {}

  async listTransactions(
    organizationId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> {
    const [items, total] = await this.transactionRepository.list(organizationId, filters);

    return {
      items: items.map(toTransaction),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getTransaction(organizationId: string, userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(organizationId, id);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    await this.activityService.log({
      organizationId,
      userId,
      action: 'transaction.viewed',
      entity: 'TRANSACTION',
      entityId: transaction.id,
      metadata: { transactionId: transaction.transactionId },
    });

    return toTransaction(transaction);
  }

  async exportTransactions(
    organizationId: string,
    userId: string,
    filters: TransactionFilters
  ): Promise<{ body: string; contentType: string; filename: string }> {
    const transactions = (await this.transactionRepository.listForExport(organizationId, filters)).map(
      toTransaction
    );
    const format = filters.format ?? 'csv';

    await this.activityService.log({
      organizationId,
      userId,
      action: 'transactions.exported',
      entity: 'TRANSACTION',
      metadata: {
        count: transactions.length,
        format,
        scope: filters.scope ?? 'filtered',
      },
    });

    if (format === 'json') {
      return {
        body: JSON.stringify(transactions, null, 2),
        contentType: 'application/json',
        filename: 'transactions.json',
      };
    }

    return {
      body: transactionsToCsv(transactions),
      contentType: 'text/csv',
      filename: 'transactions.csv',
    };
  }

  async deleteTransaction(organizationId: string, userId: string, id: string) {
    const transaction = await this.transactionRepository.findById(organizationId, id);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    const deleted = await this.transactionRepository.deleteById(transaction.id);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'transaction.deleted',
      entity: 'TRANSACTION',
      entityId: deleted.id,
      metadata: { transactionId: deleted.transactionId },
    });

    return toTransaction(deleted);
  }

  async deleteTransactions(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) {
      throw new BadRequestError('At least one transaction id is required');
    }

    const result = await this.transactionRepository.deleteMany(organizationId, ids);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'transactions.deleted',
      entity: 'TRANSACTION',
      metadata: { count: result.count },
    });

    return { count: result.count };
  }

  async logBulkAction(
    organizationId: string,
    userId: string,
    payload: { ids: string[]; action: 'TAG' | 'MARK_REVIEWED' }
  ) {
    await this.activityService.log({
      organizationId,
      userId,
      action: `transactions.${payload.action.toLowerCase()}.placeholder`,
      entity: 'TRANSACTION',
      metadata: {
        count: payload.ids.length,
        ids: payload.ids,
      },
    });

    return {
      action: payload.action,
      count: payload.ids.length,
      status: 'PLACEHOLDER',
    };
  }

  async listUploadTransactions(
    organizationId: string,
    uploadId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> {
    const upload = await this.uploadRepository.findById(uploadId, organizationId);
    if (!upload) {
      throw new NotFoundError('Upload not found');
    }

    const [items, total] = await this.transactionRepository.listByUpload(
      organizationId,
      uploadId,
      filters
    );

    return {
      items: items.map(toTransaction),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }
}
