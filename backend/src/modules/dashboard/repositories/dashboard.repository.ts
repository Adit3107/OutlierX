import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

export class DashboardRepository {
  constructor(private db: PrismaClient = prisma) {}

  countTransactions(organizationId: string) {
    return this.db.transaction.count({ where: { organizationId } });
  }

  countUploads(organizationId: string) {
    return this.db.upload.count({ where: { organizationId } });
  }

  countOrganizations() {
    return this.db.organization.count();
  }

  countActiveRules(organizationId: string) {
    return this.db.rule.count({ where: { organizationId, enabled: true } });
  }

  latestUpload(organizationId: string) {
    return this.db.upload.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  latestModelVersion(organizationId: string) {
    return this.db.mlPrediction.findFirst({
      where: { organizationId },
      orderBy: { processedAt: 'desc' },
      select: { modelVersion: true },
    });
  }

  decisionAverages(organizationId: string) {
    return this.db.decision.aggregate({
      where: { organizationId },
      _avg: { finalScore: true, confidence: true },
      _count: { _all: true },
    });
  }

  mlAverages(organizationId: string) {
    return this.db.mlPrediction.aggregate({
      where: { organizationId },
      _avg: { confidence: true, processingTime: true },
    });
  }

  countDetectedDecisions(organizationId: string) {
    return this.db.decision.count({
      where: {
        organizationId,
        riskLevel: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
      },
    });
  }

  alertCounts(organizationId: string) {
    return this.db.alert.groupBy({
      by: ['severity'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
  }

  riskDistribution(organizationId: string) {
    return this.db.decision.groupBy({
      by: ['riskLevel'],
      where: { organizationId },
      _count: { _all: true },
    });
  }

  transactionsByCountry(organizationId: string, take = 8) {
    return this.db.transaction.groupBy({
      by: ['country'],
      where: { organizationId, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take,
    });
  }

  transactionsByMerchant(organizationId: string, take = 8) {
    return this.db.transaction.groupBy({
      by: ['merchant'],
      where: { organizationId },
      _count: { _all: true },
      orderBy: { _count: { merchant: 'desc' } },
      take,
    });
  }

  paymentMethodDistribution(organizationId: string) {
    return this.db.transaction.groupBy({
      by: ['paymentMethod'],
      where: { organizationId, paymentMethod: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { paymentMethod: 'desc' } },
    });
  }

  currencyDistribution(organizationId: string) {
    return this.db.transaction.groupBy({
      by: ['currency'],
      where: { organizationId },
      _count: { _all: true },
      orderBy: { _count: { currency: 'desc' } },
    });
  }

  topRiskyMerchants(organizationId: string, take = 8) {
    return this.db.decision.groupBy({
      by: ['transactionId'],
      where: { organizationId },
      _avg: { finalScore: true },
      _count: { _all: true },
      orderBy: { _avg: { finalScore: 'desc' } },
      take: take * 3,
    });
  }

  topRiskyCountries(organizationId: string, take = 8) {
    return this.db.$queryRaw<Array<{ name: string | null; value: number }>>`
      SELECT t."country" AS name, AVG(d."finalScore")::float AS value
      FROM "Decision" d
      JOIN "Transaction" t ON t."id" = d."transactionId"
      WHERE d."organizationId" = ${organizationId} AND t."country" IS NOT NULL
      GROUP BY t."country"
      ORDER BY value DESC
      LIMIT ${take}
    `;
  }

  transactionMerchantsByIds(organizationId: string, ids: string[]) {
    return this.db.transaction.findMany({
      where: { organizationId, id: { in: ids } },
      select: { id: true, merchant: true },
    });
  }

  ruleTriggerFrequency(organizationId: string, take = 10) {
    return this.db.ruleResult.groupBy({
      by: ['ruleId'],
      where: {
        matched: true,
        execution: { organizationId },
      },
      _count: { _all: true },
      orderBy: { _count: { ruleId: 'desc' } },
      take,
    });
  }

  rulesByIds(organizationId: string, ids: string[]) {
    return this.db.rule.findMany({
      where: { organizationId, id: { in: ids } },
      select: { id: true, name: true, severity: true },
    });
  }

  modelPredictionDistribution(organizationId: string) {
    return this.db.mlPrediction.groupBy({
      by: ['mlPrediction'],
      where: { organizationId },
      _count: { _all: true },
      orderBy: { _count: { mlPrediction: 'desc' } },
    });
  }

  riskTrend(organizationId: string, days = 14) {
    return this.db.$queryRaw<Array<{ date: Date; value: number }>>`
      SELECT DATE_TRUNC('day', "processedAt") AS date, AVG("finalScore")::float AS value
      FROM "Decision"
      WHERE "organizationId" = ${organizationId}
        AND "processedAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  dailyTransactionVolume(organizationId: string, days = 14) {
    return this.db.$queryRaw<Array<{ date: Date; value: bigint }>>`
      SELECT DATE_TRUNC('day', "timestamp") AS date, COUNT(*) AS value
      FROM "Transaction"
      WHERE "organizationId" = ${organizationId}
        AND "timestamp" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  recentUploadTrend(organizationId: string, days = 14) {
    return this.db.$queryRaw<Array<{ date: Date; value: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS value
      FROM "Upload"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  recentAlertTrend(organizationId: string, days = 14) {
    return this.db.$queryRaw<Array<{ date: Date; value: bigint }>>`
      SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS value
      FROM "Alert"
      WHERE "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
        AND "createdAt" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  hourlyTransactionHeatmap(organizationId: string, days = 7) {
    return this.db.$queryRaw<Array<{ day: string; hour: number; value: bigint }>>`
      SELECT TO_CHAR("timestamp", 'Dy') AS day,
             EXTRACT(HOUR FROM "timestamp")::int AS hour,
             COUNT(*) AS value
      FROM "Transaction"
      WHERE "organizationId" = ${organizationId}
        AND "timestamp" >= NOW() - (${days} * INTERVAL '1 day')
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;
  }

  recentUploads(organizationId: string, limit = 6) {
    return this.db.upload.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: limit });
  }

  recentDecisions(organizationId: string, limit = 6) {
    return this.db.decision.findMany({ where: { organizationId }, orderBy: { processedAt: 'desc' }, take: limit });
  }

  recentRuleExecutions(organizationId: string, limit = 6) {
    return this.db.ruleExecution.findMany({
      where: { organizationId },
      include: {
        transaction: { select: { id: true, transactionId: true, merchant: true, amount: true, currency: true } },
        results: { include: { rule: true }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  recentOrganizations(limit = 6) {
    return this.db.organization.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }

  recentLogins(organizationId: string, limit = 6) {
    return this.db.activityLog.findMany({
      where: { organizationId, action: { contains: 'login', mode: 'insensitive' } },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
