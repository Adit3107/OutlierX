'use client';

import React from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, useAuth, UserButton } from '@clerk/nextjs';
import { ArrowLeft, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createApiClient } from '../../../lib/api-client';
import { TransactionDetails } from '../../../components/transactions/investigation-console';
import { useTransaction } from '../../../hooks/transactions/use-transactions';

function SignedOutState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">Anomalyze</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Transaction details</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Authenticate to inspect this transaction.</p>
        <SignInButton mode="modal">
          <button className="mt-4 h-9 w-full rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground hover:bg-primary-strong/90" type="button">
            Sign in
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

function TransactionDetailPageContent({ transactionId }: { transactionId: string }) {
  const { getToken } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const transactionQuery = useTransaction(client, transactionId);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground" href="/transactions">
            <ArrowLeft className="h-4 w-4" /> Transactions
          </Link>
          <div className="flex items-center gap-2">
            <button aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={() => setTheme(isLight ? 'dark' : 'light')} type="button">
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-4 lg:px-6">
        {transactionQuery.isLoading ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-md bg-surface" />
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-md bg-surface" />)}
            </div>
          </div>
        ) : null}
        {transactionQuery.error ? (
          <section className="rounded-md border border-border bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Transaction unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The transaction may have been deleted, the ID may be invalid, or your role may not allow access.
            </p>
          </section>
        ) : null}
        {transactionQuery.data ? <TransactionDetails transaction={transactionQuery.data} /> : null}
      </div>
    </main>
  );
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const resolvedParams = React.use(params);

  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <TransactionDetailPageContent transactionId={resolvedParams.transactionId} />
      </SignedIn>
    </>
  );
}
