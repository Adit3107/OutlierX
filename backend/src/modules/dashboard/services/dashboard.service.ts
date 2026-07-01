import type { DashboardActivity, DashboardCharts, DashboardSummary, RuleExecution, Upload } from '@anomaly/shared';
import { ActivityService } from '../../../services/foundation.service.js';
import { toDecisionDto } from '../../decision-engine/dto/decision.dto.js';
import { toAlertDto } from '../../alerts/dto/alert.dto.js';
import { AlertRepository } from '../../alerts/repositories/alert.repository.js';
import { CacheProvider, NoopCacheProvider } from '../cache/cache-provider.js';
import { DashboardRepository } from '../repositories/dashboard.repository.js';
import { ChartBuilder } from './chart-builder.js';
import { MetricsCalculator } from './metrics-calculator.js';

function toUpload(upload: any): Upload {
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
    errorSummary: upload.errorSummary,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}

function toRuleExecution(execution: any): RuleExecution {
  return {
    id: execution.id,
    organizationId: execution.organizationId,
    transactionId: execution.transactionId,
    source: execution.source,
    finalScore: execution.finalScore,
    riskLevel: execution.riskLevel,
    executionTimeMs: execution.executionTimeMs,
    triggeredCount: execution.triggeredCount,
    createdAt: execution.createdAt,
    transaction: execution.transaction
      ? {
          ...execution.transaction,
          amount: Number(execution.transaction.amount),
        }
      : null,
    results: execution.results?.map((result: any) => ({
      id: result.id,
      ruleId: result.ruleId,
      ruleName: result.rule.name,
      category: result.rule.category,
      severity: result.rule.severity,
      matched: result.matched,
      score: result.score,
      explanation: result.explanation,
    })),
  };
}

function toActivityLog(log: any) {
  return {
    ...log,
    metadata:
      log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
        ? log.metadata
        : null,
  };
}

export class DashboardService {
  constructor(
    private dashboardRepository: DashboardRepository,
    private alertRepository: AlertRepository,
    private activityService: ActivityService,
    private metricsCalculator = new MetricsCalculator(),
    private chartBuilder = new ChartBuilder(),
    private cache: CacheProvider = new NoopCacheProvider()
  ) {}

  async getSummary(organizationId: string, userId: string): Promise<DashboardSummary> {
    const cached = await this.cache.get<DashboardSummary>(`dashboard:${organizationId}:summary`);
    if (cached) {
      return cached;
    }

    const [
      totalTransactions,
      totalUploads,
      totalOrganizations,
      alertCounts,
      decisionAverages,
      mlAverages,
      detectedDecisionCount,
      activeRules,
      modelVersion,
      latestUpload,
    ] = await Promise.all([
      this.dashboardRepository.countTransactions(organizationId),
      this.dashboardRepository.countUploads(organizationId),
      this.dashboardRepository.countOrganizations(),
      this.dashboardRepository.alertCounts(organizationId),
      this.dashboardRepository.decisionAverages(organizationId),
      this.dashboardRepository.mlAverages(organizationId),
      this.dashboardRepository.countDetectedDecisions(organizationId),
      this.dashboardRepository.countActiveRules(organizationId),
      this.dashboardRepository.latestModelVersion(organizationId),
      this.dashboardRepository.latestUpload(organizationId),
    ]);

    const summary = this.metricsCalculator.summary({
      totalTransactions,
      totalUploads,
      totalOrganizations,
      alertCounts,
      averageRiskScore: decisionAverages._avg.finalScore,
      averageMlConfidence: mlAverages._avg.confidence,
      averageProcessingTime: mlAverages._avg.processingTime,
      decisionCount: decisionAverages._count._all,
      detectedDecisionCount,
      activeRules,
      modelVersion: modelVersion?.modelVersion,
      latestUpload: latestUpload ? toUpload(latestUpload) : null,
    });

    await this.cache.set(`dashboard:${organizationId}:summary`, summary, 30);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'dashboard.accessed',
      entity: 'SYSTEM',
    });

    return summary;
  }

  async getCharts(organizationId: string): Promise<DashboardCharts> {
    const riskyTransactions = await this.dashboardRepository.topRiskyMerchants(organizationId);
    const transactionIds = riskyTransactions.map((item) => item.transactionId);
    const merchants = await this.dashboardRepository.transactionMerchantsByIds(organizationId, transactionIds);
    const merchantById = new Map(merchants.map((merchant) => [merchant.id, merchant.merchant]));
    const riskyMerchants = riskyTransactions.reduce<Record<string, { total: number; count: number }>>((acc, item) => {
      const merchant = merchantById.get(item.transactionId) ?? 'Unknown';
      acc[merchant] = acc[merchant] ?? { total: 0, count: 0 };
      acc[merchant].total += item._avg.finalScore ?? 0;
      acc[merchant].count += 1;
      return acc;
    }, {});

    const ruleFrequency = await this.dashboardRepository.ruleTriggerFrequency(organizationId);
    const rules = await this.dashboardRepository.rulesByIds(organizationId, ruleFrequency.map((item) => item.ruleId));
    const ruleById = new Map(rules.map((rule) => [rule.id, rule]));

    const [
      riskDistribution,
      riskTrend,
      dailyTransactionVolume,
      transactionsByCountry,
      transactionsByMerchant,
      paymentMethodDistribution,
      currencyDistribution,
      topRiskyCountries,
      hourlyTransactionHeatmap,
      modelPredictionDistribution,
      recentUploadTrend,
      recentAlertTrend,
    ] = await Promise.all([
      this.dashboardRepository.riskDistribution(organizationId),
      this.dashboardRepository.riskTrend(organizationId),
      this.dashboardRepository.dailyTransactionVolume(organizationId),
      this.dashboardRepository.transactionsByCountry(organizationId),
      this.dashboardRepository.transactionsByMerchant(organizationId),
      this.dashboardRepository.paymentMethodDistribution(organizationId),
      this.dashboardRepository.currencyDistribution(organizationId),
      this.dashboardRepository.topRiskyCountries(organizationId),
      this.dashboardRepository.hourlyTransactionHeatmap(organizationId),
      this.dashboardRepository.modelPredictionDistribution(organizationId),
      this.dashboardRepository.recentUploadTrend(organizationId),
      this.dashboardRepository.recentAlertTrend(organizationId),
    ]);

    return this.chartBuilder.build({
      riskDistribution,
      riskTrend,
      dailyTransactionVolume,
      transactionsByCountry,
      transactionsByMerchant,
      paymentMethodDistribution,
      currencyDistribution,
      topRiskyMerchants: Object.entries(riskyMerchants)
        .map(([name, value]) => ({ name, value: Math.round((value.total / value.count) * 100) / 100 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      topRiskyCountries,
      hourlyTransactionHeatmap,
      ruleTriggerFrequency: ruleFrequency.map((item) => {
        const rule = ruleById.get(item.ruleId);
        return {
          name: rule?.name ?? item.ruleId,
          value: item._count._all,
          severity: rule?.severity,
        };
      }),
      modelPredictionDistribution,
      recentUploadTrend,
      recentAlertTrend,
    });
  }

  async getActivity(organizationId: string): Promise<DashboardActivity> {
    const [uploads, decisions, alerts, ruleExecutions, organizations, logins] = await Promise.all([
      this.dashboardRepository.recentUploads(organizationId),
      this.dashboardRepository.recentDecisions(organizationId),
      this.alertRepository.recent(organizationId),
      this.dashboardRepository.recentRuleExecutions(organizationId),
      this.dashboardRepository.recentOrganizations(),
      this.dashboardRepository.recentLogins(organizationId),
    ]);

    return {
      recentUploads: uploads.map(toUpload),
      recentDecisions: decisions.map((decision) => toDecisionDto(decision)!),
      recentAlerts: alerts.map(toAlertDto),
      recentRuleExecutions: ruleExecutions.map(toRuleExecution),
      recentOrganizations: organizations,
      recentLogins: logins.map(toActivityLog),
    };
  }
}
