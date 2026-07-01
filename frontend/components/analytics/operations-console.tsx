'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import {
  Archive,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Eye,
  EyeOff,
  Filter,
  LayoutDashboard,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  WalletCards,
} from 'lucide-react';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AuthContext,
  ChartDatum,
  DashboardActivity,
  DashboardCharts,
  DashboardSummary,
  HeatMapDatum,
  TimeSeriesDatum,
} from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { useAuthData } from '../../providers/auth-provider';
import {
  useAlertDetail,
  useAlerts,
  useAnalytics,
  useDashboardActivity,
  useDashboardCharts,
  useDashboardSummary,
} from '../../hooks/use-dashboard-polling';
import { getSeverityConfig, severityOrder } from '../../constants/severity';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value?: string | Date | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '-';
}

function formatNumber(value?: number | null, suffix = '') {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value ?? 0)}${suffix}`;
}

function severityColor(severity?: AlertSeverity | string) {
  if (!severity) {
    return 'var(--primary)';
  }
  const key = severity.toUpperCase() as AlertSeverity;
  return getSeverityConfig(key).cssVar;
}

function SignedOutPrompt({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">OutlierX</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">{label}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Authenticate to access the fraud operations console.</p>
      </section>
    </main>
  );
}

function OpsSidebar({ active }: { active: 'dashboard' | 'analytics' | 'alerts' | 'transactions' }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { key: 'alerts', label: 'Alerts', href: '/alerts', icon: Bell },
    { key: 'transactions', label: 'Transactions', href: '/transactions', icon: WalletCards },
  ] as const;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-surface text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none">OutlierX</p>
          <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Fraud Ops</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {items.map((item) => (
          <Link
            key={item.key}
            className={cn(
              'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
              active === item.key
                ? 'border border-border bg-surface-alt text-foreground'
                : 'text-muted-foreground hover:bg-surface hover:text-foreground'
            )}
            href={item.href}
          >
            <item.icon className={cn('h-4 w-4', active === item.key && 'text-primary')} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function DashboardHeader({
  auth,
  title,
  section,
  onRefresh,
}: {
  auth: AuthContext | null;
  title: string;
  section: string;
  onRefresh?: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">OPS / {section}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{auth?.organization.name ?? 'Secure workspace'}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-none">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh ? (
            <button aria-label="Refresh" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={onRefresh} type="button">
              <RefreshCw className="h-4 w-4" />
            </button>
          ) : null}
          <button aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={() => setTheme(isLight ? 'dark' : 'light')} type="button">
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

export function MetricCards({ summary }: { summary?: DashboardSummary }) {
  const cards = [
    ['Transactions', summary?.totalTransactions],
    ['Uploads', summary?.totalUploads],
    ['Organizations', summary?.totalOrganizations],
    ['Critical Alerts', summary?.criticalAlerts, 'CRITICAL'],
    ['High Alerts', summary?.highAlerts, 'HIGH'],
    ['Medium Alerts', summary?.mediumAlerts, 'MEDIUM'],
    ['Low Alerts', summary?.lowAlerts, 'LOW'],
    ['Avg Risk', summary?.averageRiskScore],
    ['Avg ML Confidence', summary?.averageMlConfidence, '%'],
    ['Detection Rate', summary?.detectionRate, '%'],
    ['False Positive', summary?.falsePositivePlaceholder],
    ['Avg Processing Ms', summary?.averageProcessingTime],
    ['Active Rules', summary?.activeRules],
    ['Model Version', summary?.modelVersion ?? 'unavailable'],
    ['Latest Upload', summary?.latestUpload?.originalFilename ?? 'none'],
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(([label, value, tone]) => (
        <article key={label} className="rounded-md border border-border bg-surface p-3">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p
            className={cn(
              'mt-2 truncate font-display text-2xl font-semibold tabular-nums',
              tone === 'CRITICAL' && 'text-severity-critical',
              tone === 'HIGH' && 'text-severity-high',
              tone === 'MEDIUM' && 'text-severity-medium',
              tone === 'LOW' && 'text-severity-low'
            )}
            title={String(value ?? 0)}
          >
            {typeof value === 'number' ? formatNumber(value, tone === '%' ? '%' : '') : String(value ?? 0)}
          </p>
        </article>
      ))}
    </section>
  );
}

export function KPIGrid({ summary }: { summary?: DashboardSummary }) {
  return <MetricCards summary={summary} />;
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-3 h-64" role="img" aria-label={title}>
        {children}
      </div>
    </section>
  );
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data recorded.</div>;
}

export function TrendCard({ title, data }: { title: string; data?: TimeSeriesDatum[] }) {
  return (
    <ChartFrame title={title}>
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgb(var(--border-rgb))" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} />
            <YAxis stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartFrame>
  );
}

export function RiskDistributionChart({ data }: { data?: ChartDatum[] }) {
  return (
    <ChartFrame title="Risk Distribution">
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={86}>
              {data.map((item) => <Cell key={item.name} fill={severityColor(item.severity)} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartFrame>
  );
}

function BarPanel({ title, data }: { title: string; data?: ChartDatum[] }) {
  return (
    <ChartFrame title={title}>
      {data?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgb(var(--border-rgb))" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} interval={0} tick={{ width: 90 }} />
            <YAxis stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
            <Bar dataKey="value" fill="var(--primary)" radius={[3, 3, 0, 0]}>
              {data.map((item) => <Cell key={item.name} fill={severityColor(item.severity)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartFrame>
  );
}

export function HeatMap({ data }: { data?: HeatMapDatum[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(1, ...(data ?? []).map((item) => item.value));
  const byKey = new Map((data ?? []).map((item) => [`${item.day}-${item.hour}`, item.value]));

  return (
    <ChartFrame title="Hourly Transaction Heatmap">
      <div className="grid h-full grid-rows-7 gap-1">
        {days.map((day) => (
          <div key={day} className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-1">
            <span className="font-mono text-[10px] text-muted-foreground">{day}</span>
            {Array.from({ length: 24 }).map((_, hour) => {
              const value = byKey.get(`${day}-${hour}`) ?? 0;
              return (
                <span
                  key={hour}
                  aria-label={`${day} ${hour}:00 ${value} transactions`}
                  className="rounded-sm bg-primary"
                  style={{ opacity: 0.08 + (value / max) * 0.82 }}
                  title={`${day} ${hour}:00 - ${value}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

export function CountryAnalysis({ data }: { data?: ChartDatum[] }) {
  return <BarPanel title="Transactions by Country" data={data} />;
}

export function MerchantAnalysis({ data }: { data?: ChartDatum[] }) {
  return <BarPanel title="Transactions by Merchant" data={data} />;
}

export function ChartGrid({ charts }: { charts?: DashboardCharts }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <RiskDistributionChart data={charts?.riskDistribution} />
      <TrendCard title="Risk Trend" data={charts?.riskTrend} />
      <TrendCard title="Daily Transaction Volume" data={charts?.dailyTransactionVolume} />
      <CountryAnalysis data={charts?.transactionsByCountry} />
      <MerchantAnalysis data={charts?.transactionsByMerchant} />
      <BarPanel title="Payment Method Distribution" data={charts?.paymentMethodDistribution} />
      <BarPanel title="Currency Distribution" data={charts?.currencyDistribution} />
      <BarPanel title="Top Risky Merchants" data={charts?.topRiskyMerchants} />
      <BarPanel title="Top Risky Countries" data={charts?.topRiskyCountries} />
      <HeatMap data={charts?.hourlyTransactionHeatmap} />
      <BarPanel title="Rule Trigger Frequency" data={charts?.ruleTriggerFrequency} />
      <BarPanel title="Model Prediction Distribution" data={charts?.modelPredictionDistribution} />
      <TrendCard title="Recent Upload Trend" data={charts?.recentUploadTrend} />
      <TrendCard title="Recent Alert Trend" data={charts?.recentAlertTrend} />
    </section>
  );
}

export function PulseRail({ events }: { events?: Array<{ id: string; severity: AlertSeverity; label: string; timestamp: string | Date }> }) {
  const mock = severityOrder.map((severity, index) => ({
    id: `${severity}-${index}`,
    severity,
    label: `${severity} anomaly pulse`,
    timestamp: new Date(Date.now() - index * 1800000),
  }));
  const items = events?.length ? events : mock;

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold">Pulse Rail</h2>
      <div className="mt-4 space-y-4 border-l border-border pl-4">
        {items.map((event, index) => {
          const severity = getSeverityConfig(event.severity);
          return (
            <article key={event.id} className="relative">
              <span className={cn('absolute -left-[22px] top-1 h-3 w-3 rounded-full', severity.className, index === 0 && 'anomaly-pulse-once')} style={{ background: severity.cssVar }} />
              <p className="font-mono text-xs text-foreground">{event.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function RecentActivity({ activity }: { activity?: DashboardActivity }) {
  const rows = [
    ...(activity?.recentUploads ?? []).map((item) => ({ id: item.id, type: 'Upload', label: item.originalFilename, at: item.createdAt })),
    ...(activity?.recentAlerts ?? []).map((item) => ({ id: item.id, type: 'Alert', label: item.title, at: item.createdAt })),
    ...(activity?.recentDecisions ?? []).map((item) => ({ id: item.id, type: 'Decision', label: item.recommendation, at: item.processedAt })),
    ...(activity?.recentRuleExecutions ?? []).map((item) => ({ id: item.id, type: 'Rule', label: `${item.triggeredCount} triggered`, at: item.createdAt })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 12);

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-base font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y divide-border">
        {rows.length ? rows.map((row) => (
          <article key={`${row.type}-${row.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{row.type}</p>
              <p className="truncate text-sm text-foreground">{row.label}</p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{formatDate(row.at)}</span>
          </article>
        )) : <p className="px-4 py-5 text-sm text-muted-foreground">No recent activity.</p>}
      </div>
    </section>
  );
}

export function AnalyticsPanel({ charts }: { charts?: DashboardCharts }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold">Analytics Panel</h2>
      <div className="mt-3 h-72">
        {charts?.riskTrend?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.riskTrend}>
              <defs>
                <linearGradient id="risk-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--border-rgb))" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} />
              <YAxis stroke="rgb(var(--muted-foreground-rgb))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
              <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#risk-area)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart />}
      </div>
    </section>
  );
}

function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  const config = getSeverityConfig(severity);
  return <span className={cn('inline-flex h-6 items-center rounded-md border px-2 font-mono text-[11px]', config.borderClassName, config.bgClassName, config.className)}>{config.label}</span>;
}

function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <span className="inline-flex h-6 items-center rounded-md border border-border bg-surface-alt px-2 font-mono text-[11px] text-muted-foreground">{status}</span>;
}

export function AlertCard({ alert }: { alert: Alert }) {
  return (
    <Link className="block rounded-md border border-border bg-surface p-3 hover:bg-surface-alt" href={`/alerts/${alert.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{alert.transaction?.transactionId ?? alert.transactionId ?? 'No transaction'}</p>
        </div>
        <AlertSeverityBadge severity={alert.severity} />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>{formatNumber(alert.riskScore)}</span>
        <span>{formatDate(alert.createdAt)}</span>
      </div>
    </Link>
  );
}

export function AlertFilters({
  search,
  setSearch,
  severity,
  setSeverity,
  status,
  setStatus,
}: {
  search: string;
  setSearch: (value: string) => void;
  severity: string;
  setSeverity: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input aria-label="Search alerts" className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground" onChange={(event) => setSearch(event.target.value)} placeholder="Search alerts, merchant, transaction" value={search} />
        </label>
        <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select aria-label="Filter severity" className="min-w-0 flex-1 bg-transparent text-xs outline-none" onChange={(event) => setSeverity(event.target.value)} value={severity}>
            <option value="">Severity</option>
            {severityOrder.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <select aria-label="Filter status" className="h-9 rounded-md border border-border bg-background px-3 text-xs outline-none" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">Status</option>
          <option value="OPEN">OPEN</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>
    </section>
  );
}

export function AlertTable({
  alerts,
  selected,
  setSelected,
}: {
  alerts: Alert[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm" role="grid">
          <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="w-10 px-3"> </th>
              <th className="px-3 font-medium">Alert</th>
              <th className="px-3 font-medium">Severity</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-3 font-medium">Transaction</th>
              <th className="px-3 font-medium">Risk</th>
              <th className="px-3 font-medium">Confidence</th>
              <th className="px-3 font-medium">Created</th>
              <th className="px-3 font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} className="h-11 border-b border-border/70 hover:bg-surface-alt/65">
                <td className="px-3">
                  <input aria-label={`Select ${alert.title}`} checked={selected.includes(alert.id)} className="h-4 w-4 rounded border-border bg-background" onChange={() => setSelected((current) => current.includes(alert.id) ? current.filter((id) => id !== alert.id) : [...current, alert.id])} type="checkbox" />
                </td>
                <td className="max-w-[280px] truncate px-3 text-foreground">{alert.title}</td>
                <td className="px-3"><AlertSeverityBadge severity={alert.severity} /></td>
                <td className="px-3"><AlertStatusBadge status={alert.status} /></td>
                <td className="max-w-[180px] truncate px-3 font-mono text-xs text-muted-foreground">{alert.transaction?.transactionId ?? '-'}</td>
                <td className="px-3 font-mono text-xs">{formatNumber(alert.riskScore)}</td>
                <td className="px-3 font-mono text-xs">{formatNumber(alert.confidence, '%')}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(alert.createdAt)}</td>
                <td className="px-3">
                  <Link aria-label="Open alert details" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground" href={`/alerts/${alert.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 ? <p className="px-4 py-5 text-sm text-muted-foreground">No alerts found.</p> : null}
      </div>
    </section>
  );
}

export function AlertDrawer({ alert }: { alert?: Alert | null }) {
  if (!alert) {
    return null;
  }

  return (
    <aside className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Alert Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">{alert.description ?? 'No description recorded.'}</p>
        </div>
        <AlertSeverityBadge severity={alert.severity} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ['Transaction', alert.transaction?.transactionId ?? alert.transactionId],
          ['Merchant', alert.transaction?.merchant],
          ['Recommendation', alert.recommendation],
          ['Assigned Analyst', alert.assignedAnalyst?.email ?? 'Unassigned'],
          ['Risk Score', formatNumber(alert.riskScore)],
          ['Confidence', formatNumber(alert.confidence, '%')],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-mono text-xs text-foreground">{value ?? '-'}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-border bg-background p-3">
        <p className="text-xs uppercase text-muted-foreground">Rule Breakdown</p>
        <div className="mt-2 space-y-2">
          {(alert.triggeredRules ?? []).length ? alert.triggeredRules?.map((rule, index) => (
            <p key={`${rule.ruleId}-${index}`} className="text-sm text-muted-foreground">{rule.ruleName}: {rule.explanation}</p>
          )) : <p className="text-sm text-muted-foreground">No triggered rules recorded.</p>}
        </div>
      </div>
    </aside>
  );
}

function BulkAlertActions({ selected, mutate }: { selected: string[]; mutate: (action: string) => void }) {
  if (selected.length === 0) {
    return null;
  }

  const actions = [
    ['MARK_READ', Eye],
    ['MARK_UNREAD', EyeOff],
    ['RESOLVE', CheckCircle2],
    ['ARCHIVE', Archive],
    ['DELETE', Trash2],
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-alt p-3">
      <span className="font-mono text-xs text-foreground">{selected.length} selected</span>
      <div className="flex flex-wrap gap-2">
        {actions.map(([action, Icon]) => (
          <button key={action} className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground hover:bg-surface" onClick={() => mutate(action)} type="button">
            <Icon className="h-3.5 w-3.5" /> {action.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConsoleShell({
  active,
  title,
  section,
  children,
  onRefresh,
}: {
  active: 'dashboard' | 'analytics' | 'alerts' | 'transactions';
  title: string;
  section: string;
  children: React.ReactNode;
  onRefresh?: () => void;
}) {
  const { auth } = useAuthData();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <OpsSidebar active={active} />
      <div className="lg:pl-56">
        <DashboardHeader auth={auth} title={title} section={section} onRefresh={onRefresh} />
        <div className="space-y-4 px-4 py-4 lg:px-6">{children}</div>
      </div>
    </main>
  );
}

export function DashboardConsole() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const summary = useDashboardSummary(client);
  const charts = useDashboardCharts(client);
  const activity = useDashboardActivity(client);
  const refresh = () => {
    void summary.refetch();
    void charts.refetch();
    void activity.refetch();
  };

  return (
    <ConsoleShell active="dashboard" title="Monitoring Dashboard" section="DASHBOARD" onRefresh={refresh}>
      <MetricCards summary={summary.data} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <AnalyticsPanel charts={charts.data} />
          <ChartGrid charts={charts.data} />
        </div>
        <div className="space-y-4">
          <PulseRail events={activity.data?.recentAlerts.map((alert) => ({ id: alert.id, severity: alert.severity, label: alert.title, timestamp: alert.createdAt }))} />
          <RecentActivity activity={activity.data} />
        </div>
      </div>
    </ConsoleShell>
  );
}

export function AnalyticsConsole() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const analytics = useAnalytics(client);

  return (
    <ConsoleShell active="analytics" title="Analytics" section="ANALYTICS" onRefresh={() => void analytics.refetch()}>
      <KPIGrid summary={analytics.data?.summary} />
      <ChartGrid charts={analytics.data?.charts} />
    </ConsoleShell>
  );
}

export function AlertsConsole() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([]);
  const alerts = useAlerts(client, { page, limit: 25, search: search || undefined, severity: severity || undefined, status: status || undefined });

  const bulkMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await client.post<{ data: { action: string; count: number } }>('/alerts/bulk', { ids: selected, action });
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.count} alerts updated`);
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Alert action failed'),
  });

  return (
    <ConsoleShell active="alerts" title="Alert Center" section="ALERTS" onRefresh={() => void alerts.refetch()}>
      <AlertFilters search={search} setSearch={(value) => { setSearch(value); setPage(1); }} severity={severity} setSeverity={(value) => { setSeverity(value); setPage(1); }} status={status} setStatus={(value) => { setStatus(value); setPage(1); }} />
      <BulkAlertActions selected={selected} mutate={(action) => bulkMutation.mutate(action)} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <AlertTable alerts={alerts.data?.items ?? []} selected={selected} setSelected={setSelected} />
          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 font-mono text-xs text-muted-foreground">
            <span>{alerts.data?.total ?? 0} alerts</span>
            <div className="flex items-center gap-2">
              <button aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page}</span>
              <button aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={!alerts.data || page >= alerts.data.totalPages} onClick={() => setPage((value) => value + 1)} type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {(alerts.data?.items ?? []).slice(0, 5).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      </div>
    </ConsoleShell>
  );
}

export function AlertDetailConsole() {
  const params = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const alert = useAlertDetail(client, params.id);
  const updateMutation = useMutation({
    mutationFn: async (payload: { isRead?: boolean; status?: AlertStatus }) => {
      const response = await client.patch<{ data: Alert }>(`/alerts/${params.id}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Alert updated');
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Alert update failed'),
  });

  return (
    <ConsoleShell active="alerts" title="Alert Details" section="ALERTS" onRefresh={() => void alert.refetch()}>
      <div className="flex flex-wrap gap-2">
        <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground" href="/alerts">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-alt" onClick={() => updateMutation.mutate({ isRead: !alert.data?.isRead })} type="button">
          <CircleDot className="h-4 w-4" /> {alert.data?.isRead ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-alt" onClick={() => updateMutation.mutate({ status: 'RESOLVED' })} type="button">
          <CheckCircle2 className="h-4 w-4" /> Resolve
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-alt" onClick={() => updateMutation.mutate({ status: 'ARCHIVED' })} type="button">
          <Archive className="h-4 w-4" /> Archive
        </button>
      </div>
      {alert.data ? <AlertDrawer alert={alert.data} /> : <section className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">Loading alert...</section>}
      {alert.data?.decision ? (
        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-display text-base font-semibold">Decision Explanation</h2>
          <p className="mt-3 text-sm text-foreground">{alert.data.decision.explanation.summary}</p>
          <div className="mt-3 space-y-2">
            {alert.data.decision.explanation.timeline.map((item, index) => (
              <p key={`${item.label}-${index}`} className="text-sm text-muted-foreground">{item.label}: {item.description}</p>
            ))}
          </div>
        </section>
      ) : null}
    </ConsoleShell>
  );
}

export { SignedOutPrompt };
