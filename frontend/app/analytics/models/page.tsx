'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { MultiModelEngineConsole } from '../../../components/analytics/model-console';

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
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Multi-Model Engine</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Authenticate to access the multi-model anomaly detection engine dashboard.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          Sign in
        </Link>
      </section>
    </main>
  );
}

export default function MultiModelEnginePage() {
  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <MultiModelEngineConsole />
      </SignedIn>
    </>
  );
}
