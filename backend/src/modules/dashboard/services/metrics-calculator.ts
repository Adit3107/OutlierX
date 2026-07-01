import type { AlertSeverity, DashboardSummary, Upload } from '@anomaly/shared';

const severities: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export class MetricsCalculator {
  summary(input: {
    totalTransactions: number;
    totalUploads: number;
    totalOrganizations: number;
    alertCounts: Array<{ severity: AlertSeverity; _count: { _all: number } }>;
    averageRiskScore?: number | null;
    averageMlConfidence?: number | null;
    averageProcessingTime?: number | null;
    decisionCount: number;
    detectedDecisionCount: number;
    activeRules: number;
    modelVersion?: string | null;
    latestUpload: Upload | null;
  }): DashboardSummary {
    const counts = Object.fromEntries(severities.map((severity) => [severity, 0])) as Record<AlertSeverity, number>;
    for (const item of input.alertCounts) {
      counts[item.severity] = item._count._all;
    }

    return {
      totalTransactions: input.totalTransactions,
      totalUploads: input.totalUploads,
      totalOrganizations: input.totalOrganizations,
      criticalAlerts: counts.CRITICAL,
      highAlerts: counts.HIGH,
      mediumAlerts: counts.MEDIUM,
      lowAlerts: counts.LOW,
      averageRiskScore: this.round(input.averageRiskScore),
      averageMlConfidence: this.round(input.averageMlConfidence),
      detectionRate: input.decisionCount > 0 ? this.round((input.detectedDecisionCount / input.decisionCount) * 100) : 0,
      falsePositivePlaceholder: 0,
      averageProcessingTime: this.round(input.averageProcessingTime),
      activeRules: input.activeRules,
      modelVersion: input.modelVersion ?? 'unavailable',
      latestUpload: input.latestUpload,
    };
  }

  private round(value?: number | null) {
    return Math.round((value ?? 0) * 100) / 100;
  }
}
