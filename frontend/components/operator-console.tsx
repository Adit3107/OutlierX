'use client';

import React from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosProgressEvent } from 'axios';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  UploadCloud,
  WalletCards,
  X,
} from 'lucide-react';
import type {
  AuthContext,
  PaginatedResponse,
  Permission,
  Transaction,
  Upload,
  UploadRowError,
  UploadStatus,
  UploadSummary as UploadSummaryType,
} from '@anomaly/shared';
import { MAX_UPLOAD_SIZE_BYTES, PERMISSIONS } from '@anomaly/shared';
import { createApiClient } from '../lib/api-client';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  }).format(value);
}

function validateCsv(file: File | null): string | null {
  if (!file) {
    return 'Select a CSV file to upload';
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Only .csv files are supported';
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'CSV upload must be 100 MB or smaller';
  }

  return null;
}

function getErrorSummary(upload?: Upload | null): UploadRowError[] {
  return upload?.errorSummary ?? [];
}

function StatusDot({ status }: { status: UploadStatus }) {
  const failed = status === 'FAILED';
  const complete = status === 'COMPLETED';

  return (
    <span
      className={cn(
        'h-2 w-2 rounded-sm',
        failed ? 'bg-severity-critical' : complete ? 'bg-primary' : 'bg-muted-foreground'
      )}
    />
  );
}

function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const failed = status === 'FAILED';

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] font-medium uppercase leading-none',
        failed
          ? 'border-severity-critical/40 bg-severity-critical/10 text-severity-critical'
          : 'border-border bg-surface-alt text-muted-foreground'
      )}
    >
      <StatusDot status={status} />
      {status}
    </span>
  );
}

function UploadProgress({ progress, isUploading }: { progress: number; isUploading: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3 font-mono text-xs">
        <span className="text-muted-foreground">{isUploading ? 'UPLOAD' : 'READY'}</span>
        <span className="text-foreground">{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-sm bg-surface-alt">
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function FilePreview({ file, error }: { file: File | null; error: string | null }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-foreground">{file?.name ?? 'No file selected'}</p>
          <p className={cn('mt-1 text-xs', error ? 'text-severity-critical' : 'text-muted-foreground')}>
            {error ?? (file ? formatBytes(file.size) : 'CSV only, up to 100 MB')}
          </p>
        </div>
      </div>
    </div>
  );
}

function UploadDropzone({
  file,
  error,
  disabled,
  onFile,
  onSubmit,
}: {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onFile: (file: File | null) => void;
  onSubmit: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div
        className={cn(
          'flex min-h-44 flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center transition-colors duration-150 ease-out',
          dragActive ? 'border-primary bg-surface-alt' : 'border-border bg-background/25'
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          onFile(event.dataTransfer.files.item(0));
        }}
      >
        <UploadCloud className="h-8 w-8 text-primary" />
        <h2 className="mt-3 font-display text-lg font-semibold">CSV Upload</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Drop a transaction file here or browse from disk.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            className="h-9 rounded-md border border-border bg-surface-alt px-3 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            Browse
          </button>
          <button
            className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground transition-colors duration-150 ease-out hover:bg-primary-strong/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || Boolean(error) || !file}
            onClick={onSubmit}
            type="button"
          >
            Upload
          </button>
        </div>
        <input
          ref={inputRef}
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.item(0) ?? null)}
          type="file"
        />
      </div>
      <div className="mt-3">
        <FilePreview file={file} error={error} />
      </div>
    </section>
  );
}

function UploadSummary({ upload }: { upload: Upload | null }) {
  const cells = [
    { label: 'Rows', value: upload ? String(upload.totalRows) : '0' },
    { label: 'Stored', value: upload ? String(upload.processedRows) : '0' },
    { label: 'Failed', value: upload ? String(upload.failedRows) : '0' },
    {
      label: 'Runtime',
      value: upload?.processingTime ? `${Math.round(upload.processingTime / 100) / 10}s` : '0s',
    },
  ];

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Upload Summary</h2>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
            {upload?.originalFilename ?? 'No upload selected'}
          </p>
        </div>
        {upload ? <UploadStatusBadge status={upload.status} /> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {cells.map((cell) => (
          <div key={cell.label} className="rounded-md border border-border bg-surface-alt p-3">
            <p className="text-xs uppercase text-muted-foreground">{cell.label}</p>
            <p className="mt-1 font-mono text-lg text-foreground">{cell.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValidationErrors({ errors }: { errors: UploadRowError[] }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Row Errors</h2>
        <span className="font-mono text-xs text-muted-foreground">{errors.length}</span>
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No row errors recorded.</p>
        ) : (
          errors.map((error, index) => (
            <article key={`${error.row}-${index}`} className="rounded-md border border-border bg-surface-alt p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-foreground">ROW {error.row}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {error.transactionId ?? 'NO ID'}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{error.errors.join(', ')}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function UploadCard({ upload, selected, onSelect }: { upload: Upload; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={cn(
        'w-full rounded-md border p-3 text-left transition-colors duration-150 ease-out',
        selected ? 'border-primary bg-surface-alt' : 'border-border bg-surface hover:bg-surface-alt'
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-foreground">{upload.originalFilename}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(upload.createdAt)}</p>
        </div>
        <UploadStatusBadge status={upload.status} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
        <span>{formatBytes(upload.fileSize)}</span>
        <span>{upload.processedRows}/{upload.totalRows} stored</span>
      </div>
    </button>
  );
}

function UploadHistoryTable({
  uploads,
  selectedId,
  onSelect,
  onDelete,
  canDelete,
}: {
  uploads: Upload[];
  selectedId: string | null;
  onSelect: (upload: Upload) => void;
  onDelete: (upload: Upload) => void;
  canDelete: boolean;
}) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Upload History</h2>
          <p className="text-xs text-muted-foreground">Organization-scoped files</p>
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="px-3 font-medium">File</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-3 font-medium">Rows</th>
              <th className="px-3 font-medium">Failed</th>
              <th className="px-3 font-medium">Size</th>
              <th className="px-3 font-medium">Uploaded</th>
              <th className="px-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => (
              <tr
                key={upload.id}
                className={cn(
                  'h-11 border-b border-border/70 transition-colors duration-150 ease-out hover:bg-surface-alt/65',
                  selectedId === upload.id && 'bg-surface-alt'
                )}
              >
                <td className="max-w-[240px] truncate px-3 font-mono text-xs text-foreground">
                  <button className="truncate text-left" onClick={() => onSelect(upload)} type="button">
                    {upload.originalFilename}
                  </button>
                </td>
                <td className="px-3"><UploadStatusBadge status={upload.status} /></td>
                <td className="px-3 font-mono text-xs">{upload.processedRows}/{upload.totalRows}</td>
                <td className="px-3 font-mono text-xs">{upload.failedRows}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{formatBytes(upload.fileSize)}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(upload.createdAt)}</td>
                <td className="px-3 text-right">
                  <button
                    aria-label="Delete upload"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canDelete}
                    onClick={() => onDelete(upload)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-3 md:hidden">
        {uploads.map((upload) => (
          <UploadCard
            key={upload.id}
            upload={upload}
            selected={selectedId === upload.id}
            onSelect={() => onSelect(upload)}
          />
        ))}
      </div>
    </section>
  );
}

function DeleteUploadDialog({
  upload,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  upload: Upload | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!upload) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-4">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Delete Upload</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This removes the stored CSV and imported transactions for this upload.
            </p>
          </div>
          <button
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 truncate rounded-md border border-border bg-surface-alt p-3 font-mono text-xs text-foreground">
          {upload.originalFilename}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="h-9 rounded-md border border-border px-3 text-sm text-foreground"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-9 rounded-md bg-severity-critical px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function TransactionsTable({ uploadId, client }: { uploadId: string | null; client: ReturnType<typeof createApiClient> }) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    setPage(1);
  }, [uploadId]);

  const transactionsQuery = useQuery({
    queryKey: ['uploads', uploadId, 'transactions', page, search],
    enabled: Boolean(uploadId),
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<Transaction> }>(
        `/uploads/${uploadId}/transactions`,
        {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            sortBy: 'timestamp',
            sortOrder: 'desc',
          },
        }
      );
      return response.data.data;
    },
  });

  const data = transactionsQuery.data;

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Transactions</h2>
          <p className="text-xs text-muted-foreground">Stored records from selected upload</p>
        </div>
        <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-surface-alt px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-44 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Filter"
            value={search}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="px-3 font-medium">Transaction ID</th>
              <th className="px-3 font-medium">Timestamp</th>
              <th className="px-3 font-medium">Merchant</th>
              <th className="px-3 font-medium">Country</th>
              <th className="px-3 font-medium">Amount</th>
              <th className="px-3 font-medium">Currency</th>
              <th className="px-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((transaction) => (
              <tr key={transaction.id} className="h-10 border-b border-border/70 hover:bg-surface-alt/65">
                <td className="px-3 font-mono text-xs text-foreground">{transaction.transactionId}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(transaction.timestamp)}</td>
                <td className="px-3 text-foreground">{transaction.merchant}</td>
                <td className="px-3 text-muted-foreground">{transaction.country ?? '-'}</td>
                <td className="px-3 font-mono text-xs">{formatCurrency(transaction.amount, transaction.currency)}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{transaction.currency}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{transaction.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {uploadId && data?.items.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground">No transactions found.</p>
        ) : null}
        {!uploadId ? (
          <p className="px-4 py-5 text-sm text-muted-foreground">Select an upload to inspect transactions.</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 font-mono text-xs text-muted-foreground">
        <span>{data ? `${data.total} records` : '0 records'}</span>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Page {data?.page ?? page}</span>
          <button
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40"
            disabled={!data || page >= data.totalPages}
            onClick={() => setPage((value) => value + 1)}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Sidebar() {
  const items = [
    { label: 'Overview', icon: Database, href: '/' },
    { label: 'Data Sources', icon: UploadCloud, active: true, href: '/' },
    { label: 'Transactions', icon: WalletCards, href: '/transactions' },
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
          <Link
            key={item.label}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors duration-200 ease-out',
              item.active
                ? 'border border-border bg-surface-alt text-foreground'
                : 'text-muted-foreground hover:bg-surface hover:text-foreground'
            )}
            href={item.href}
          >
            <item.icon className={cn('h-4 w-4', item.active && 'text-primary')} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">Ingest health</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-foreground">local-storage</span>
            <span className="font-mono text-xs text-primary">READY</span>
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
            <span className="font-mono">OPS / INGESTION</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{auth?.organization.name ?? 'Secure workspace'}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-none">Data Ingestion Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            type="button"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

export function OperatorConsole({ auth }: { auth: AuthContext | null }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [selectedUploadId, setSelectedUploadId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Upload | null>(null);

  const hasPermission = React.useCallback(
    (permission: Permission) => Boolean(auth?.permissions.includes(permission)),
    [auth?.permissions]
  );
  const canUpload = hasPermission(PERMISSIONS.UPLOADS_CREATE);
  const canDelete = hasPermission(PERMISSIONS.UPLOADS_DELETE);
  const fileError = validateCsv(file);

  const uploadsQuery = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const response = await client.get<{ data: PaginatedResponse<Upload> }>('/uploads', {
        params: { page: 1, limit: 50 },
      });
      return response.data.data;
    },
  });

  const uploads = uploadsQuery.data?.items ?? [];
  const selectedUpload =
    uploads.find((upload) => upload.id === selectedUploadId) ?? uploads[0] ?? null;

  React.useEffect(() => {
    if (!selectedUploadId && uploads.length > 0) {
      setSelectedUploadId(uploads[0].id);
    }
  }, [selectedUploadId, uploads]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error('Select a CSV file to upload');
      }

      const formData = new FormData();
      formData.append('file', file);
      const response = await client.post<{ data: { upload: Upload; summary: UploadSummaryType } }>(
        '/uploads',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
          onUploadProgress: (event: AxiosProgressEvent) => {
            const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            setProgress(percent);
          },
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success('CSV upload processed');
      setSelectedUploadId(data.upload.id);
      setFile(null);
      setProgress(100);
      void queryClient.invalidateQueries({ queryKey: ['uploads'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (upload: Upload) => {
      const response = await client.delete<{ data: Upload }>(`/uploads/${upload.id}`);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Upload deleted');
      setDeleteTarget(null);
      setSelectedUploadId(null);
      void queryClient.invalidateQueries({ queryKey: ['uploads'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    },
  });

  const submitUpload = () => {
    const error = validateCsv(file);
    if (error) {
      toast.error(error);
      return;
    }

    setProgress(0);
    uploadMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="lg:pl-56">
        <Header auth={auth} />
        <div className="space-y-4 px-4 py-4 lg:px-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <section className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Uploads</p>
              <p className="mt-2 font-display text-[32px] font-semibold leading-[1.15] tabular-nums">
                {uploadsQuery.data?.total ?? 0}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">Organization total</p>
            </section>
            <section className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Stored Rows</p>
              <p className="mt-2 font-display text-[32px] font-semibold leading-[1.15] tabular-nums">
                {uploads.reduce((sum, upload) => sum + upload.processedRows, 0)}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">Imported transactions</p>
            </section>
            <section className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Failed Rows</p>
              <p className="mt-2 font-display text-[32px] font-semibold leading-[1.15] tabular-nums">
                {uploads.reduce((sum, upload) => sum + upload.failedRows, 0)}
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">Validation rejects</p>
            </section>
            <section className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Latest Status</p>
              <div className="mt-3">{selectedUpload ? <UploadStatusBadge status={selectedUpload.status} /> : null}</div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">Synchronous parser</p>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <UploadDropzone
                disabled={!canUpload || uploadMutation.isPending}
                error={fileError}
                file={file}
                onFile={(nextFile) => {
                  setFile(nextFile);
                  setProgress(0);
                }}
                onSubmit={submitUpload}
              />
              <UploadProgress progress={progress} isUploading={uploadMutation.isPending} />
              <UploadHistoryTable
                canDelete={canDelete}
                onDelete={setDeleteTarget}
                onSelect={(upload) => setSelectedUploadId(upload.id)}
                selectedId={selectedUpload?.id ?? null}
                uploads={uploads}
              />
              <TransactionsTable client={client} uploadId={selectedUpload?.id ?? null} />
            </div>
            <div className="space-y-4">
              <UploadSummary upload={selectedUpload} />
              <ValidationErrors errors={getErrorSummary(selectedUpload)} />
              <section className="rounded-md border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Controls</h2>
                    <p className="text-xs text-muted-foreground">Refresh ingestion state</p>
                  </div>
                  <button
                    aria-label="Refresh uploads"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                    onClick={() => void queryClient.invalidateQueries({ queryKey: ['uploads'] })}
                    type="button"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 rounded-md border border-border bg-surface-alt p-3 font-mono text-xs text-muted-foreground">
                  CSV only. Required columns: transaction_id, timestamp, amount, currency, merchant.
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <DeleteUploadDialog
        isDeleting={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget);
          }
        }}
        upload={deleteTarget}
      />
    </main>
  );
}
