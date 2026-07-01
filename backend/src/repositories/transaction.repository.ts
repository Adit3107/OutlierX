import { Prisma, PrismaClient, UploadStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface TransactionFilters extends PaginationInput {
  sortBy: 'timestamp' | 'amount' | 'merchant' | 'country' | 'transactionId';
  sortOrder: 'asc' | 'desc';
  search?: string;
  country?: string;
  merchant?: string;
  status?: string;
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

  listByUpload(organizationId: string, uploadId: string, filters: TransactionFilters) {
    const where: Prisma.TransactionWhereInput = {
      organizationId,
      uploadId,
      ...(filters.country ? { country: { contains: filters.country, mode: 'insensitive' } } : {}),
      ...(filters.merchant
        ? { merchant: { contains: filters.merchant, mode: 'insensitive' } }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { transactionId: { contains: filters.search, mode: 'insensitive' } },
              { merchant: { contains: filters.search, mode: 'insensitive' } },
              { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
              { customerId: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.db.$transaction([
      this.db.transaction.findMany({
        where,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.transaction.count({ where }),
    ]);
  }
}
