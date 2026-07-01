import { ApiKeyStatus, MembershipStatus, Prisma, PrismaClient, Role } from '@prisma/client';
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
}

export class MemberRepository {
  constructor(private db: PrismaClient = prisma) {}

  list(organizationId: string) {
    return this.db.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
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
}

export class ActivityRepository {
  constructor(private db: PrismaClient = prisma) {}

  create(data: Prisma.ActivityLogUncheckedCreateInput) {
    return this.db.activityLog.create({ data });
  }

  list(organizationId: string, pagination: { page: number; limit: number }) {
    return this.db.$transaction([
      this.db.activityLog.findMany({
        where: { organizationId },
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
      this.db.activityLog.count({ where: { organizationId } }),
    ]);
  }
}
