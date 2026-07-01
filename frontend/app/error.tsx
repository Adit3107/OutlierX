'use client';

import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An error occurred while compiling this page. Detail: {error.message || 'System Exception'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/95 transition-colors rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Try reloading view
      </button>
    </div>
  );
}
