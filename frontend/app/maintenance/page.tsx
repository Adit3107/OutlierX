'use client';

import { Gauge } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-5">
        <Gauge className="h-8 w-8 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-semibold">Maintenance</h1>
        <p className="mt-2 text-sm text-muted-foreground">OutlierX is temporarily unavailable while system maintenance is in progress.</p>
      </section>
    </main>
  );
}
