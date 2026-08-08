import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MonitoringService } from '../modules/monitoring/services/monitoring.service.js';

describe('MonitoringService - Phase 2.5 ML Monitoring & Drift Detection', () => {
  let repository: any;
  let alertRepository: any;
  let activityService: any;
  let service: MonitoringService;

  beforeEach(() => {
    repository = {
      getLatestSnapshot: async () => null,
      createSnapshot: async (data: any) => ({ id: 'snap-1', ...data }),
      createFeatureDriftMetrics: async () => [],
      createPredictionDriftMetrics: async () => [],
      createDataQualityMetric: async () => ({}),
      createHealthLog: async () => ({}),
      listSnapshots: async () => [],
      listFeatureDrift: async () => [],
      listHealthLogs: async () => [],
      getTransactionAggregates: async () => ({ transactions: [], predictions: [] }),
    };

    alertRepository = {
      list: async () => [[], 0],
      create: async (data: any) => ({ id: 'alert-1', ...data }),
    };

    activityService = {
      log: async () => ({}),
    };

    service = new MonitoringService(repository, alertRepository as any, activityService as any);
  });

  it('should return executive monitoring overview payload', async () => {
    const overview = await service.getOverview('org-test', '24h');
    assert.ok(overview);
    assert.strictEqual(overview.overallHealthStatus, 'HEALTHY');
    assert.ok(overview.overallHealthScore >= 70);
    assert.strictEqual(overview.totalModelsMonitored, 3);
    assert.strictEqual(overview.models.length, 3);
  });

  it('should execute automated monitoring run and compute health score', async () => {
    const snapshot = await service.runMonitoring('org-test', 'isolation_forest', 'v1.2.0', '24h');
    assert.ok(snapshot);
    assert.ok(snapshot.healthScore > 0);
    assert.ok(snapshot.healthStatus);
  });

  it('should list feature drift metrics with PSI scores and severities', async () => {
    const drift = await service.getFeatureDrift('org-test');
    assert.ok(Array.isArray(drift));
    assert.ok(drift.length > 0);
    assert.strictEqual(drift[0].featureName, 'amount');
    assert.ok(drift[0].psiScore !== undefined);
  });

  it('should return latency percentiles P50, P95, P99 in performance analytics', async () => {
    const perf = await service.getPerformanceAnalytics('org-test');
    assert.ok(perf.p50LatencyMs < perf.p95LatencyMs);
    assert.ok(perf.p95LatencyMs < perf.p99LatencyMs);
    assert.ok(perf.latencyTimeSeries.length > 0);
  });
});
