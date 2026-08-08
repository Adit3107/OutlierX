'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Eye,
  GitBranch,
  Layers,
  RefreshCw,
  Scale,
  ShieldAlert,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Decision, PaginatedResponse } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { AppShell } from '../app-shell';

const RISK_COLORS = {
  SAFE: '#10b981',
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export function EnsembleDecisionConsole() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);

  const [selectedDecision, setSelectedDecision] = React.useState<Decision | null>(null);

  const decisionsQuery = useQuery<PaginatedResponse<Decision>>({
    queryKey: ['decisions-list'],
    queryFn: async () => {
      const resp = await client.get('/decisions?limit=50');
      return resp.data.data;
    },
    refetchInterval: 10000,
  });

  const decisions = decisionsQuery.data?.items || [];
  const totalDecisions = decisionsQuery.data?.total || decisions.length;

  // Aggregate stats
  const outcomeCounts = decisions.reduce(
    (acc, d) => {
      const outcome = d.recommendation || d.decisionOutcome || 'ALLOW_TRANSACTION';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryCounts = decisions.reduce(
    (acc, d) => {
      const lvl = d.riskLevel || 'SAFE';
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgRiskScore =
    decisions.length > 0
      ? Math.round(decisions.reduce((sum, d) => sum + (d.finalScore || 0), 0) / decisions.length)
      : 0;

  const avgConfidence =
    decisions.length > 0
      ? Math.round(decisions.reduce((sum, d) => sum + (d.confidence || 0), 0) / decisions.length)
      : 0;

  const categoryPieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const weightBarData = [
    { name: 'Rule Engine (60%)', weight: 60, fill: '#6366f1' },
    { name: 'Isolation Forest (16%)', weight: 16, fill: '#a855f7' },
    { name: 'LOF Density (12%)', weight: 12, fill: '#ec4899' },
    { name: 'One-Class SVM (12%)', weight: 12, fill: '#3b82f6' },
  ];

  return (
    <AppShell title="Ensemble Decision Engine" breadcrumb="DECISION ENGINE / RISK SCORING">
      <div className="space-y-6">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface p-6 shadow-xl">
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-indigo-600/10 to-transparent pointer-events-none"
            style={{ background: 'radial-gradient(circle at 10% 0, rgba(99,102,241,0.2), transparent 70%)' }}
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
                  <Scale className="h-3.5 w-3.5" /> Single Source of Truth
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5 text-primary" /> Strategy: Ensemble Weights (Rule 60% / ML 40%)
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mt-2">Ensemble Risk & Decision Engine</h1>
              <p className="text-xs text-muted-foreground max-w-2xl mt-1">
                Combines Rule Engine findings with multi-model ML predictions (Isolation Forest, LOF, SVM) and historical behavior into explainable, production risk decisions.
              </p>
            </div>
            <button
              onClick={() => void decisionsQuery.refetch()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface-alt px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface shrink-0"
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${decisionsQuery.isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Decisions</span>
            </button>
          </div>
        </section>

        {/* 4 Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <span className="text-[11px] font-mono text-muted-foreground uppercase block">Total Decisions</span>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">{totalDecisions.toLocaleString()}</div>
            <span className="text-[10px] text-muted-foreground mt-1 block">Active evaluated transactions</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <span className="text-[11px] font-mono text-muted-foreground uppercase block">Avg Risk Score</span>
            <div className="text-2xl font-bold font-mono text-primary mt-1">{avgRiskScore} / 100</div>
            <span className="text-[10px] text-muted-foreground mt-1 block">Normalized ensemble score</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <span className="text-[11px] font-mono text-muted-foreground uppercase block">Avg Confidence</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{avgConfidence}%</div>
            <span className="text-[10px] text-muted-foreground mt-1 block">Model & rule agreement</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <span className="text-[11px] font-mono text-muted-foreground uppercase block">Allowed / Blocked</span>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">
              <span className="text-emerald-400">{outcomeCounts['ALLOW_TRANSACTION'] || 0}</span> /{' '}
              <span className="text-red-400">{outcomeCounts['REJECT_TRANSACTION'] || 0}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Flagged: {outcomeCounts['FLAG_FOR_REVIEW'] || outcomeCounts['MANUAL_INVESTIGATION'] || 0}
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ensemble Weight Split Bar Chart */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-primary" /> Ensemble Weight Distribution
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weightBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26273b" />
                  <XAxis dataKey="name" stroke="#8f93b2" fontSize={10} />
                  <YAxis stroke="#8f93b2" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#15172a', borderColor: '#26273b', borderRadius: '8px' }} />
                  <Bar dataKey="weight" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Risk Category Pie Chart */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 text-primary" /> Risk Category Breakdown
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(RISK_COLORS as any)[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#15172a', borderColor: '#26273b', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-muted-foreground">No decisions evaluated yet</div>
              )}
            </div>
          </section>
        </div>

        {/* Decisions Table & Inspector */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" /> Recent Evaluated Decisions
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Rule Score</th>
                  <th className="py-2.5 px-3">ML Score</th>
                  <th className="py-2.5 px-3">Final Score</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {decisions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground font-sans">
                      No decisions found. Upload transactions to generate ensemble risk scores.
                    </td>
                  </tr>
                ) : (
                  decisions.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">{d.transactionId.slice(0, 12)}...</td>
                      <td className="py-3 px-3 font-bold text-primary">{d.recommendation || d.decisionOutcome}</td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `${(RISK_COLORS as any)[d.riskLevel] || '#6366f1'}20`,
                            color: (RISK_COLORS as any)[d.riskLevel] || '#6366f1',
                          }}
                        >
                          {d.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{d.ruleScore}</td>
                      <td className="py-3 px-3 text-muted-foreground">{d.mlScore}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{d.finalScore}</td>
                      <td className="py-3 px-3 text-emerald-400">{d.confidence}%</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedDecision(d)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-alt px-2.5 py-1 text-[11px] font-sans font-semibold text-foreground hover:bg-surface"
                          type="button"
                        >
                          <Eye className="h-3 w-3" /> Timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected Decision Stage Timeline Modal */}
        {selectedDecision ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Decision Timeline Inspector
                </h3>
                <button
                  onClick={() => setSelectedDecision(null)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs max-h-96 overflow-y-auto pr-1">
                {(selectedDecision.explanation?.timeline || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 border-l-2 border-primary/40 pl-3 py-1">
                    <div>
                      <span className="font-bold text-foreground block">{item.label || item.stage}</span>
                      <span className="text-muted-foreground text-[11px] block">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
