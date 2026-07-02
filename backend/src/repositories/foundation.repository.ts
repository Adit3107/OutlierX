import {
  ActivityEntity,
  ApiKeyStatus,
  MembershipStatus,
  Prisma,
  PrismaClient,
  Role,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export class OrganizationRepository {
  constructor(private db: PrismaClient = prisma) {}

  findById(id: string) {
    return this.db.organization.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.db.organization.findUnique({ where: { slug } });
  }

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return this.db.organization.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.db.organization.delete({
      where: { id },
    });
  }

  usageSummary(organizationId: string) {
    return this.db.$transaction([
      this.db.membership.count({ where: { organizationId } }),
      this.db.membership.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.db.upload.count({ where: { organizationId } }),
      this.db.apiKey.count({ where: { organizationId } }),
      this.db.upload.aggregate({ where: { organizationId }, _sum: { fileSize: true } }),
      this.db.transaction.count({ where: { organizationId } }),
      this.db.alert.count({ where: { organizationId, deletedAt: null } }),
    ]);
  }
}

export class MemberRepository {
  constructor(private db: PrismaClient = prisma) {}

  listAll(organizationId: string) {
    return this.db.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  list(
    organizationId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      role?: Role;
      status?: MembershipStatus;
    }
  ) {
    const where: Prisma.MembershipWhereInput = {
      organizationId,
      ...(options?.role ? { role: options.role } : {}),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.search
        ? {
            user: {
              OR: [
                { email: { contains: options.search, mode: 'insensitive' } },
                { firstName: { contains: options.search, mode: 'insensitive' } },
                { lastName: { contains: options.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    return this.db.$transaction([
      this.db.membership.findMany({
        where,
        include: { user: true },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.db.membership.count({ where }),
    ]);
  }

  findById(id: string, organizationId: string) {
    return this.db.membership.findFirst({
      where: { id, organizationId },
      include: { user: true },
    });
  }

  findByUser(organizationId: string, userId: string) {
    return this.db.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  create(data: { organizationId: string; userId: string; role: Role }) {
    return this.db.membership.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
        status: 'ACTIVE',
      },
      include: { user: true },
    });
  }

  update(id: string, data: { role?: Role; status?: MembershipStatus }) {
    return this.db.membership.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  delete(id: string) {
    return this.db.membership.delete({
      where: { id },
    });
  }
}

export class ApiKeyRepository {
  constructor(private db: PrismaClient = prisma) {}

  list(organizationId: string, status?: ApiKeyStatus) {
    return this.db.apiKey.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    organizationId: string;
    createdById: string;
    name: string;
    keyHash: string;
    expiresAt?: Date;
  }) {
    return this.db.apiKey.create({
      data: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        name: data.name,
        keyHash: data.keyHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  findById(id: string, organizationId: string) {
    return this.db.apiKey.findFirst({
      where: { id, organizationId },
    });
  }

  updateStatus(id: string, status: ApiKeyStatus) {
    return this.db.apiKey.update({
      where: { id },
      data: { status },
    });
  }

  update(id: string, data: Prisma.ApiKeyUpdateInput) {
    return this.db.apiKey.update({
      where: { id },
      data,
    });
  }
}

export class ActivityRepository {
  constructor(private db: PrismaClient = prisma) {}

  create(data: Prisma.ActivityLogUncheckedCreateInput) {
    return this.db.activityLog.create({ data });
  }

  list(
    organizationId: string,
    pagination: {
      page: number;
      limit: number;
      search?: string;
      action?: string;
      entity?: ActivityEntity;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: Prisma.ActivityLogWhereInput = {
      organizationId,
      ...(pagination.action ? { action: { contains: pagination.action, mode: 'insensitive' } } : {}),
      ...(pagination.entity ? { entity: pagination.entity } : {}),
      ...(pagination.userId ? { userId: pagination.userId } : {}),
      ...(pagination.startDate || pagination.endDate
        ? {
            createdAt: {
              ...(pagination.startDate ? { gte: new Date(pagination.startDate) } : {}),
              ...(pagination.endDate ? { lte: new Date(pagination.endDate) } : {}),
            },
          }
        : {}),
      ...(pagination.search
        ? {
            OR: [
              { action: { contains: pagination.search, mode: 'insensitive' } },
              { entityId: { contains: pagination.search, mode: 'insensitive' } },
              { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    return this.db.$transaction([
      this.db.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.activityLog.count({ where }),
    ]);
  }
}
