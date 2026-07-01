'use client';

import React from 'react';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleDot,
  Database,
  Gauge,
  LayoutDashboard,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  TerminalSquare,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AlertSeverity, AuthContext } from '@anomaly/shared';
import { anomalyEvents, analystTimeline, trendSeries, type AnomalyEvent } from '../constants/anomaly-data';
import { getSeverityConfig, severityOrder } from '../constants/severity';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const config = getSeverityConfig(severity);

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 font-mono text-[11px] font-medium uppercase leading-none',
        config.bgClassName,
        config.borderClassName,
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-[32px] font-semibold leading-[1.15] tabular-nums">{value}</p>
        </div>
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{detail}</p>
    </section>
  );
}

function PulseRail({ events }: { events: AnomalyEvent[] }) {
  return (
    <div className="fixed left-[224px] top-0 z-30 hidden h-screen w-[11px] border-x border-border bg-background lg:block">
      <div className="flex h-full flex-col justify-end gap-[5px] px-[3px] py-4" aria-label="Recent anomaly pulse rail">
        {events.slice(0, 34).map((event, index) => {
          const config = getSeverityConfig(event.severity);
          return (
            <span
              key={event.id}
              className={cn('relative h-[9px] w-[3px] rounded-sm', index === 0 && 'anomaly-pulse-once')}
              style={{
                backgroundColor: config.cssVar,
                color: config.cssVar,
                opacity: Math.max(0.34, 1 - index * 0.055),
              }}
              title={`${event.transactionId} ${event.severity}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { label: 'Overview', icon: LayoutDashboard, active: true },
    { label: 'Anomalies', icon: AlertTriangle },
    { label: 'Transactions', icon: WalletCards },
    { label: 'Rules', icon: Gauge },
    { label: 'Event Log', icon: TerminalSquare },
    { label: 'Data Sources', icon: Database },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-surface text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none">Anomalyze</p>
          <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Fraud Ops</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {items.map((item) => (
          <button
            key={item.label}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors duration-200 ease-out',
              item.active
                ? 'border border-border bg-surface-alt text-foreground'
                : 'text-muted-foreground hover:bg-surface hover:text-foreground'
            )}
            type="button"
          >
            <item.icon className={cn('h-4 w-4', item.active && 'text-primary')} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Ingest health</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-foreground">stream-01</span>
            <span className="font-mono text-xs text-primary">LIVE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header({ auth }: { auth: AuthContext | null }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">OPS / REALTIME</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{auth?.organization.name ?? 'Secure workspace'}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-none">Anomaly Analysis Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">Search TX, wallet, event</span>
          </div>
          <button
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            type="button"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
            type="button"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-severity-critical" />
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

function TrendPanel() {
  return (
    <section className="rounded-md border border-border bg-surface p-4 xl:col-span-2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Anomaly Velocity</h2>
          <p className="text-xs text-muted-foreground">Six rolling 10-minute windows</p>
        </div>
        <span className="font-mono text-xs text-primary">GRID 40%</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="window" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={28} />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="critical" stackId="1" stroke="var(--critical)" fill="var(--critical)" fillOpacity={0.3} />
            <Area type="monotone" dataKey="high" stackId="1" stroke="var(--high)" fill="var(--high)" fillOpacity={0.22} />
            <Area type="monotone" dataKey="medium" stackId="1" stroke="var(--medium)" fill="var(--medium)" fillOpacity={0.2} />
            <Area type="monotone" dataKey="low" stackId="1" stroke="var(--low)" fill="var(--low)" fillOpacity={0.18} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function SeverityDistribution({ events }: { events: AnomalyEvent[] }) {
  const data = severityOrder.map((severity) => ({
    severity,
    count: events.filter((event) => event.severity === severity).length,
    fill: getSeverityConfig(severity).cssVar,
  }));

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-display text-lg font-semibold">Severity Load</h2>
      <p className="text-xs text-muted-foreground">Active queue composition</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="severity" type="category" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={12} width={64} />
            <Tooltip
              cursor={{ fill: 'rgb(var(--surface-alt-rgb) / 0.65)' }}
              contentStyle={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.severity} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AlertQueue({ events }: { events: AnomalyEvent[] }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Active Alert Queue</h2>
        <span className="font-mono text-xs text-muted-foreground">{events.length} events</span>
      </div>
      <div className="mt-3 space-y-2">
        {events.slice(0, 5).map((event) => {
          const config = getSeverityConfig(event.severity);
          return (
            <article
              key={event.id}
              className={cn(
                'rounded-md border border-border bg-surface-alt/55 p-3 transition-transform duration-200 ease-out hover:-translate-y-0.5',
                'border-l-[3px]'
              )}
              style={{ borderLeftColor: config.cssVar, boxShadow: `inset 10px 0 24px -24px ${config.cssVar}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">{event.transactionId}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.reason}</p>
                </div>
                <SeverityBadge severity={event.severity} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
                <span>{formatTime(event.timestamp)}</span>
                <span>{event.status}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TransactionTable({ events }: { events: AnomalyEvent[] }) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Transaction Anomalies</h2>
          <p className="text-xs text-muted-foreground">Ranked by latest detection event</p>
        </div>
        <button className="h-8 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground transition-colors duration-200 ease-out hover:bg-primary-strong/90" type="button">
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="w-2 px-0" />
              <th className="px-3 font-medium">Severity</th>
              <th className="px-3 font-medium">Transaction</th>
              <th className="px-3 font-medium">Amount</th>
              <th className="px-3 font-medium">Merchant</th>
              <th className="px-3 font-medium">Channel</th>
              <th className="px-3 font-medium">Region</th>
              <th className="px-3 font-medium">Risk</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const config = getSeverityConfig(event.severity);
              return (
                <tr key={event.id} className="h-10 border-b border-border/70 transition-colors duration-150 ease-out hover:bg-surface-alt/65">
                  <td className="px-0">
                    <span className="block h-10 w-[3px]" style={{ backgroundColor: config.cssVar }} />
                  </td>
                  <td className="px-3">
                    <SeverityBadge severity={event.severity} />
                  </td>
                  <td className="px-3 font-mono text-xs text-foreground">{event.transactionId}</td>
                  <td className="px-3 font-mono text-xs">{formatCurrency(event.amount, event.currency)}</td>
                  <td className="px-3 text-foreground">{event.merchant}</td>
                  <td className="px-3 text-muted-foreground">{event.channel}</td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{event.region}</td>
                  <td className="px-3 font-mono text-xs text-foreground">{event.riskScore}</td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{event.status}</td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{formatTime(event.timestamp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h2 className="font-display text-lg font-semibold">Analyst Timeline</h2>
      <div className="mt-4 space-y-4">
        {analystTimeline.map((item) => {
          const config = getSeverityConfig(item.severity);
          return (
            <div key={item.id} className="grid grid-cols-[14px_1fr] gap-3">
              <span className="mt-1 h-3 w-3 rounded-sm border" style={{ backgroundColor: config.cssVar, borderColor: config.cssVar }} />
              <div>
                <p className="font-mono text-xs text-muted-foreground">{item.timestamp}</p>
                <p className="mt-1 text-sm text-foreground">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OperatorConsole({ auth }: { auth: AuthContext | null }) {
  const criticalCount = anomalyEvents.filter((event) => event.severity === 'CRITICAL').length;
  const escalatedCount = anomalyEvents.filter((event) => event.status === 'ESCALATED').length;
  const exposure = anomalyEvents.reduce((sum, event) => sum + event.amount, 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <PulseRail events={anomalyEvents} />
      <div className="lg:pl-[235px]">
        <Header auth={auth} />
        <div className="space-y-4 px-4 py-4 lg:px-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile icon={AlertTriangle} label="Open anomalies" value={String(anomalyEvents.length)} detail="+03 in current window" />
            <MetricTile icon={CircleDot} label="Critical queue" value={String(criticalCount)} detail="SLA 00:07:12" />
            <MetricTile icon={Activity} label="Escalations" value={String(escalatedCount)} detail="2 assigned analysts" />
            <MetricTile icon={WalletCards} label="Exposure" value="$131.6K" detail={`RAW ${Math.round(exposure)}`} />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <TrendPanel />
            <SeverityDistribution events={anomalyEvents} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <TransactionTable events={anomalyEvents} />
            <div className="space-y-4">
              <AlertQueue events={anomalyEvents} />
              <Timeline />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
