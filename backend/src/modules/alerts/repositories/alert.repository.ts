import { AlertStatus, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

export interface AlertFilters {
  page: number;
  limit: number;
  search?: string;
  severity?: Prisma.EnumAlertSeverityFilter['equals'];
  status?: AlertStatus;
  isRead?: boolean;
  recommendation?: Prisma.EnumDecisionRecommendationNullableFilter['equals'];
  assigned?: 'assigned' | 'unassigned';
  startDate?: string;
  endDate?: string;
}

export interface AlertCreateInput {
  organizationId: string;
  userId?: string | null;
  decisionId?: string | null;
  transactionId?: string | null;
  severity: Prisma.AlertUncheckedCreateInput['severity'];
  title: string;
  description?: string | null;
  riskScore?: number | null;
  confidence?: number | null;
  triggeredRules?: Prisma.InputJsonValue;
  recommendation?: Prisma.AlertUncheckedCreateInput['recommendation'];
  createdAt?: Date;
}

const alertInclude = {
  transaction: true,
  decision: true,
  assignedAnalyst: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
} satisfies Prisma.AlertInclude;

export class AlertRepository {
  constructor(private db: PrismaClient = prisma) {}

  list(organizationId: string, filters: AlertFilters) {
    const where = this.buildWhere(organizationId, filters);
    return this.db.$transaction([
      this.db.alert.findMany({
        where,
        include: alertInclude,
        orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.alert.count({ where }),
    ]);
  }

  findById(organizationId: string, id: string) {
    return this.db.alert.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: alertInclude,
    });
  }

  findByDecision(decisionId: string) {
    return this.db.alert.findUnique({
      where: { decisionId },
      include: alertInclude,
    });
  }

  create(input: AlertCreateInput) {
    return this.db.alert.create({
      data: input,
      include: alertInclude,
    });
  }

  update(organizationId: string, id: string, data: Prisma.AlertUpdateInput) {
    return this.db.alert.update({
      where: { id, organizationId },
      data,
      include: alertInclude,
    });
  }

  bulkUpdate(organizationId: string, ids: string[], data: Prisma.AlertUpdateManyMutationInput) {
    return this.db.alert.updateMany({
      where: { organizationId, id: { in: ids }, deletedAt: null },
      data,
    });
  }

  countsBySeverity(organizationId: string) {
    return this.db.alert.groupBy({
      by: ['severity'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
  }

  recent(organizationId: string, limit = 8) {
    return this.db.alert.findMany({
      where: { organizationId, deletedAt: null },
      include: alertInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private buildWhere(organizationId: string, filters: AlertFilters) {
    return {
      organizationId,
      deletedAt: null,
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.isRead !== undefined ? { isRead: filters.isRead } : {}),
      ...(filters.recommendation ? { recommendation: filters.recommendation } : {}),
      ...(filters.assigned === 'assigned' ? { assignedAnalystId: { not: null } } : {}),
      ...(filters.assigned === 'unassigned' ? { assignedAnalystId: null } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
              { recommendation: { equals: filters.search as never } },
              { transaction: { transactionId: { contains: filters.search, mode: 'insensitive' } } },
              { transaction: { merchant: { contains: filters.search, mode: 'insensitive' } } },
              { assignedAnalyst: { email: { contains: filters.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    } satisfies Prisma.AlertWhereInput;
  }
}
