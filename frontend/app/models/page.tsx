'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';
import { Cpu } from 'lucide-react';
import { createApiClient } from '../../lib/api-client';
import { ModelRegistryConsole } from '../../components/models/model-registry-console';

function SignedOutState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-md border border-border bg-surface p-5 text-center">
        <Cpu className="mx-auto h-8 w-8 text-primary mb-3" />
        <h1 className="font-display text-2xl font-semibold">Model Registry</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to access Model Evaluation & Versioning Console.</p>
        <SignInButton mode="modal">
          <button className="mt-4 h-9 w-full rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-strong" type="button">
            Sign in
          </button>
        </SignInButton>
      </section>
    </main>
  );
}

function ModelRegistryPageContent() {
  const { getToken } = useAuth();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);

  return <ModelRegistryConsole client={client} />;
}

export default function ModelRegistryPage() {
  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <ModelRegistryPageContent />
      </SignedIn>
    </>
  );
}
