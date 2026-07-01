'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';
import { RulePlaygroundPageContent } from '../../../components/rules/rule-console';

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
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">Rule playground</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Authenticate to test rule evaluations.</p>
        <SignInButton mode="modal">
          <button className="mt-4 h-9 w-full rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground hover:bg-primary-strong/90" type="button">
            Sign in
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

export default function RulePlaygroundPage() {
  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <RulePlaygroundPageContent />
      </SignedIn>
    </>
  );
}
