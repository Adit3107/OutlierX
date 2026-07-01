'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import { OperatorConsole } from '../components/operator-console';
import { useAuthData } from '../providers/auth-provider';

function SignedInConsole() {
  const { auth } = useAuthData();

  return <OperatorConsole auth={auth} />;
}

function SignedOutConsole() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-md border border-border bg-surface p-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">Anomalyze</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Fraud analysis console</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-[1.4] text-muted-foreground">
          Authenticate to access the financial anomaly monitoring workspace.
        </p>
        <div className="mt-4 rounded-md border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-muted-foreground">SESSION</span>
            <span className="text-severity-medium">LOCKED</span>
          </div>
        </div>
        <SignInButton mode="modal">
          <button className="mt-4 h-9 w-full rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground transition-colors duration-200 ease-out hover:bg-primary-strong/90" type="button">
            Sign in
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

export default function HomePage() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.has('__clerk_status') ||
        window.location.search.includes('_clerk') ||
        window.location.search.includes('clerk')
      ) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <>
      <SignedOut>
        <SignedOutConsole />
      </SignedOut>
      <SignedIn>
        <SignedInConsole />
      </SignedIn>
    </>
  );
}
