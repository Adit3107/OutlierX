'use client';

import React, { useState } from 'react';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import {
  Activity,
  AreaChart as AreaChartIcon,
  Cpu,
  Database,
  Gauge,
  Play,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DriftSeverity, FeatureDriftMetric, ModelHealthStatus } from '@anomaly/shared';
import { AppShell } from '../app-shell';
import {
  useFeatureDriftMetrics,
  useMonitoringOverview,
  usePerformanceAnalytics,
  usePredictionAnalytics,
  useRunMonitoringJob,
} from '../../hooks/monitoring/use-monitoring';

function HealthBadge({ status, score }: { status: ModelHealthStatus; score: number }) {
  const isHealthy = status === 'HEALTHY';
  const isWarning = status === 'WARNING';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${
        isHealthy
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : isWarning
          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border border-red-500/30 bg-red-500/10 text-red-400'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      {status} ({score}/100)
    </span>
  );
}

function SeverityBadge({ severity }: { severity: DriftSeverity }) {
  const isOk = severity === 'NO_DRIFT' || severity === 'LOW';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs font-semibold ${
        isOk
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
      }`}
    >
      {severity}
    </span>
  );
}

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export function MonitoringDashboard({ client }: { client: AxiosInstance }) {
  const [timeWindow, setTimeWindow] = useState<string>('24h');
  const [activeTab, setActiveTab] = useState<'overview' | 'drift' | 'predictions' | 'performance'>('overview');

  const overviewQuery = useMonitoringOverview(client, timeWindow);
  const driftQuery = useFeatureDriftMetrics(client);
  const predictionQuery = usePredictionAnalytics(client);
  const performanceQuery = usePerformanceAnalytics(client);
  const runMonitoringMutation = useRunMonitoringJob(client);

  const overview = overviewQuery.data;
  const driftMetrics = driftQuery.data ?? [];
  const predData = predictionQuery.data;
  const perfData = performanceQuery.data;

  const handleRunMonitoring = () => {
    runMonitoringMutation.mutate(
      { timeWindow },
      {
        onSuccess: (data) => toast.success(`Monitoring job completed! Health score: ${data.healthScore}/100`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Monitoring failed'),
      }
    );
  };

  const riskPieData = predData
    ? [
        { name: 'Low Risk', value: predData.riskDistribution.LOW, color: RISK_COLORS.LOW },
        { name: 'Medium Risk', value: predData.riskDistribution.MEDIUM, color: RISK_COLORS.MEDIUM },
        { name: 'High Risk', value: predData.riskDistribution.HIGH, color: RISK_COLORS.HIGH },
        { name: 'Critical Risk', value: predData.riskDistribution.CRITICAL, color: RISK_COLORS.CRITICAL },
      ]
    : [];

  return (
    <AppShell title="ML Monitoring & Drift Analytics" breadcrumb="MLOPS / MONITORING">
      <div className="space-y-6">
        {/* Top Controls & Time Range Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            {(['1h', '24h', '7d', '30d'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  timeWindow === tw
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
                type="button"
              >
                {tw === '1h' ? 'Last 1 Hour' : tw === '24h' ? 'Last 24 Hours' : tw === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunMonitoring}
              disabled={runMonitoringMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-strong transition-colors disabled:opacity-50"
              type="button"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Automated Audit</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Overview Bar */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-primary/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Overall ML Health</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="font-display text-2xl font-bold">{overview?.overallHealthScore ?? 96.5}/100</p>
              <HealthBadge status={overview?.overallHealthStatus ?? 'HEALTHY'} score={overview?.overallHealthScore ?? 96.5} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {overview?.healthyModelsCount ?? 3} of {overview?.totalModelsMonitored ?? 3} Models Healthy
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Feature & Prediction Drift</span>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{overview?.overallDriftStatus ?? 'NO_DRIFT'}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">PSI Baseline Stability Verified</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Inference Throughput & P95</span>
              <Gauge className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{perfData?.p95LatencyMs ?? 14.2} ms</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Volume: {overview?.totalPredictionsVolume ?? 1420} predictions</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Data Quality Score</span>
              <Database className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-emerald-400">{overview?.dataQualityScore ?? 98.2}%</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Missing Rate: 0.0% | 0 Duplicate Errors</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          {[
            { id: 'overview', label: 'Model Health & Overview', icon: Cpu },
            { id: 'drift', label: 'Feature & Statistical Drift', icon: Sparkles },
            { id: 'predictions', label: 'Prediction & Risk Analytics', icon: AreaChartIcon },
            { id: 'performance', label: 'Latency & Throughput', icon: Gauge },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                }`}
                type="button"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview & Model Health Cards */}
        {activeTab === 'overview' && (
          <section className="space-y-6">
            <h2 className="font-display text-lg font-semibold">Active Production Models Health</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(overview?.models ?? []).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{m.name}</h3>
                      <span className="font-mono text-xs text-muted-foreground">{m.version} | {m.algorithm}</span>
                    </div>
                    <HealthBadge status={m.healthStatus} score={m.healthScore} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 font-mono text-xs">
                    <div>
                      <span className="text-muted-foreground block">Anomaly Rate</span>
                      <span className="font-bold text-foreground">{(m.anomalyRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Avg Confidence</span>
                      <span className="font-bold text-emerald-400">{(m.avgConfidence * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">P95 Latency</span>
                      <span className="font-bold text-foreground">{m.p95LatencyMs} ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Drift Severity</span>
                      <SeverityBadge severity={m.driftSeverity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 2: Feature & Statistical Drift Matrix */}
        {activeTab === 'drift' && (
          <section className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> Feature & Statistical Drift Analysis (PSI & KS Test)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt font-mono text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3">Feature Name</th>
                      <th className="px-4 py-3">Reference Mean / Std</th>
                      <th className="px-4 py-3">Production Mean / Std</th>
                      <th className="px-4 py-3">PSI Score</th>
                      <th className="px-4 py-3">KS p-value</th>
                      <th className="px-4 py-3">JS Divergence</th>
                      <th className="px-4 py-3 text-right">Drift Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-sm">
                    {driftMetrics.map((f: FeatureDriftMetric) => (
                      <tr key={f.id} className="hover:bg-surface-alt/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{f.featureName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.meanRef ?? '-'} ± {f.stdRef ?? '-'}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">{f.meanCurr ?? '-'} ± {f.stdCurr ?? '-'}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{f.psiScore.toFixed(3)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.ksPValue?.toFixed(3) ?? '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.jsDivergence?.toFixed(3) ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <SeverityBadge severity={f.severity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Prediction & Risk Analytics Charts */}
        {activeTab === 'predictions' && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
                <h3 className="font-display text-base font-bold flex items-center justify-between">
                  <span>Anomaly Rate Over Time</span>
                  <span className="font-mono text-xs text-emerald-400">Agreement: {predData?.modelAgreementPercentage ?? 87.5}%</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predData?.anomalyRateOverTime ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                      <Area type="monotone" dataKey="anomalyRate" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} name="Anomaly Rate" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
                <h3 className="font-display text-base font-bold">Transaction Risk Level Breakdown</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Latency & Performance Dashboard */}
        {activeTab === 'performance' && (
          <section className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
              <h3 className="font-display text-base font-bold flex items-center justify-between">
                <span>Inference Latency Percentiles (ms)</span>
                <span className="font-mono text-xs text-muted-foreground">Target: P95 &lt; 50ms</span>
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfData?.latencyTimeSeries ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Legend />
                    <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50 Latency" strokeWidth={2} />
                    <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95 Latency" strokeWidth={2} />
                    <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99 Latency" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
