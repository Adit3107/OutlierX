import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

export interface DecisionFilters {
  page: number;
  limit: number;
  transactionId?: string;
  riskLevel?: Prisma.EnumRiskLevelFilter['equals'];
  recommendation?: Prisma.EnumDecisionRecommendationFilter['equals'];
  decisionStrategy?: string;
  startDate?: string;
  endDate?: string;
}

export interface DecisionCreateInput {
  organizationId: string;
  transactionId: string;
  ruleExecutionId?: string | null;
  mlPredictionId?: string | null;
  ruleScore: number;
  mlScore: number;
  finalScore: number;
  confidence: number;
  riskLevel: Prisma.DecisionUncheckedCreateInput['riskLevel'];
  decisionStrategy: string;
  decisionVersion: string;
  explanation: Prisma.InputJsonValue;
  recommendation: Prisma.DecisionUncheckedCreateInput['recommendation'];
  processedAt: Date;
}

const ruleExecutionInclude = {
  results: {
    include: {
      rule: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.RuleExecutionInclude;

export class DecisionRepository {
  constructor(private db: PrismaClient = prisma) {}

  list(organizationId: string, filters: DecisionFilters) {
    const where = this.buildWhere(organizationId, filters);
    return this.db.$transaction([
      this.db.decision.findMany({
        where,
        orderBy: { processedAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.decision.count({ where }),
    ]);
  }

  findById(organizationId: string, id: string) {
    return this.db.decision.findFirst({
      where: { id, organizationId },
    });
  }

  findLatestByTransaction(organizationId: string, transactionId: string) {
    return this.db.decision.findFirst({
      where: { organizationId, transactionId },
      orderBy: [{ processedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  historyByTransaction(organizationId: string, transactionId: string, limit = 10) {
    return this.db.decision.findMany({
      where: { organizationId, transactionId },
      orderBy: [{ processedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  findTransaction(organizationId: string, transactionId: string) {
    return this.db.transaction.findFirst({
      where: { id: transactionId, organizationId },
      select: { id: true },
    });
  }

  findLatestInputs(organizationId: string, transactionId: string) {
    return this.db.$transaction(async (tx) => {
      const ruleExecution = await tx.ruleExecution.findFirst({
        where: { organizationId, transactionId },
        include: ruleExecutionInclude,
        orderBy: { createdAt: 'desc' },
      });

      const mlPrediction = await tx.mlPrediction.findFirst({
        where: { organizationId, transactionId },
      });

      const previousDecision = await tx.decision.findFirst({
        where: { organizationId, transactionId },
        orderBy: [{ processedAt: 'desc' }, { createdAt: 'desc' }],
      });

      return { ruleExecution, mlPrediction, previousDecision };
    });
  }

  create(input: DecisionCreateInput) {
    return this.db.decision.create({
      data: input,
    });
  }

  private buildWhere(organizationId: string, filters: DecisionFilters) {
    return {
      organizationId,
      ...(filters.transactionId ? { transactionId: filters.transactionId } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
      ...(filters.recommendation ? { recommendation: filters.recommendation } : {}),
      ...(filters.decisionStrategy ? { decisionStrategy: filters.decisionStrategy } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            processedAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
    } satisfies Prisma.DecisionWhereInput;
  }
}
