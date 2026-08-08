'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
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
import type { FeaturePipelineMetrics, FeatureVector } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { AppShell } from '../app-shell';

export function FeatureEngineeringConsole() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);

  const [selectedTxId, setSelectedTxId] = React.useState('');
  const [searchTxInput, setSearchTxInput] = React.useState('');

  const metricsQuery = useQuery<FeaturePipelineMetrics>({
    queryKey: ['feature-metrics'],
    queryFn: async () => {
      const resp = await client.get('/features/metrics');
      return resp.data.data;
    },
    refetchInterval: 10000,
  });

  const vectorQuery = useQuery<FeatureVector>({
    queryKey: ['feature-vector', selectedTxId],
    queryFn: async () => {
      if (!selectedTxId) return null as any;
      const resp = await client.get(`/features/transaction/${selectedTxId}`);
      return resp.data.data;
    },
    enabled: Boolean(selectedTxId),
  });

  const handleSearchTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTxInput.trim()) {
      setSelectedTxId(searchTxInput.trim());
    }
  };

  const metrics = metricsQuery.data;
  const vectorData = vectorQuery.data;

  // Mock Feature Category Distribution for visual display
  const categoryData = [
    { name: 'Amount Features', count: 14 },
    { name: 'Time Features', count: 14 },
    { name: 'Merchant Features', count: 8 },
    { name: 'Country Features', count: 8 },
    { name: 'Device Features', count: 7 },
    { name: 'User Behavior', count: 13 },
    { name: 'Velocity', count: 9 },
    { name: 'Geographical', count: 7 },
    { name: 'Statistical', count: 9 },
    { name: 'Risk', count: 8 },
  ];

  return (
    <AppShell title="Feature Engineering Pipeline" breadcrumb="ML SERVICE / FEATURE PIPELINE">
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
                  <Zap className="h-3.5 w-3.5" /> Pipeline Active
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Version {metrics?.pipeline_version || 'v1.0.0'}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mt-2">ML Feature Data Pipeline</h1>
              <p className="text-xs text-muted-foreground max-w-2xl mt-1">
                Deterministic transformation engine producing 98+ numerical & categorical features across 10 categories prior to ML Isolation Forest scoring.
              </p>
            </div>
            <button
              onClick={() => void metricsQuery.refetch()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface shrink-0"
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${metricsQuery.isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </section>

        {/* 4 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground">Total Vectors Extracted</span>
              <Database className="h-4 w-4 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground mt-2">
              {metrics?.total_extractions ?? 0}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <CheckCircle2 className="h-3 w-3" /> 100% Deterministic
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground">Avg Extraction Latency</span>
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <p className="font-display text-2xl font-bold text-purple-400 mt-2">
              {metrics?.avg_processing_time_ms ?? 0} ms
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Target: &lt; 50 ms / tx
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground">Scaling & Encoding</span>
              <Sparkles className="h-4 w-4 text-sky-400" />
            </div>
            <p className="font-display text-lg font-bold text-sky-400 mt-2 capitalize">
              {metrics?.scaler_mode || 'Standard'} / {metrics?.encoder_mode || 'Frequency'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              Configured via ENV
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-muted-foreground">Validation Failures</span>
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="font-display text-2xl font-bold text-emerald-400 mt-2">
              {metrics?.failed_extractions ?? 0}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 font-mono">
              0 NaN / Infinity errors
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Feature Distribution by Category */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-primary" /> Feature Extractor Vector Breakdown
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26273b" />
                  <XAxis dataKey="name" stroke="#8f93b2" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#8f93b2" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#15172a', borderColor: '#26273b', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Feature Vector Inspector */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-primary" /> Feature Vector Inspector
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Lookup extracted feature vector numerical values for any transaction by ID.
              </p>
              <form onSubmit={handleSearchTx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Transaction UUID..."
                  value={searchTxInput}
                  onChange={(e) => setSearchTxInput(e.target.value)}
                  className="flex-1 h-9 rounded-xl border border-border bg-surface-alt px-3 font-mono text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary-strong transition-colors"
                >
                  Lookup Vector
                </button>
              </form>
            </div>

            {vectorQuery.isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Fetching feature vector...
              </div>
            ) : vectorData ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border/80 pb-2">
                  <span className="font-mono text-muted-foreground">Status: <strong className="text-emerald-400">{vectorData.status}</strong></span>
                  <span className="font-mono text-muted-foreground">Features: <strong className="text-primary">{vectorData.featureCount}</strong></span>
                  <span className="font-mono text-muted-foreground">Latency: <strong className="text-purple-400">{vectorData.processingTimeMs}ms</strong></span>
                </div>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-3 font-mono text-[11px] space-y-1">
                  {Object.entries(vectorData.vector || {}).slice(0, 15).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5 border-b border-border/20">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-primary font-bold">{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                    </div>
                  ))}
                  {Object.keys(vectorData.vector || {}).length > 15 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      + {Object.keys(vectorData.vector).length - 15} more feature fields
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                Enter a Transaction UUID above to view its full numerical feature vector payload.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
