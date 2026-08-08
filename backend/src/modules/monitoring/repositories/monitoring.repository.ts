import { PrismaClient, Prisma } from '@prisma/client';

export class MonitoringRepository {
  constructor(private prisma: PrismaClient) {}

  async createSnapshot(data: Prisma.MLMonitoringSnapshotCreateInput) {
    return this.prisma.mLMonitoringSnapshot.create({
      data,
      include: {
        featureDriftMetrics: true,
        predictionMetrics: true,
        dataQualityMetrics: true,
      },
    });
  }

  async getLatestSnapshot(organizationId: string, modelId?: string) {
    return this.prisma.mLMonitoringSnapshot.findFirst({
      where: {
        organizationId,
        ...(modelId ? { modelId } : {}),
      },
      orderBy: { timestamp: 'desc' },
      include: {
        featureDriftMetrics: true,
        predictionMetrics: true,
        dataQualityMetrics: true,
      },
    });
  }

  async listSnapshots(organizationId: string, limit = 50) {
    return this.prisma.mLMonitoringSnapshot.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        featureDriftMetrics: true,
        predictionMetrics: true,
        dataQualityMetrics: true,
      },
    });
  }

  async createFeatureDriftMetrics(metrics: Prisma.FeatureDriftMetricCreateManyInput[]) {
    if (metrics.length === 0) return [];
    return this.prisma.featureDriftMetric.createMany({ data: metrics });
  }

  async listFeatureDrift(organizationId: string, limit = 50) {
    return this.prisma.featureDriftMetric.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async createPredictionDriftMetrics(metrics: Prisma.PredictionDriftMetricCreateManyInput[]) {
    if (metrics.length === 0) return [];
    return this.prisma.predictionDriftMetric.createMany({ data: metrics });
  }

  async listPredictionDrift(organizationId: string, limit = 50) {
    return this.prisma.predictionDriftMetric.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async createDataQualityMetric(data: Prisma.DataQualityMetricCreateInput) {
    return this.prisma.dataQualityMetric.create({ data });
  }

  async getLatestDataQuality(organizationId: string) {
    return this.prisma.dataQualityMetric.findFirst({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createHealthLog(data: Prisma.ModelHealthLogCreateInput) {
    return this.prisma.modelHealthLog.create({ data });
  }

  async listHealthLogs(organizationId: string, limit = 50) {
    return this.prisma.modelHealthLog.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getTransactionAggregates(organizationId: string, sinceDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        amount: true,
        country: true,
        currency: true,
        merchantCategory: true,
        createdAt: true,
      },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    });

    const predictions = await this.prisma.mlPrediction.findMany({
      where: {
        transaction: { organizationId },
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        rawScore: true,
        mlScore: true,
        mlPrediction: true,
        confidence: true,
        processingTime: true,
        createdAt: true,
      },
      take: 2000,
      orderBy: { createdAt: 'desc' },
    });

    return { transactions, predictions };
  }
}
