import { Prisma, PrismaClient, UploadStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface TransactionFilters extends PaginationInput {
  sortBy: 'timestamp' | 'amount' | 'merchant' | 'country' | 'createdAt' | 'transactionId';
  sortOrder: 'asc' | 'desc';
  search?: string;
  startDate?: string;
  endDate?: string;
  country?: string;
  merchant?: string;
  merchantCategory?: string;
  paymentMethod?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  uploadId?: string;
  status?: string;
  ids?: string;
  format?: 'csv' | 'json';
  scope?: 'page' | 'filtered' | 'selected';
}

export class UploadRepository {
  constructor(private db: PrismaClient = prisma) {}

  create(data: Prisma.UploadUncheckedCreateInput) {
    return this.db.upload.create({ data });
  }

  update(id: string, organizationId: string, data: Prisma.UploadUpdateInput) {
    return this.db.upload.update({
      where: { id, organizationId },
      data,
    });
  }

  findById(id: string, organizationId: string) {
    return this.db.upload.findFirst({
      where: { id, organizationId },
    });
  }

  findByHash(organizationId: string, fileHash: string) {
    return this.db.upload.findUnique({
      where: {
        organizationId_fileHash: {
          organizationId,
          fileHash,
        },
      },
    });
  }

  list(organizationId: string, filters: PaginationInput & { status?: UploadStatus }) {
    const where: Prisma.UploadWhereInput = {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
    };

    return this.db.$transaction([
      this.db.upload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.upload.count({ where }),
    ]);
  }

  delete(id: string, organizationId: string) {
    return this.db.upload.delete({
      where: { id, organizationId },
    });
  }
}

export class TransactionRepository {
  constructor(private db: PrismaClient = prisma) {}

  createMany(data: Prisma.TransactionCreateManyInput[]) {
    if (data.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return this.db.transaction.createMany({ data });
  }

  private buildWhere(organizationId: string, filters: Partial<TransactionFilters>) {
    const amount: Prisma.DecimalFilter | undefined =
      filters.minAmount !== undefined || filters.maxAmount !== undefined
        ? {
            ...(filters.minAmount !== undefined ? { gte: new Prisma.Decimal(filters.minAmount) } : {}),
            ...(filters.maxAmount !== undefined ? { lte: new Prisma.Decimal(filters.maxAmount) } : {}),
          }
        : undefined;
    const ids = filters.ids
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    return {
      organizationId,
      ...(filters.uploadId ? { uploadId: filters.uploadId } : {}),
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            timestamp: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(amount ? { amount } : {}),
      ...(filters.country ? { country: { contains: filters.country, mode: 'insensitive' } } : {}),
      ...(filters.merchant
        ? { merchant: { contains: filters.merchant, mode: 'insensitive' } }
        : {}),
      ...(filters.merchantCategory
        ? { merchantCategory: { contains: filters.merchantCategory, mode: 'insensitive' } }
        : {}),
      ...(filters.paymentMethod
        ? { paymentMethod: { contains: filters.paymentMethod, mode: 'insensitive' } }
        : {}),
      ...(filters.currency ? { currency: filters.currency } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { transactionId: { contains: filters.search, mode: 'insensitive' } },
              { merchant: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
              { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
              { customerId: { contains: filters.search, mode: 'insensitive' } },
              { country: { contains: filters.search, mode: 'insensitive' } },
              { city: { contains: filters.search, mode: 'insensitive' } },
              { accountNumber: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    } satisfies Prisma.TransactionWhereInput;
  }

  private includeTraceability() {
    return {
      mlPrediction: true,
      upload: {
        select: {
          id: true,
          filename: true,
          originalFilename: true,
          createdAt: true,
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    } satisfies Prisma.TransactionInclude;
  }

  list(organizationId: string, filters: TransactionFilters) {
    const where = this.buildWhere(organizationId, filters);

    return this.db.$transaction([
      this.db.transaction.findMany({
        where,
        include: this.includeTraceability(),
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.transaction.count({ where }),
    ]);
  }

  listForExport(organizationId: string, filters: TransactionFilters) {
    const where = this.buildWhere(organizationId, {
      ...filters,
      ids: filters.scope === 'selected' ? filters.ids : undefined,
    });
    const args = {
      where,
      include: this.includeTraceability(),
      orderBy: { [filters.sortBy]: filters.sortOrder },
      take: filters.scope === 'page' ? filters.limit : 10000,
    } satisfies Prisma.TransactionFindManyArgs;

    if (filters.scope === 'page') {
      return this.db.transaction.findMany({
        ...args,
        skip: (filters.page - 1) * filters.limit,
      });
    }

    return this.db.transaction.findMany(args);
  }

  findById(organizationId: string, id: string) {
    return this.db.transaction.findFirst({
      where: { id, organizationId },
      include: this.includeTraceability(),
    });
  }

  findRawById(organizationId: string, id: string) {
    return this.db.transaction.findFirst({
      where: { id, organizationId },
    });
  }

  deleteById(id: string) {
    return this.db.transaction.delete({
      where: { id },
      include: this.includeTraceability(),
    });
  }

  deleteMany(organizationId: string, ids: string[]) {
    return this.db.transaction.deleteMany({
      where: {
        organizationId,
        id: { in: ids },
      },
    });
  }

  listByUpload(organizationId: string, uploadId: string, filters: TransactionFilters) {
    const where: Prisma.TransactionWhereInput = {
      ...this.buildWhere(organizationId, filters),
      uploadId,
    };

    return this.db.$transaction([
      this.db.transaction.findMany({
        where,
        include: this.includeTraceability(),
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.transaction.count({ where }),
    ]);
  }

  listAllByUpload(organizationId: string, uploadId: string) {
    return this.db.transaction.findMany({
      where: { organizationId, uploadId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
