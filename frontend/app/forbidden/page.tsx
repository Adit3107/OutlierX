'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-5">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-semibold">403</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your role does not include access to this OutlierX surface.</p>
        <Link className="mt-4 inline-flex h-9 items-center rounded-md border border-border px-3 text-sm" href="/dashboard">
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
