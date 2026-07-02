'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-5">
        <WifiOff className="h-8 w-8 text-severity-medium" />
        <h1 className="mt-4 font-display text-3xl font-semibold">Offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">OutlierX cannot reach the network. Check connectivity and retry.</p>
      </section>
    </main>
  );
}
