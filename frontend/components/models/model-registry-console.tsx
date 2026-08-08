'use client';

import React, { useState } from 'react';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import {
  Archive,
  ArrowLeftRight,
  CheckCircle2,
  Cpu,
  GitBranch,
  History,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { MLModelVersion, ModelComparison, ModelComparisonMetricDiff } from '@anomaly/shared';
import { AppShell } from '../app-shell';
import {
  useActivateModelVersion,
  useArchiveModelVersion,
  useCompareModelVersions,
  useModelDeploymentHistory,
  useModelRegistryStatus,
  useModelsList,
  useRollbackModelVersion,
} from '../../hooks/models/use-model-registry';

function StatusBadge({ status }: { status: string }) {
  const isProd = status === 'ACTIVE' || status === 'PRODUCTION';
  const isArchived = status === 'ARCHIVED';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold uppercase ${
        isProd
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : isArchived
          ? 'border border-red-500/30 bg-red-500/10 text-red-400'
          : 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isProd ? 'bg-emerald-400 animate-pulse' : isArchived ? 'bg-red-400' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
}

export function ModelRegistryConsole({ client }: { client: AxiosInstance }) {
  const statusQuery = useModelRegistryStatus(client);
  const modelsQuery = useModelsList(client);
  const historyQuery = useModelDeploymentHistory(client);

  const activateMutation = useActivateModelVersion(client);
  const rollbackMutation = useRollbackModelVersion(client);
  const archiveMutation = useArchiveModelVersion(client);
  const compareMutation = useCompareModelVersions(client);

  const [selectedVersionA, setSelectedVersionA] = useState<string>('');
  const [selectedVersionB, setSelectedVersionB] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<ModelComparison | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'comparison' | 'history'>('versions');

  const models = modelsQuery.data ?? [];
  const mainModel = models[0];
  const versions = mainModel?.versions ?? [];
  const statusData = statusQuery.data;

  const handleActivate = (version: MLModelVersion) => {
    activateMutation.mutate(
      { versionId: version.id, reason: `Activated ${version.version} via Model Registry Console` },
      {
        onSuccess: (data) => toast.success(`Model version ${data.version} activated as Production model`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Activation failed'),
      }
    );
  };

  const handleRollback = (versionId?: string) => {
    rollbackMutation.mutate(
      { targetVersionId: versionId, reason: 'Manual rollback triggered from Model Registry Console' },
      {
        onSuccess: (data) => toast.success(`Successfully rolled back to version ${data.version}`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Rollback failed'),
      }
    );
  };

  const handleArchive = (version: MLModelVersion) => {
    archiveMutation.mutate(
      { versionId: version.id, reason: 'Archived via Model Registry Console' },
      {
        onSuccess: (data) => toast.success(`Version ${data.version} archived`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Archiving failed'),
      }
    );
  };

  const handleCompare = () => {
    if (!selectedVersionA || !selectedVersionB) {
      toast.error('Select two versions to compare');
      return;
    }
    if (selectedVersionA === selectedVersionB) {
      toast.error('Select two different versions');
      return;
    }
    compareMutation.mutate(
      { versionAId: selectedVersionA, versionBId: selectedVersionB },
      {
        onSuccess: (data) => {
          setComparisonResult(data);
          setActiveTab('comparison');
          toast.success('Version comparison matrix generated');
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Comparison failed'),
      }
    );
  };

  return (
    <AppShell title="Model Registry & Versioning" breadcrumb="MLOPS / MODEL REGISTRY">
      <div className="space-y-6">
        {/* Header Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-primary/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Active Model</span>
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-xl font-bold">{statusData?.activeModel ?? 'isolation_forest'}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Algorithm: {statusData?.activeAlgorithm ?? 'IsolationForest'}</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Production Version</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-xl font-bold text-emerald-400">{statusData?.activeVersion ?? 'v1.2.0'}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Status: ACTIVE (Production)</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Registered Versions</span>
              <GitBranch className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-xl font-bold">{statusData?.totalVersions ?? versions.length ?? 3}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Immutable History Tracked</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-muted-foreground">Registry Status</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-xl font-bold text-emerald-400">HEALTHY</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Single Source of Truth</p>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('versions')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'versions'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              <Layers className="h-4 w-4" />
              <span>Model Versions ({versions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Compare Versions</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              <History className="h-4 w-4" />
              <span>Deployment Audit Log</span>
            </button>
          </div>

          <button
            onClick={() => handleRollback()}
            disabled={rollbackMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Emergency Rollback</span>
          </button>
        </div>

        {/* Tab 1: Versions List */}
        {activeTab === 'versions' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt font-mono text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Algorithm & Features</th>
                    <th className="px-4 py-3">Precision / Recall / F1</th>
                    <th className="px-4 py-3">ROC-AUC</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Deployment Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {versions.map((ver: MLModelVersion) => {
                    const metrics = ver.latestEvaluation;
                    return (
                      <tr key={ver.id} className="hover:bg-surface-alt/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-foreground">{ver.version}</span>
                            {ver.activeFlag && (
                              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{ver.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ver.status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <div className="text-foreground">{ver.model?.algorithm ?? 'IsolationForest'}</div>
                          <div className="text-muted-foreground">{ver.expectedFeatureCount} feature vector</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {metrics ? (
                            <div>
                              <span className="text-emerald-400 font-bold">{(metrics.precision * 100).toFixed(1)}%</span> /{' '}
                              <span>{(metrics.recall * 100).toFixed(1)}%</span> /{' '}
                              <span className="text-accent">{(metrics.f1Score * 100).toFixed(1)}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                          {metrics ? `${(metrics.rocAuc * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {metrics ? `${metrics.latencyMs.toFixed(1)} ms` : '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {ver.deploymentDate ? new Date(ver.deploymentDate).toLocaleDateString() : 'Not deployed'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!ver.activeFlag && ver.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleActivate(ver)}
                                disabled={activateMutation.isPending}
                                className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-400 hover:bg-emerald-500/20"
                                type="button"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Activate
                              </button>
                            )}
                            {!ver.activeFlag && ver.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleArchive(ver)}
                                disabled={archiveMutation.isPending}
                                className="inline-flex items-center gap-1 rounded border border-border bg-surface-alt px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                                type="button"
                              >
                                <Archive className="h-3 w-3" /> Archive
                              </button>
                            )}
                            {ver.activeFlag && (
                              <span className="font-mono text-xs text-emerald-400 font-semibold">Active Production</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 2: Model Version Comparison Matrix */}
        {activeTab === 'comparison' && (
          <section className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-accent" /> Side-by-Side Model Version Comparison
              </h2>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Version A (Baseline)</label>
                  <select
                    value={selectedVersionA}
                    onChange={(e) => setSelectedVersionA(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                  >
                    <option value="">Select Version A</option>
                    {versions.map((v: MLModelVersion) => (
                      <option key={v.id} value={v.id}>
                        {v.version} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Version B (Challenger)</label>
                  <select
                    value={selectedVersionB}
                    onChange={(e) => setSelectedVersionB(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-alt px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                  >
                    <option value="">Select Version B</option>
                    {versions.map((v: MLModelVersion) => (
                      <option key={v.id} value={v.id}>
                        {v.version} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCompare}
                  disabled={compareMutation.isPending}
                  className="h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-strong transition-colors"
                  type="button"
                >
                  Generate Comparison Matrix
                </button>
              </div>
            </div>

            {comparisonResult && (
              <div className="rounded-lg border border-primary/30 bg-surface p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">Comparison Matrix Summary</h3>
                    <p className="text-sm text-muted-foreground mt-1">{comparisonResult.metricsComparison.summary}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono uppercase text-muted-foreground block">Winner Version</span>
                    <span className="font-mono text-lg font-bold text-emerald-400">{comparisonResult.winnerVersionId}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt font-mono text-xs uppercase text-muted-foreground">
                        <th className="px-4 py-3">Metric</th>
                        <th className="px-4 py-3 font-bold text-foreground">Version A ({comparisonResult.versionA?.version})</th>
                        <th className="px-4 py-3 font-bold text-foreground">Version B ({comparisonResult.versionB?.version})</th>
                        <th className="px-4 py-3">Difference</th>
                        <th className="px-4 py-3 text-right">Winner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-sm">
                      {comparisonResult.metricsComparison.diffs.map((diff: ModelComparisonMetricDiff) => (
                        <tr key={diff.metric} className="hover:bg-surface-alt/40">
                          <td className="px-4 py-3 font-semibold text-foreground">{diff.label}</td>
                          <td className="px-4 py-3">{typeof diff.valueA === 'number' && diff.valueA < 1 ? `${(diff.valueA * 100).toFixed(1)}%` : diff.valueA}</td>
                          <td className="px-4 py-3">{typeof diff.valueB === 'number' && diff.valueB < 1 ? `${(diff.valueB * 100).toFixed(1)}%` : diff.valueB}</td>
                          <td className={`px-4 py-3 font-bold ${typeof diff.diff === 'number' && diff.diff > 0 ? 'text-emerald-400' : 'text-accent'}`}>
                            {typeof diff.diff === 'number' && diff.diff > 0 ? `+${diff.diff}` : diff.diff}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400">
                            {diff.winner === 'A' ? comparisonResult.versionA?.version : diff.winner === 'B' ? comparisonResult.versionB?.version : 'TIE'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Deployment Audit Log */}
        {activeTab === 'history' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-accent" /> Deployment & Activation History
              </h2>
              <div className="space-y-3">
                {(historyQuery.data ?? []).length > 0 ? (
                  historyQuery.data?.map((hist) => (
                    <div key={hist.id} className="flex items-center justify-between rounded-md border border-border bg-surface-alt p-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          hist.action === 'ACTIVATED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {hist.action === 'ACTIVATED' ? 'ACT' : 'RLB'}
                        </span>
                        <div>
                          <p className="font-mono text-sm font-semibold text-foreground">{hist.action}: Version {hist.version?.version}</p>
                          <p className="text-xs text-muted-foreground">{hist.reason ?? 'Automated model registry action'}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-muted-foreground">
                        {new Date(hist.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No historical deployment events recorded yet.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
