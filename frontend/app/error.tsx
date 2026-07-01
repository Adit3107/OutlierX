'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NextJS Uncaught Boundary Error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-lg rounded-md border border-border border-l-[3px] bg-surface p-4" style={{ borderLeftColor: 'var(--critical)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-severity-critical" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold">Console View Failed</h1>
            <p className="mt-2 text-sm leading-[1.4] text-muted-foreground">
              The current analysis view could not be rendered.
            </p>
            <p className="mt-3 break-words font-mono text-xs text-muted-foreground">
              {error.message || 'SYSTEM_EXCEPTION'}
            </p>
            <button
              className="mt-4 h-8 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground transition-colors duration-200 ease-out hover:bg-primary-strong/90"
              onClick={() => reset()}
              type="button"
            >
              Reload view
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
