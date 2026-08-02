'use client';

import React from 'react';
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  FileSpreadsheet,
  Layers,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UploadCloud,
  WalletCards,
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
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
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}

/* ──────────────────────────────────────────────────────── Interactive Hero Demo Table Component */
function HeroDemoCard() {
  const [selectedTxn, setSelectedTxn] = React.useState<'TXN-4822' | 'TXN-4824'>('TXN-4822');

  const transactions = [
    { id: 'TXN-4821', amount: '$142.50', location: 'New York', status: 'OK' as const },
    { id: 'TXN-4822', amount: '$8,940.00', location: 'Lagos → Tokyo', status: 'FLAG' as const },
    { id: 'TXN-4823', amount: '$67.30', location: 'London', status: 'OK' as const },
    { id: 'TXN-4824', amount: '$3,200.00', location: 'São Paulo', status: 'FLAG' as const },
    { id: 'TXN-4825', amount: '$28.99', location: 'Berlin', status: 'OK' as const },
  ];

  const explanations: Record<'TXN-4822' | 'TXN-4824', string> = {
    'TXN-4822': 'Card used in Tokyo 2 h after a swipe in Lagos — Impossible travel speed.',
    'TXN-4824': 'Transaction amount ($3,200) is 14x above user\'s 30-day average and originated from an unrecognized IP in São Paulo.',
  };

  return (
    <div className="relative w-full rounded-2xl border border-primary/20 bg-[#0c0e1a]/90 p-4 shadow-[0_0_50px_rgba(99,102,241,0.15)] backdrop-blur-xl transition-all duration-300 hover:border-primary/40">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-alt/70 px-3 py-0.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[11px]">outlierx.app/dashboard</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Progress Steps Header */}
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-border/60 pb-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-primary font-medium">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">✓</span>
          <span>1 Upload Data</span>
        </div>
        <div className="flex items-center gap-2 text-primary font-medium">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">✓</span>
          <span>2 AI Analysis</span>
        </div>
        <div className="flex items-center gap-2 text-primary font-semibold">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">3</span>
          <span className="text-foreground">View Results</span>
        </div>
      </div>

      {/* Summary Badge Row */}
      <div className="mt-4 flex items-center justify-between px-1">
        <span className="font-mono text-xs font-semibold text-foreground">Scan Complete</span>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400">
            2,845 OK
          </span>
          <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-400">
            2 Flagged
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-surface/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-surface-alt/50 font-mono text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="py-2.5 pl-3">ID</th>
              <th className="py-2.5">Amount</th>
              <th className="py-2.5">Location</th>
              <th className="py-2.5 pr-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono text-[12px]">
            {transactions.map((txn) => {
              const isSelected = selectedTxn === txn.id;
              const isFlag = txn.status === 'FLAG';

              return (
                <tr
                  key={txn.id}
                  onClick={() => isFlag && setSelectedTxn(txn.id as 'TXN-4822' | 'TXN-4824')}
                  className={cn(
                    'transition-colors',
                    isFlag ? 'cursor-pointer' : '',
                    isSelected
                      ? 'bg-rose-500/10 text-foreground'
                      : isFlag
                      ? 'hover:bg-rose-500/5'
                      : 'hover:bg-surface-alt/40'
                  )}
                >
                  <td className="py-2.5 pl-3 font-semibold text-foreground">{txn.id}</td>
                  <td className={cn('py-2.5 font-medium', isFlag ? 'text-rose-400' : 'text-foreground')}>
                    {txn.amount}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{txn.location}</td>
                  <td className="py-2.5 pr-3 text-right">
                    {isFlag ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                        <AlertTriangle className="h-3 w-3" /> Flag
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Flag Explanation Box */}
      <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-left transition-all">
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{selectedTxn} flagged</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          "{explanations[selectedTxn]}"
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── Landing Header */
function LandingHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform duration-200 group-hover:scale-105">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            OutlierX
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#compare" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Compare
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
            type="button"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 font-display text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:bg-primary-strong hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────── Landing Page */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      {/* ──────────────────────────────── Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background Radial Glow Effects */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, #a855f7 50%, transparent 80%)' }}
        />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Hero Text & Buttons */}
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-Powered Fraud Detection</span>
              </div>

              {/* Title */}
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-6xl lg:leading-[1.1]">
                Upload your data. <br />
                We catch the{' '}
                <span className="gradient-text">risks.</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                OutlierX scans every transaction with AI and instantly highlights suspicious activity — with plain-English explanations of <em className="not-italic font-semibold text-foreground">why</em> each one was flagged.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/sign-in"
                  className="glow-btn inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-strong px-7 font-display text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <span>Start Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface/80 px-7 font-display text-base font-semibold text-foreground backdrop-blur-md transition-all hover:bg-surface-alt"
                >
                  See How It Works
                </a>
              </div>

              {/* Sub-Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> No credit card
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> SOC 2 compliant
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-400" /> 2-min setup
                </div>
              </div>
            </div>

            {/* Right Column: Live Mockup Card */}
            <div className="lg:col-span-5">
              <HeroDemoCard />
            </div>
          </div>

          {/* Metrics Row */}
          <div className="mt-20 grid grid-cols-2 gap-6 rounded-2xl border border-border/80 bg-surface/50 p-6 backdrop-blur-md lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">99.8%</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Detection Accuracy</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Brain className="h-5 w-5" />
              </div>
              <p className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">11</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Risk Signals / Row</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-center gap-2 text-sky-400 mb-1">
                <Clock className="h-5 w-5" />
              </div>
              <p className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">50ms</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Avg Response Time</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Zap className="h-5 w-5" />
              </div>
              <p className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">10,000+</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">TXN / sec Throughput</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── Traditional vs OutlierX */}
      <section id="compare" className="relative border-t border-border/60 py-20 bg-surface/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Traditional detection vs OutlierX
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              See why teams are switching from rule-based systems.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {/* Traditional Card */}
            <div className="relative rounded-2xl border border-rose-500/20 bg-[#0e0f18] p-8 shadow-lg transition-all hover:border-rose-500/40">
              <div className="flex items-center gap-3 border-b border-border/80 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Traditional Approach</h3>
              </div>

              <ul className="mt-6 space-y-4 text-sm font-medium text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs text-rose-400">✕</span>
                  <span>Manual rule-based detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs text-rose-400">✕</span>
                  <span>Days to identify fraud patterns</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs text-rose-400">✕</span>
                  <span>High false-positive rate (30%+)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs text-rose-400">✕</span>
                  <span>No explanations for flags</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs text-rose-400">✕</span>
                  <span>Batch processing only</span>
                </li>
              </ul>
            </div>

            {/* OutlierX Card */}
            <div className="relative rounded-2xl border border-emerald-500/40 bg-[#0d121c] p-8 card-glow-green transition-all hover:border-emerald-500/60">
              <div className="absolute top-6 right-6">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  RECOMMENDED
                </span>
              </div>

              <div className="flex items-center gap-3 border-b border-border/80 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">With OutlierX</h3>
              </div>

              <ul className="mt-6 space-y-4 text-sm font-medium text-foreground">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                  <span>AI-powered pattern recognition</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                  <span>Real-time instant detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                  <span>Personalized models that adapt to your data</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                  <span>Plain-English explanations</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                  <span>Batch + real-time streaming</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── Architecture & Features */}
      <section id="features" className="relative border-t border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
              <Layers className="h-3.5 w-3.5" />
              <span>Event-Driven Microservices</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Platform Architecture & Intelligence
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Built from the ground up for microsecond ingestion, hybrid ML models, and zero false positives.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-primary/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">Ingestion Service</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                High-throughput CSV upload processor with automatic schema verification, rate limiting, and instant row validation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-purple-500/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">ML & Rules Engine</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Combines Isolation Forest anomaly models with custom deterministic rules to generate instant, plain-English explanations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-sky-500/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">Analytics Service</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Real-time dashboard metrics, anomaly distribution charts, and velocity trend analysis across your financial pipelines.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-emerald-500/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">Auth & Access Service</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Enterprise user management with Clerk authentication, role-based access control, and organization isolation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-amber-500/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">Instant Alerts</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Automated webhook, email, and SMS notifications emitted instantly whenever high-severity fraudulent behavior is detected.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 transition-all hover:border-rose-500/40 hover:bg-surface-alt/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">Interactive Playground</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Test custom fraud rules against real transaction samples with live feedback and instant rule evaluation results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-display font-bold text-foreground">OutlierX</span>
            <span>© 2026 OutlierX Fraud Detection Platform</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>SOC 2 Type II</span>
            <span>ISO 27001</span>
            <span>GDPR Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── Stat Card (Signed In) */
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
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    danger: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  }[accent ?? 'primary'];

  const card = (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-alt">
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle at 50% 0, rgba(99,102,241,0.08), transparent 70%)' }}
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

/* ──────────────────────────────────────────────────────── Quick-action card (Signed In) */
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
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-alt"
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

/* ──────────────────────────────────────────────────────── Upload badge (Signed In) */
function UploadBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    PROCESSING: 'text-primary border-primary/30 bg-primary/10',
    FAILED: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    PENDING: 'text-muted-foreground border-border bg-surface-alt',
  };
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase', map[status] ?? map.PENDING)}>
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────────────────── Main content (Signed In) */
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
      <div className="mb-6 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-primary">
              {org?.subscriptionPlan ?? 'FREE'} plan · {org?.subscriptionStatus ?? 'ACTIVE'}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              Welcome back to OutlierX 👋
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI financial anomaly detection workspace is active and monitoring live streams.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-medium text-emerald-400">AI Engine Running</span>
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
              accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            />
            <QuickAction
              label="Manage Rules"
              desc="Configure deterministic fraud rules"
              icon={Zap}
              href="/rules"
              accent="border-amber-500/20 bg-amber-500/10 text-amber-400"
            />
            <QuickAction
              label="Rule Playground"
              desc="Test rules against sample transactions"
              icon={TrendingUp}
              href="/rules/playground"
              accent="border-purple-500/20 bg-purple-500/10 text-purple-400"
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
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong"
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
          { label: 'Rule Engine', status: 'Operational', icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'ML Service', status: 'Active (Isolation Forest)', icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'Storage', status: 'Healthy', icon: CheckCircle2, cls: 'text-emerald-400' },
          { label: 'API Gateway', status: 'Operational', icon: CheckCircle2, cls: 'text-emerald-400' },
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

/* ──────────────────────────────────────────────────────── Page Router Component */
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
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <SignedInOverview />
      </SignedIn>
    </>
  );
}
