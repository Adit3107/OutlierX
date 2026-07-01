import React from 'react';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20 animate-pulse">
        <EyeOff className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold tracking-tight text-muted-foreground mb-4">
        Ledger page not found
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        The location you are trying to query doesn&apos;t exist or has been archived by organizational policies.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/95 transition-colors rounded-md shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
