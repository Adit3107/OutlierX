import React from 'react';

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h1 className="font-display text-lg font-semibold">Loading Console</h1>
          <span className="font-mono text-xs text-primary">SYNC</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-sm bg-surface-alt" />
          <div className="h-2 w-5/6 rounded-sm bg-surface-alt" />
          <div className="h-2 w-2/3 rounded-sm bg-surface-alt" />
        </div>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Initializing ledger telemetry...</p>
      </section>
    </main>
  );
}
