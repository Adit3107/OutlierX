'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Cpu,
  FlaskConical,
  Layers,
  Play,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ModelHealth, ModelInfo, ModelStats } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { AppShell } from '../app-shell';

export function MultiModelEngineConsole() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);

  const [sandboxAmount, setSandboxAmount] = React.useState('5000');
  const [sandboxTimeDelta, setSandboxTimeDelta] = React.useState('15');
  const [sandboxRiskScore, setSandboxRiskScore] = React.useState('45');
  const [sandboxResults, setSandboxResults] = React.useState<any[] | null>(null);
  const [sandboxLoading, setSandboxLoading] = React.useState(false);

  const modelsQuery = useQuery<{ default_model: string; models: ModelInfo[] }>({
    queryKey: ['models-list'],
    queryFn: async () => {
      const resp = await client.get('/models/list');
      return resp.data.data;
    },
    refetchInterval: 10000,
  });

  const healthQuery = useQuery<{ overall: string; models: ModelHealth[] }>({
    queryKey: ['models-health'],
    queryFn: async () => {
      const resp = await client.get('/models/health');
      return resp.data.data;
    },
    refetchInterval: 10000,
  });

  const statsQuery = useQuery<ModelStats[]>({
    queryKey: ['models-stats'],
    queryFn: async () => {
      const resp = await client.get('/models/stats');
      return resp.data.data;
    },
    refetchInterval: 10000,
  });

  const runMultiModelSandbox = async () => {
    setSandboxLoading(true);
    try {
      const feature_vector = {
        transaction_amount: Number(sandboxAmount) || 100,
        log_amount: Math.log1p(Number(sandboxAmount) || 100),
        time_since_previous_tx: Number(sandboxTimeDelta) || 60,
        risk_score: Number(sandboxRiskScore) || 0,
        merchant_frequency: 3,
        country_frequency: 1,
        cross_border_flag: 1,
      };

      const algorithms = ['isolation_forest', 'local_outlier_factor', 'one_class_svm'];
      const results = [];

      for (const algo of algorithms) {
        try {
          const resp = await client.post(`/models/predict?model_name=${algo}`, {
            feature_vector,
          });
          results.push(resp.data?.data?.data || resp.data?.data);
        } catch {
          // Ignore individual algorithm error in sandbox comparison
        }
      }

      setSandboxResults(results);
    } catch {
      // Sandbox error handling
    } finally {
      setSandboxLoading(false);
    }
  };

  const modelsList = modelsQuery.data?.models || [];
  const statsList = statsQuery.data || [];

  const chartData = (statsList.length ? statsList : modelsList).map((m) => ({
    name: m.algorithm || m.name,
    latency: m.avg_latency_ms || 1.5,
    inferences: m.total_inferences || 10,
  }));

  return (
    <AppShell title="Multi-Model Anomaly Detection Engine" breadcrumb="ML SERVICE / MULTI-MODEL ENGINE">
      <div className="space-y-6">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface p-6 shadow-xl">
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-600/10 to-transparent pointer-events-none"
            style={{ background: 'radial-gradient(circle at 10% 0, rgba(99,102,241,0.2), transparent 70%)' }}
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
                  <Zap className="h-3.5 w-3.5" /> Engine Operational
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Active Default: {modelsQuery.data?.default_model || 'isolation_forest'}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mt-2">Pluggable Anomaly Detection Engine</h1>
              <p className="text-xs text-muted-foreground max-w-2xl mt-1">
                Multi-algorithm ML scoring suite combining Isolation Forest, Local Outlier Factor (LOF), and One-Class SVM behind a unified abstract interface.
              </p>
            </div>
            <button
              onClick={() => {
                void modelsQuery.refetch();
                void healthQuery.refetch();
                void statsQuery.refetch();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface shrink-0"
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${modelsQuery.isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Models</span>
            </button>
          </div>
        </section>

        {/* 3 Active Model Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Isolation Forest */}
          <div className="rounded-2xl border border-primary/30 bg-surface p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold text-primary uppercase">
                <CheckCircle2 className="h-3 w-3" /> ACTIVE MODEL
              </span>
              <span className="font-mono text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mt-3">Isolation Forest</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tree-based global partitioning isolating anomalies by randomized feature cuts.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Trees</span>
                <span className="font-bold text-foreground">100 Estimators</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Contamination</span>
                <span className="font-bold text-primary">10% Target</span>
              </div>
            </div>
          </div>

          {/* Local Outlier Factor */}
          <div className="rounded-2xl border border-purple-500/30 bg-surface p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-purple-400 uppercase">
                <CheckCircle2 className="h-3 w-3" /> ACTIVE MODEL
              </span>
              <span className="font-mono text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mt-3">Local Outlier Factor (LOF)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Density-based local outlier calculation measuring k-nearest neighbor density ratios.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Neighbors</span>
                <span className="font-bold text-foreground">k = 20</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Novelty Mode</span>
                <span className="font-bold text-purple-400">Enabled</span>
              </div>
            </div>
          </div>

          {/* One-Class SVM */}
          <div className="rounded-2xl border border-sky-500/30 bg-surface p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-sky-400 uppercase">
                <CheckCircle2 className="h-3 w-3" /> ACTIVE MODEL
              </span>
              <span className="font-mono text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mt-3">One-Class SVM</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Hyperplane boundary separation mapping normal data into RBF kernel Hilbert space.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Kernel</span>
                <span className="font-bold text-foreground">RBF (Radial)</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Nu Parameter</span>
                <span className="font-bold text-sky-400">0.05</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Interactive Multi-Model Sandbox */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Model Latency Bar Chart */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-primary" /> Model Latency Comparison (ms)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26273b" />
                  <XAxis dataKey="name" stroke="#8f93b2" fontSize={10} />
                  <YAxis stroke="#8f93b2" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#15172a', borderColor: '#26273b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="latency" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Interactive Multi-Model Comparison Sandbox */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-2">
              <FlaskConical className="h-4 w-4 text-primary" /> Multi-Model Comparison Sandbox
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Evaluate feature parameters simultaneously across all 3 algorithms to compare raw scores & normalized risk predictions.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={sandboxAmount}
                  onChange={(e) => setSandboxAmount(e.target.value)}
                  className="w-full h-8 rounded-lg border border-border bg-surface-alt px-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Time Delta (s)</label>
                <input
                  type="number"
                  value={sandboxTimeDelta}
                  onChange={(e) => setSandboxTimeDelta(e.target.value)}
                  className="w-full h-8 rounded-lg border border-border bg-surface-alt px-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Rule Risk Score</label>
                <input
                  type="number"
                  value={sandboxRiskScore}
                  onChange={(e) => setSandboxRiskScore(e.target.value)}
                  className="w-full h-8 rounded-lg border border-border bg-surface-alt px-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              onClick={runMultiModelSandbox}
              disabled={sandboxLoading}
              className="w-full h-9 rounded-xl bg-primary px-4 font-display text-xs font-semibold text-primary-foreground hover:bg-primary-strong transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              type="button"
            >
              {sandboxLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Run Parallel Inference
                </>
              )}
            </button>

            {/* Sandbox Comparison Results */}
            {sandboxResults ? (
              <div className="mt-4 space-y-2">
                {sandboxResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3 text-xs font-mono">
                    <div>
                      <span className="font-bold text-foreground uppercase">{res.algorithm || res.model_name}</span>
                      <span className="text-[10px] text-muted-foreground block">Raw: {typeof res.raw_score === 'number' ? res.raw_score.toFixed(4) : '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${res.prediction === 'ANOMALY' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {res.prediction} ({res.normalized_score}/100)
                      </span>
                      <span className="text-[10px] text-muted-foreground block">Conf: {res.confidence}% · {res.execution_time_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
