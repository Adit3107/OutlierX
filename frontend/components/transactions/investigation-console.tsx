'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  ExternalLink,
  Filter,
  GitBranch,
  Sparkles,
  Moon,
  PanelRightClose,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Tags,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import type { AxiosInstance } from 'axios';
import type { ApiDate, AuthContext, Decision, DecisionRecommendation, PaginatedResponse, Transaction } from '@anomaly/shared';
import { PERMISSIONS, SUPPORTED_CURRENCIES } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { useAuthData } from '../../providers/auth-provider';
import { usePagination } from '../../hooks/transactions/use-pagination';
import {
  TransactionFiltersState,
  TransactionSortBy,
  useTransactionFilters,
} from '../../hooks/transactions/use-transaction-filters';
import { useTransaction, useTransactionDecision, useTransactions } from '../../hooks/transactions/use-transactions';
import { getSeverityConfig } from '../../constants/severity';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value?: ApiDate | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value));
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: 'currency',
  }).format(value);
}

function sourceRow(transaction?: Transaction | null) {
  const value = transaction?.metadata?.sourceRow;
  return typeof value === 'number' || typeof value === 'string' ? String(value) : '-';
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-border bg-surface-alt px-2 font-mono text-[11px] uppercase text-muted-foreground">
      {status}
    </span>
  );
}

export function AmountCell({ amount, currency }: { amount: number; currency: string }) {
  return (
    <span className="block text-right font-mono text-xs tabular-nums text-foreground">
      {formatCurrency(amount, currency)}
    </span>
  );
}

export function CountryCell({ country, city }: { country?: string | null; city?: string | null }) {
  return (
    <span className="block max-w-[150px] truncate text-sm text-muted-foreground">
      {[city, country].filter(Boolean).join(', ') || '-'}
    </span>
  );
}

export function FilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-border bg-surface-alt px-2 font-mono text-[11px] text-muted-foreground">
      <span className="truncate">
        {label}: <span className="text-foreground">{value}</span>
      </span>
      <button aria-label={`Clear ${label}`} className="text-muted-foreground hover:text-foreground" onClick={onClear} type="button">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function TransactionSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        aria-label="Search transactions"
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search transaction, merchant, reference, customer, account, location"
        value={value}
      />
    </label>
  );
}

export function TransactionFilters({
  filters,
  setFilter,
  clearFilter,
  clearAll,
}: {
  filters: TransactionFiltersState;
  setFilter: <Key extends keyof TransactionFiltersState>(key: Key, value: TransactionFiltersState[Key]) => void;
  clearFilter: (key: keyof TransactionFiltersState) => void;
  clearAll: () => void;
}) {
  const activeFilters = [
    ['startDate', 'From', filters.startDate],
    ['endDate', 'To', filters.endDate],
    ['country', 'Country', filters.country],
    ['merchant', 'Merchant', filters.merchant],
    ['merchantCategory', 'Category', filters.merchantCategory],
    ['paymentMethod', 'Method', filters.paymentMethod],
    ['currency', 'Currency', filters.currency],
    ['minAmount', 'Min', filters.minAmount],
    ['maxAmount', 'Max', filters.maxAmount],
    ['status', 'Status', filters.status],
    ['uploadId', 'Upload', filters.uploadId],
  ] as Array<[keyof TransactionFiltersState, string, string]>;
  const visibleFilters = activeFilters.filter(([, , value]) => value);

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-base font-semibold">Filters</h2>
        </div>
        <button className="h-8 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground" onClick={clearAll} type="button">
          Clear all
        </button>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" onChange={(event) => setFilter('startDate', event.target.value)} type="datetime-local" value={filters.startDate} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" onChange={(event) => setFilter('endDate', event.target.value)} type="datetime-local" value={filters.endDate} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" onChange={(event) => setFilter('country', event.target.value)} placeholder="Country" value={filters.country} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" onChange={(event) => setFilter('merchant', event.target.value)} placeholder="Merchant" value={filters.merchant} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" onChange={(event) => setFilter('merchantCategory', event.target.value)} placeholder="Category" value={filters.merchantCategory} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" onChange={(event) => setFilter('paymentMethod', event.target.value)} placeholder="Payment method" value={filters.paymentMethod} />
        <select className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" onChange={(event) => setFilter('currency', event.target.value)} value={filters.currency}>
          <option value="">Currency</option>
          {SUPPORTED_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
        </select>
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" min="0" onChange={(event) => setFilter('minAmount', event.target.value)} placeholder="Min amount" type="number" value={filters.minAmount} />
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground" min="0" onChange={(event) => setFilter('maxAmount', event.target.value)} placeholder="Max amount" type="number" value={filters.maxAmount} />
        <select className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none" onChange={(event) => setFilter('status', event.target.value)} value={filters.status}>
          <option value="">Status</option>
          <option value="IMPORTED">IMPORTED</option>
        </select>
        <input className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground md:col-span-2 xl:col-span-5" onChange={(event) => setFilter('uploadId', event.target.value)} placeholder="Upload source ID" value={filters.uploadId} />
      </div>
      {visibleFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {visibleFilters.map(([key, label, value]) => (
            <FilterChip key={key} label={label} value={value} onClear={() => clearFilter(key)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PaginationControls({
  data,
  page,
  limit,
  setPage,
  setLimit,
  isFetching,
}: {
  data?: PaginatedResponse<Transaction>;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  isFetching: boolean;
}) {
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 font-mono text-xs text-muted-foreground">
      <span>{data ? `${data.total} records` : '0 records'}{isFetching ? ' / loading' : ''}</span>
      <div className="flex items-center gap-2">
        <select className="h-8 rounded-md border border-border bg-surface-alt px-2 text-xs outline-none" onChange={(event) => setLimit(Number(event.target.value))} value={limit}>
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <button aria-label="First page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(1)} type="button">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} type="button">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <input aria-label="Jump to page" className="h-8 w-14 rounded-md border border-border bg-surface-alt px-2 text-center outline-none" min="1" max={totalPages} onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} type="number" value={page} />
        <span>/ {totalPages}</span>
        <button aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))} type="button">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button aria-label="Last page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(totalPages)} type="button">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function BulkActionsBar({
  selectedCount,
  canDelete,
  onExport,
  onDelete,
  onPlaceholder,
}: {
  selectedCount: number;
  canDelete: boolean;
  onExport: () => void;
  onDelete: () => void;
  onPlaceholder: (action: string) => void;
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-alt px-3 py-2">
      <span className="font-mono text-xs text-foreground">{selectedCount} selected</span>
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground hover:bg-surface" onClick={onExport} type="button">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => onPlaceholder('Bulk tag')} type="button">
          <Tags className="h-3.5 w-3.5" /> Tag
        </button>
        <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => onPlaceholder('Mark reviewed')} type="button">
          <RefreshCw className="h-3.5 w-3.5" /> Reviewed
        </button>
        {canDelete ? (
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground hover:bg-background" onClick={onDelete} type="button">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TransactionRow({
  transaction,
  selected,
  onToggle,
  onOpen,
}: {
  transaction: Transaction;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <tr className={cn('h-10 border-b border-border/70 transition-colors hover:bg-surface-alt/65', selected && 'bg-surface-alt')} onClick={onOpen}>
      <td className="w-10 px-3" onClick={(event) => event.stopPropagation()}>
        <input aria-label={`Select ${transaction.transactionId}`} checked={selected} className="h-4 w-4 rounded border-border bg-background" onChange={onToggle} type="checkbox" />
      </td>
      <td className="max-w-[190px] truncate px-3 font-mono text-xs text-foreground">{transaction.transactionId}</td>
      <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</td>
      <td className="max-w-[180px] truncate px-3 text-sm text-foreground">{transaction.merchant}</td>
      <td className="max-w-[150px] truncate px-3 text-sm text-muted-foreground">{transaction.merchantCategory ?? '-'}</td>
      <td className="px-3"><CountryCell city={transaction.city} country={transaction.country} /></td>
      <td className="max-w-[135px] truncate px-3 text-sm text-muted-foreground">{transaction.paymentMethod ?? '-'}</td>
      <td className="px-3"><AmountCell amount={transaction.amount} currency={transaction.currency} /></td>
      <td className="px-3 font-mono text-xs text-muted-foreground">{transaction.currency}</td>
      <td className="max-w-[170px] truncate px-3 font-mono text-xs text-muted-foreground">{transaction.upload?.originalFilename ?? '-'}</td>
      <td className="px-3"><StatusBadge status={transaction.status} /></td>
      <td className="px-3 text-right" onClick={(event) => event.stopPropagation()}>
        <Link aria-label="Open transaction details" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground" href={`/transactions/${transaction.id}`}>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

function SortButton({
  label,
  field,
  filters,
  setFilter,
}: {
  label: string;
  field: TransactionSortBy;
  filters: TransactionFiltersState;
  setFilter: <Key extends keyof TransactionFiltersState>(key: Key, value: TransactionFiltersState[Key]) => void;
}) {
  const active = filters.sortBy === field;
  const Icon = filters.sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button className="inline-flex items-center gap-1 font-medium" onClick={() => {
      if (active) {
        setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setFilter('sortBy', field);
        setFilter('sortOrder', 'asc');
      }
    }} type="button">
      {label}
      {active ? <Icon className="h-3 w-3" /> : null}
    </button>
  );
}

export function TransactionTable({
  data,
  filters,
  setFilter,
  selectedIds,
  setSelectedIds,
  onOpen,
  isLoading,
}: {
  data?: PaginatedResponse<Transaction>;
  filters: TransactionFiltersState;
  setFilter: <Key extends keyof TransactionFiltersState>(key: Key, value: TransactionFiltersState[Key]) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpen: (transaction: Transaction) => void;
  isLoading: boolean;
}) {
  const transactions = data?.items ?? [];
  const allSelected = transactions.length > 0 && transactions.every((transaction) => selectedIds.includes(transaction.id));

  if (isLoading && !data) {
    return (
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-md bg-surface-alt" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] border-collapse text-left text-sm" role="grid">
          <thead className="sticky top-0 z-10 bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="w-10 px-3">
                <input aria-label="Select current page" checked={allSelected} className="h-4 w-4 rounded border-border bg-background" onChange={() => {
                  const pageIds = transactions.map((transaction) => transaction.id);
                  setSelectedIds((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])));
                }} type="checkbox" />
              </th>
              <th className="resize-x overflow-hidden px-3 font-medium"><SortButton field="transactionId" filters={filters} label="Transaction ID" setFilter={setFilter} /></th>
              <th className="resize-x overflow-hidden px-3 font-medium"><SortButton field="timestamp" filters={filters} label="Timestamp" setFilter={setFilter} /></th>
              <th className="resize-x overflow-hidden px-3 font-medium"><SortButton field="merchant" filters={filters} label="Merchant" setFilter={setFilter} /></th>
              <th className="resize-x overflow-hidden px-3 font-medium">Category</th>
              <th className="resize-x overflow-hidden px-3 font-medium"><SortButton field="country" filters={filters} label="Location" setFilter={setFilter} /></th>
              <th className="resize-x overflow-hidden px-3 font-medium">Payment Method</th>
              <th className="resize-x overflow-hidden px-3 text-right font-medium"><SortButton field="amount" filters={filters} label="Amount" setFilter={setFilter} /></th>
              <th className="px-3 font-medium">Currency</th>
              <th className="resize-x overflow-hidden px-3 font-medium">Upload Source</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                onOpen={() => onOpen(transaction)}
                onToggle={() => setSelectedIds((current) => current.includes(transaction.id) ? current.filter((id) => id !== transaction.id) : [...current, transaction.id])}
                selected={selectedIds.includes(transaction.id)}
                transaction={transaction}
              />
            ))}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="font-display text-lg font-semibold">No transactions found.</p>
          <p className="mt-1 text-sm text-muted-foreground">{filters.search ? 'No results match your filters.' : 'Upload transaction data to begin investigation.'}</p>
        </div>
      ) : null}
    </section>
  );
}

function InfoField({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface-alt p-3">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <div className={cn('mt-1 min-h-5 truncate text-sm text-foreground', mono && 'font-mono text-xs')}>{value ?? '-'}</div>
    </div>
  );
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(value);
}

export function AiAnalysisCard({ transaction }: { transaction: Transaction }) {
  const prediction = transaction.mlPrediction;

  return (
    <section className="rounded-md border border-accent/35 bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="font-display text-base font-semibold">AI Analysis</h2>
      </div>
      {prediction ? (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          <InfoField label="ML Prediction" mono value={prediction.mlPrediction} />
          <InfoField label="Confidence" mono value={formatPercent(prediction.confidence)} />
          <InfoField label="Model Version" mono value={prediction.modelVersion} />
          <InfoField label="Inference Time" mono value={`${prediction.processingTime} ms`} />
          <InfoField label="Processed At" mono value={formatDate(prediction.processedAt)} />
        </div>
      ) : (
        <div className="p-4 text-sm text-muted-foreground">
          ML prediction has not been processed for this transaction yet.
        </div>
      )}
    </section>
  );
}

function formatScore(value?: number | null) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function recommendationLabel(value: DecisionRecommendation) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const severity = getSeverityConfig(decision.riskLevel);
  return (
    <span className={cn('inline-flex h-7 items-center rounded-md border px-2 font-mono text-xs uppercase', severity.borderClassName, severity.bgClassName, severity.className)}>
      {severity.label}
    </span>
  );
}

function DecisionTimeline({ decision }: { decision: Decision }) {
  const severity = getSeverityConfig(decision.riskLevel);
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {decision.explanation.timeline.map((item, index) => (
        <div key={`${item.label}-${index}`} className={cn('rounded-md border bg-surface-alt p-3', index === 2 ? severity.borderClassName : 'border-border')}>
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', index === 2 ? severity.bgClassName.replace('/15', '') : 'bg-muted-foreground')} />
            <p className="text-xs font-medium text-foreground">{item.label}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">{formatDate(item.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}

function DecisionDetailsSection({ decision }: { decision: Decision }) {
  const [open, setOpen] = React.useState(false);
  const explanation = decision.explanation;

  return (
    <section className="rounded-md border border-border bg-surface">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen((current) => !current)} type="button">
        <span className="font-display text-base font-semibold">Decision Details</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-border p-4 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Rule Breakdown</p>
            <p className="mt-2 font-mono text-xs">Score {formatScore(explanation.ruleBreakdown.score)} / {explanation.ruleBreakdown.riskLevel ?? '-'}</p>
            <div className="mt-2 space-y-2">
              {explanation.ruleBreakdown.triggeredRules.length > 0 ? explanation.ruleBreakdown.triggeredRules.map((rule) => (
                <p key={`${rule.ruleId}-${rule.ruleName}`} className="text-xs text-muted-foreground">{rule.ruleName}: {rule.explanation}</p>
              )) : <p className="text-xs text-muted-foreground">No triggered rules were included in this decision.</p>}
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-[11px] uppercase text-muted-foreground">ML Breakdown</p>
            <p className="mt-2 font-mono text-xs">{explanation.mlBreakdown.prediction} / score {formatScore(explanation.mlBreakdown.score)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Model {explanation.mlBreakdown.modelVersion ?? '-'} completed in {explanation.mlBreakdown.processingTime ?? 0} ms.</p>
          </div>
          <div className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Weight Calculations</p>
            <div className="mt-2 space-y-1 font-mono text-xs">
              {explanation.weights.map((weight) => (
                <p key={weight.name}>{weight.label}: {formatScore(weight.score)} x {weight.weight} = {formatScore(weight.weightedScore)}</p>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Thresholds and Version</p>
            <p className="mt-2 font-mono text-xs">Version {decision.decisionVersion}</p>
            <p className="mt-1 font-mono text-xs">Processing {explanation.processingTime} ms</p>
            <p className="mt-2 text-xs text-muted-foreground">LOW 0-39.99 / MEDIUM 40-69.99 / HIGH 70-89.99 / CRITICAL 90-100</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DecisionSummaryCard({
  transaction,
  client,
}: {
  transaction: Transaction;
  client?: AxiosInstance;
}) {
  const query = useTransactionDecision(client, transaction.id);
  const decision = query.data?.latest ?? null;

  if (query.isLoading) {
    return <section className="h-52 animate-pulse rounded-md border border-border bg-surface" />;
  }

  if (query.error || !decision) {
    return (
      <section className="rounded-md border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-base font-semibold">Decision Summary</h2>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          No persisted decision is available for this transaction yet.
        </div>
      </section>
    );
  }

  const severity = getSeverityConfig(decision.riskLevel);

  return (
    <div className="space-y-3">
      <section className={cn('rounded-md border bg-surface', severity.borderClassName)}>
        <div className={cn('border-b px-4 py-3', severity.borderClassName, severity.bgClassName)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className={cn('h-4 w-4', severity.className)} />
              <h2 className="font-display text-base font-semibold">Decision Summary</h2>
            </div>
            <DecisionBadge decision={decision} />
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoField label="Final Score" mono value={formatScore(decision.finalScore)} />
          <InfoField label="Confidence" mono value={`${formatScore(decision.confidence)}%`} />
          <InfoField label="Recommendation" mono value={recommendationLabel(decision.recommendation)} />
          <InfoField label="Decision Time" mono value={formatDate(decision.processedAt)} />
          <InfoField label="Strategy" mono value={decision.decisionStrategy} />
          <InfoField label="Rule Score" mono value={formatScore(decision.ruleScore)} />
          <InfoField label="ML Score" mono value={formatScore(decision.mlScore)} />
          <InfoField label="Triggered Rules" mono value={decision.explanation.ruleBreakdown.triggeredRules.length} />
        </div>
        <div className="border-t border-border p-4">
          <p className="text-sm text-foreground">{decision.explanation.summary}</p>
          <div className="mt-3 grid gap-2">
            {decision.explanation.reasons.map((reason, index) => (
              <p key={`${reason}-${index}`} className="text-sm text-muted-foreground">{reason}</p>
            ))}
          </div>
          <p className="mt-3 text-sm text-foreground">{decision.explanation.recommendationReason}</p>
        </div>
        <div className="border-t border-border p-4">
          <DecisionTimeline decision={decision} />
        </div>
      </section>
      <DecisionDetailsSection decision={decision} />
    </div>
  );
}

export function MetadataViewer({ value }: { value?: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = React.useState(true);
  const json = JSON.stringify(value ?? {}, null, 2);

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-base font-semibold">Metadata</h2>
        <div className="flex gap-2">
          <button className="flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => void navigator.clipboard.writeText(json).then(() => toast.success('Metadata copied'))} type="button">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <button className="h-8 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpanded((current) => !current)} type="button">
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      {expanded ? (
        <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground">
          <code>{json}</code>
        </pre>
      ) : null}
    </section>
  );
}

export function TransactionDetails({
  transaction,
  client,
}: {
  transaction: Transaction;
  client?: AxiosInstance;
}) {
  const uploadedBy = transaction.upload?.uploadedBy;
  const uploadedByLabel = uploadedBy ? `${uploadedBy.firstName ?? ''} ${uploadedBy.lastName ?? ''}`.trim() || uploadedBy.email : '-';

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase text-muted-foreground">Transaction</p>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold">{transaction.merchant}</h1>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{transaction.transactionId}</p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoField label="Internal ID" mono value={transaction.id} />
        <InfoField label="Timestamp" mono value={formatDate(transaction.timestamp)} />
        <InfoField label="Created Date" mono value={formatDate(transaction.createdAt)} />
        <InfoField label="Amount" mono value={formatCurrency(transaction.amount, transaction.currency)} />
        <InfoField label="Currency" mono value={transaction.currency} />
        <InfoField label="Payment Method" value={transaction.paymentMethod} />
        <InfoField label="Merchant" value={transaction.merchant} />
        <InfoField label="Category" value={transaction.merchantCategory} />
        <InfoField label="Description" value={transaction.description} />
        <InfoField label="Country" value={transaction.country} />
        <InfoField label="City" value={transaction.city} />
        <InfoField label="Customer ID" mono value={transaction.customerId} />
        <InfoField label="Account Number" mono value={transaction.accountNumber} />
        <InfoField label="Reference Number" mono value={transaction.referenceNumber} />
        <InfoField label="Upload Filename" mono value={transaction.upload?.originalFilename} />
        <InfoField label="Upload Time" mono value={formatDate(transaction.upload?.createdAt)} />
        <InfoField label="Uploaded By" value={uploadedByLabel} />
        <InfoField label="Organization" value={transaction.upload?.organization?.name} />
        <InfoField label="CSV Row" mono value={sourceRow(transaction)} />
      </section>
      <DecisionSummaryCard client={client} transaction={transaction} />
      <AiAnalysisCard transaction={transaction} />
      <MetadataViewer value={transaction.metadata} />
    </div>
  );
}

export function TransactionDrawer({
  transactionId,
  client,
  onClose,
}: {
  transactionId: string | null;
  client: AxiosInstance;
  onClose: () => void;
}) {
  const query = useTransaction(client, transactionId ?? '');

  if (!transactionId) {
    return null;
  }

  return (
    <aside aria-label="Transaction details" className="fixed inset-y-0 right-0 z-50 hidden w-full max-w-xl border-l border-border bg-background shadow-2xl lg:block">
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <h2 className="font-display text-lg font-semibold">Transaction Details</h2>
        <button aria-label="Close details" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        {query.isLoading ? <div className="h-40 animate-pulse rounded-md bg-surface" /> : null}
        {query.error ? <p className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">Unable to load this transaction.</p> : null}
        {query.data ? <TransactionDetails client={client} transaction={query.data} /> : null}
      </div>
    </aside>
  );
}

export function ExportDialog({
  open,
  selectedCount,
  onClose,
  onExport,
}: {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onExport: (scope: 'page' | 'filtered' | 'selected', format: 'csv' | 'json') => void;
}) {
  const [scope, setScope] = React.useState<'page' | 'filtered' | 'selected'>('filtered');
  const [format, setFormat] = React.useState<'csv' | 'json'>('csv');

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/75 px-4">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Export Transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Download investigation records.</p>
          </div>
          <button aria-label="Close export dialog" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setScope(event.target.value as 'page' | 'filtered' | 'selected')} value={scope}>
            <option value="filtered">Filtered results</option>
            <option value="page">Current page</option>
            <option disabled={selectedCount === 0} value="selected">Selected rows ({selectedCount})</option>
          </select>
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setFormat(event.target.value as 'csv' | 'json')} value={format}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="h-9 rounded-md border border-border px-3 text-sm text-foreground" onClick={onClose} type="button">Cancel</button>
          <button className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground" onClick={() => onExport(scope, format)} type="button">Export</button>
        </div>
      </section>
    </div>
  );
}

export function TransactionToolbar({
  filters,
  setFilter,
  onRefresh,
  onExport,
}: {
  filters: TransactionFiltersState;
  setFilter: <Key extends keyof TransactionFiltersState>(key: Key, value: TransactionFiltersState[Key]) => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TransactionSearch value={filters.search} onChange={(value) => setFilter('search', value)} />
      <button aria-label="Refresh transactions" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={onRefresh} type="button">
        <RefreshCw className="h-4 w-4" />
      </button>
      <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-alt" onClick={onExport} type="button">
        <Download className="h-4 w-4" /> Export
      </button>
    </div>
  );
}

function InvestigationHeader({ auth }: { auth: AuthContext | null }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">OPS / TRANSACTIONS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{auth?.organization.name ?? 'Secure workspace'}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-none">Transaction Investigation</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link className="hidden h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex" href="/">
            Data Sources
          </Link>
          <button aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={() => setTheme(isLight ? 'dark' : 'light')} type="button">
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

function InvestigationSidebar() {
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
        <Link className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground" href="/">
          <RefreshCw className="h-4 w-4" /> Data Sources
        </Link>
        <Link className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-alt px-2 text-sm text-foreground" href="/transactions">
          <WalletCards className="h-4 w-4 text-primary" /> Transactions
        </Link>
        <Link className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground" href="/rules">
          <GitBranch className="h-4 w-4" /> Rules
        </Link>
      </nav>
    </aside>
  );
}

export function TransactionInvestigationConsole() {
  const { getToken } = useAuth();
  const { auth, hasPermission } = useAuthData();
  const queryClient = useQueryClient();
  const router = useRouter();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const pagination = usePagination(25);
  const filterState = useTransactionFilters();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);

  const transactionsQuery = useTransactions(client, {
    page: pagination.page,
    limit: pagination.limit,
    filters: filterState.queryParams,
  });
  const canDelete = hasPermission(PERMISSIONS.TRANSACTIONS_DELETE);

  React.useEffect(() => {
    pagination.resetPage();
    setSelectedIds([]);
  }, [filterState.queryParams, pagination.resetPage]);

  const exportMutation = useMutation({
    mutationFn: async (input: { scope: 'page' | 'filtered' | 'selected'; format: 'csv' | 'json' }) => {
      const response = await client.get<string>('/transactions/export', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...filterState.queryParams,
          ids: selectedIds.join(',') || undefined,
          scope: input.scope,
          format: input.format,
        },
        responseType: 'text',
      });
      return { body: response.data, format: input.format };
    },
    onSuccess: ({ body, format }) => {
      downloadText(`transactions.${format}`, body, format === 'json' ? 'application/json' : 'text/csv');
      toast.success('Transactions exported');
      setExportOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Export failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const response = await client.delete<{ data: { count: number } }>('/transactions', {
        data: { ids: selectedIds },
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.count} transactions deleted`);
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (action: 'TAG' | 'MARK_REVIEWED') => {
      const response = await client.post<{ data: { status: string; count: number } }>('/transactions/bulk-actions', {
        ids: selectedIds,
        action,
      });
      return response.data.data;
    },
    onSuccess: (data) => toast.info(`${data.count} transactions queued as a placeholder workflow`),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Bulk action failed'),
  });

  const openTransaction = (transaction: Transaction) => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      router.push(`/transactions/${transaction.id}`);
      return;
    }
    setDrawerId(transaction.id);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <InvestigationSidebar />
      <div className="lg:pl-56">
        <InvestigationHeader auth={auth} />
        <div className="space-y-4 px-4 py-4 lg:px-6">
          <TransactionToolbar
            filters={filterState.filters}
            onExport={() => setExportOpen(true)}
            onRefresh={() => void transactionsQuery.refetch()}
            setFilter={filterState.setFilter}
          />
          <TransactionFilters
            clearAll={filterState.clearAll}
            clearFilter={filterState.clearFilter}
            filters={filterState.filters}
            setFilter={filterState.setFilter}
          />
          <BulkActionsBar
            canDelete={canDelete}
            onDelete={() => bulkDeleteMutation.mutate()}
            onExport={() => setExportOpen(true)}
            onPlaceholder={(action) => bulkActionMutation.mutate(action === 'Bulk tag' ? 'TAG' : 'MARK_REVIEWED')}
            selectedCount={selectedIds.length}
          />
          {transactionsQuery.error ? (
            <section className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
              Unable to load transactions. Check the network connection and try again.
            </section>
          ) : null}
          <TransactionTable
            data={transactionsQuery.data}
            filters={filterState.filters}
            isLoading={transactionsQuery.isLoading}
            onOpen={openTransaction}
            selectedIds={selectedIds}
            setFilter={filterState.setFilter}
            setSelectedIds={setSelectedIds}
          />
          <PaginationControls
            data={transactionsQuery.data}
            isFetching={transactionsQuery.isFetching}
            limit={pagination.limit}
            page={pagination.page}
            setLimit={pagination.setLimit}
            setPage={pagination.setPage}
          />
        </div>
      </div>
      <TransactionDrawer client={client} onClose={() => setDrawerId(null)} transactionId={drawerId} />
      <ExportDialog
        onClose={() => setExportOpen(false)}
        onExport={(scope, format) => exportMutation.mutate({ scope, format })}
        open={exportOpen}
        selectedCount={selectedIds.length}
      />
    </main>
  );
}
