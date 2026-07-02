'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import { OperatorConsole } from '../../components/operator-console';
import { useAuthData } from '../../providers/auth-provider';

function SignedOutState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">OutlierX</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Data Sources</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Authenticate to upload and manage transaction data sources.
        </p>
        <SignInButton mode="modal">
          <button
            className="mt-4 h-10 w-full rounded-lg bg-primary-strong px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong/90"
            type="button"
          >
            Sign in
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

function SignedInDataSources() {
  const { auth } = useAuthData();
  return <OperatorConsole auth={auth} />;
}

export default function DataSourcesPage() {
  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <SignedInDataSources />
      </SignedIn>
    </>
  );
}
