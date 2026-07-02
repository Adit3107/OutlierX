'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  WalletCards,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '../components/app-shell';
import { useAuthData } from '../providers/auth-provider';
import { createApiClient } from '../lib/api-client';
import type { AuthContext, PaginatedResponse, Upload } from '@anomaly/shared';

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(' ');
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = value / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}

/* ──────────────────────────────────────────────────────── Stat Card */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: 'primary' | 'warning' | 'success' | 'danger';
  href?: string;
}) {
  const accentClass = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    warning: 'text-severity-medium bg-severity-medium/10 border-severity-medium/20',
    success: 'text-severity-low bg-severity-low/10 border-severity-low/20',
    danger: 'text-severity-critical bg-severity-critical/10 border-severity-critical/20',
  }[accent ?? 'primary'];

  const card = (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/30 hover:bg-surface-alt">
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle at 50% 0, hsl(var(--primary)/0.06), transparent 70%)' }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', accentClass)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        )}
      </div>
      <div className="relative mt-4">
        <p className="font-mono text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

/* ──────────────────────────────────────────────────────── Quick-action card */
function QuickAction({
  label,
  desc,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  desc: string;
  icon: React.ElementType;
  href: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-primary/30 hover:bg-surface-alt"
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', accent ?? 'border-primary/20 bg-primary/10 text-primary')}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
    </Link>
  );
}

/* ──────────────────────────────────────────────────────── Upload status badge */
function UploadBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'text-severity-low border-severity-low/30 bg-severity-low/10',
    PROCESSING: 'text-primary border-primary/30 bg-primary/10',
    FAILED: 'text-severity-critical border-severity-critical/30 bg-severity-critical/10',
    PENDING: 'text-muted-foreground border-border bg-surface-alt',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase', map[status] ?? map.PENDING)}>
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────────────────── Main content */
function OverviewContent({ auth }: { auth: AuthContext | null }) {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);

  const uploadsQuery = useQuery({
    queryKey: ['uploads-overview'],
    queryFn: async () => {
      const res = await client.get<{ data: PaginatedResponse<Upload> }>('/uploads', {
        params: { page: 1, limit: 50 },
      });
      return res.data.data;
    },
  });

  const uploads = uploadsQuery.data?.items ?? [];
  const totalUploads = uploads.length;
  const completedUploads = uploads.filter((u) => u.status === 'COMPLETED').length;
  const failedUploads = uploads.filter((u) => u.status === 'FAILED').length;
  const totalTransactions = uploads.reduce((sum, u) => sum + (u.processedRows ?? 0), 0);
  const totalFailed = uploads.reduce((sum, u) => sum + (u.failedRows ?? 0), 0);
  const recentUploads = uploads.slice(0, 6);

  const org = auth?.organization;

  return (
    <AppShell title="Overview" breadcrumb="OPS / OVERVIEW">
      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase text-primary">
              {org?.subscriptionPlan ?? 'FREE'} plan · {org?.subscriptionStatus ?? 'ACTIVE'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              Welcome back to {org?.name ?? 'OutlierX'} 👋
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your financial anomaly detection workspace is active and monitoring.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono text-xs font-medium text-primary">Engine Running</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Uploads"
          value={totalUploads}
          sub={`${completedUploads} completed`}
          icon={UploadCloud}
          accent="primary"
          href="/data-sources"
        />
        <StatCard
          label="Transactions Ingested"
          value={totalTransactions.toLocaleString()}
          sub="Across all uploads"
          icon={WalletCards}
          accent="success"
          href="/transactions"
        />
        <StatCard
          label="Failed Rows"
          value={totalFailed}
          sub="Parse or validation errors"
          icon={AlertTriangle}
          accent="warning"
        />
        <StatCard
          label="Failed Uploads"
          value={failedUploads}
          sub={`${totalUploads > 0 ? Math.round((failedUploads / totalUploads) * 100) : 0}% failure rate`}
          icon={Activity}
          accent={failedUploads > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Quick actions + recent uploads */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Quick actions */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction
              label="Upload Transactions"
              desc="Ingest a new CSV file for analysis"
              icon={UploadCloud}
              href="/data-sources"
              accent="border-primary/20 bg-primary/10 text-primary"
            />
            <QuickAction
              label="Browse Transactions"
              desc="Explore and filter all stored records"
              icon={WalletCards}
              href="/transactions"
              accent="border-severity-low/20 bg-severity-low/10 text-severity-low"
            />
            <QuickAction
              label="Manage Rules"
              desc="Configure deterministic fraud rules"
              icon={Zap}
              href="/rules"
              accent="border-severity-medium/20 bg-severity-medium/10 text-severity-medium"
            />
            <QuickAction
              label="Rule Playground"
              desc="Test rules against sample transactions"
              icon={TrendingUp}
              href="/rules/playground"
              accent="border-primary/20 bg-primary/5 text-primary"
            />
          </div>
        </div>

        {/* Recent uploads */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Uploads</h2>
            <Link
              href="/data-sources"
              className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {uploadsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No uploads yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Upload a CSV to get started</p>
                <Link
                  href="/data-sources"
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary-strong px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-strong/90"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload CSV
                </Link>
              </div>
            ) : (
              <div>
                {recentUploads.map((upload, i) => (
                  <div
                    key={upload.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-alt',
                      i < recentUploads.length - 1 && 'border-b border-border/70'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-alt">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-medium text-foreground">
                          {upload.originalFilename}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {upload.processedRows?.toLocaleString()} rows · {formatBytes(upload.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <UploadBadge status={upload.status} />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatDate(upload.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System status bar */}
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: 'Rule Engine', status: 'Operational', icon: CheckCircle2, cls: 'text-severity-low' },
          { label: 'ML Service', status: 'Standby', icon: Clock, cls: 'text-muted-foreground' },
          { label: 'Storage', status: 'Healthy', icon: CheckCircle2, cls: 'text-severity-low' },
          { label: 'API', status: 'Operational', icon: CheckCircle2, cls: 'text-severity-low' },
        ].map(({ label, status, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
            <Icon className={cn('h-3.5 w-3.5', cls)} />
            <span className="text-xs font-medium text-foreground">{label}</span>
            <span className={cn('font-mono text-[10px]', cls)}>{status}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

/* ──────────────────────────────────────────────────────── Sign-out landing */
function SignedOutLanding() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">OutlierX</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Fraud analysis console</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Authenticate to access the financial anomaly monitoring workspace.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">SESSION</span>
            <span className="text-severity-medium">LOCKED</span>
          </div>
        </div>
        <SignInButton mode="modal">
          <button
            className="mt-4 h-10 w-full rounded-lg bg-primary-strong px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong/90"
            type="button"
          >
            Sign in to OutlierX
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

/* ──────────────────────────────────────────────────────── Page */
function SignedInOverview() {
  const { auth } = useAuthData();
  return <OverviewContent auth={auth} />;
}

export default function HomePage() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('__clerk_status') || window.location.search.includes('_clerk') || window.location.search.includes('clerk')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <>
      <SignedOut>
        <SignedOutLanding />
      </SignedOut>
      <SignedIn>
        <SignedInOverview />
      </SignedIn>
    </>
  );
}
