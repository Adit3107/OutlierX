import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-b-2 border-accent animate-spin-reverse opacity-70"></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
        Analyzing ledger data...
      </p>
    </div>
  );
}
