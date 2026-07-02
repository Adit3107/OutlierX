import React from 'react';
import Link from 'next/link';
import { TerminalSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-surface p-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <TerminalSquare className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-display text-lg font-semibold">OutlierX Route Not Found</h1>
            <p className="font-mono text-xs text-muted-foreground">HTTP 404</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-[1.4] text-muted-foreground">
          The requested console path is not registered in this workspace.
        </p>
        <Link
          className="mt-4 inline-flex h-8 items-center rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground transition-colors duration-200 ease-out hover:bg-primary-strong/90"
          href="/"
        >
          Return to console
        </Link>
      </section>
    </main>
  );
}
