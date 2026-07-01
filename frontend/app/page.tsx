'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Search,
  Bell,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, getAnomalySeverityColor, getAnomalyScoreSeverity } from '@anomaly/shared';

// Mock dashboard transactions list
const MOCK_ANOMALIES = [
  {
    id: 'tx_mock_1',
    merchant: 'WireTransfer Ltd',
    amount: 145000,
    currency: 'USD',
    category: 'FINANCIAL_SERVICES',
    timestamp: 'Just now',
    score: 0.94,
    reason: 'Rapid velocity wire threshold breach',
  },
  {
    id: 'tx_mock_2',
    merchant: 'Anonymous ATM',
    amount: 5000,
    currency: 'USD',
    category: 'OTHERS',
    timestamp: '2 mins ago',
    score: 0.81,
    reason: 'Geographical impossible mismatch',
  },
  {
    id: 'tx_mock_3',
    merchant: 'Global Cloud Retail',
    amount: 42.5,
    currency: 'USD',
    category: 'SHOPPING',
    timestamp: '15 mins ago',
    score: 0.45,
    reason: 'Unusual frequency categorical test',
  },
  {
    id: 'tx_mock_4',
    merchant: 'Local Gas Station',
    amount: 85,
    currency: 'USD',
    category: 'TRAVEL_AND_TRANSPORT',
    timestamp: '1 hour ago',
    score: 0.12,
    reason: 'Normal transaction signature',
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 bg-black text-white selection:bg-primary/30 selection:text-primary-foreground min-h-screen">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
              Anomalyze
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
              Active Shield
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs text-neutral-500 hidden sm:inline-block font-mono bg-neutral-900 px-3 py-1.5 rounded-md border border-white/5">
            ENV: SANDBOX_MOCK_ENV
          </div>
          <button className="relative w-8 h-8 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
          </button>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-xs">
              DS
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-white">Dev Sandbox</p>
              <p className="text-[10px] text-neutral-500">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Pitch Hero Callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Scaffolding Completed Successfully
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl">
              You are looking at the initial Next.js framework architecture layout. Next endpoints, FastAPI routers, database connections, and workspaces are ready for logic implementation.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-colors shadow-lg">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload CSV (Phase 2)</span>
            </button>
            <button className="flex items-center space-x-2 bg-neutral-900 text-white border border-white/10 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-850 transition-colors">
              <Sliders className="w-4 h-4" />
              <span>Configure Rules</span>
            </button>
          </div>
        </motion.div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Transactions Scanned',
              value: '1,245,680',
              change: '+14% this month',
              icon: Activity,
              color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            },
            {
              title: 'Anomalies Detected',
              value: '142',
              change: '23 critical alerts',
              icon: AlertTriangle,
              color: 'text-red-500 bg-red-500/10 border-red-500/20',
            },
            {
              title: 'ML System Accuracy',
              value: '99.42%',
              change: 'Model dynamic drift <0.1%',
              icon: TrendingUp,
              color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            },
            {
              title: 'Total Monitored Value',
              value: formatCurrency(14852600.5, 'USD'),
              change: 'Base ledger: Neon PostgreSQL',
              icon: DollarSign,
              color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-semibold">{item.title}</span>
                <div className={`p-2 rounded-lg border ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                <p className="text-[11px] text-neutral-500 mt-1 font-medium">{item.change}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Anomalies Feed */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Real-time Detection Feed</h3>
                <p className="text-xs text-neutral-500">Live anomalous events score indicators</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  disabled
                  className="bg-neutral-900 border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-400 placeholder:text-neutral-600 focus:outline-none w-48"
                />
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {MOCK_ANOMALIES.map((anomaly) => {
                const severity = getAnomalyScoreSeverity(anomaly.score);
                const tagColor = getAnomalySeverityColor(severity);

                return (
                  <div key={anomaly.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{anomaly.merchant}</p>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/5 text-[10px]">
                          {anomaly.category}
                        </span>
                        • {anomaly.timestamp}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono italic">
                        Reason: {anomaly.reason}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(anomaly.amount, anomaly.currency)}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium">USD Equivalent</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold shrink-0 ${tagColor}`}>
                        {(anomaly.score * 100).toFixed(0)}% Risk
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Project Status Overview */}
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <div>
              <h3 className="font-bold text-base">Workspace Architecture</h3>
              <p className="text-xs text-neutral-500">Status monitor of project boundaries</p>
            </div>

            <div className="space-y-4">
              {[
                { name: '@anomaly/frontend', tech: 'Next.js 15 App Router', status: 'Scaffolded', color: 'text-primary border-primary/20 bg-primary/10' },
                { name: '@anomaly/backend', tech: 'Express / TypeScript', status: 'Scaffolded', color: 'text-blue-500 border-blue-500/20 bg-blue-500/10' },
                { name: '@anomaly/ml-service', tech: 'FastAPI / Uvicorn', status: 'Scaffolded', color: 'text-purple-500 border-purple-500/20 bg-purple-500/10' },
                { name: '@anomaly/shared', tech: 'TypeScript Module', status: 'Shared package', color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' },
              ].map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-950 border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">{service.name}</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{service.tech}</p>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${service.color}`}>
                    {service.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Neon PostgreSQL Database</span>
              </h4>
              <p className="text-[10px] text-neutral-400">
                Prisma client generated and migrations directory established. DB URLs verified via centralized validator system.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
