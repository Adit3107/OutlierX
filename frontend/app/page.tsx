'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuthData } from '../providers/auth-provider';

function ProtectedFoundation() {
  const { auth, isLoading, error } = useAuthData();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Anomalyze</p>
              <p className="text-xs text-muted-foreground">Foundation workspace</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Backend foundation is protected</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Authentication, organization context, RBAC, API keys, members, and activity logs are ready for future product modules.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading secure workspace
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              Unable to load authenticated workspace.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Current user</p>
                <p className="mt-2 text-sm font-semibold">{auth?.user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[auth?.user.firstName, auth?.user.lastName].filter(Boolean).join(' ') || 'Profile synced from Clerk'}
                </p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Organization</p>
                <p className="mt-2 text-sm font-semibold">{auth?.organization.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{auth?.organization.slug}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-md border border-border p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Access</p>
          <p className="mt-2 text-sm font-semibold">{auth?.role ?? 'Loading'}</p>
          <div className="mt-4 space-y-2">
            {(auth?.permissions ?? []).slice(0, 6).map((permission) => (
              <div key={permission} className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
                {permission}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-sm rounded-md border border-border p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 text-xl font-semibold tracking-normal">Anomalyze</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to initialize your secure organization workspace.
            </p>
            <SignInButton mode="modal">
              <button className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Sign in
              </button>
            </SignInButton>
          </div>
        </main>
      </SignedOut>
      <SignedIn>
        <ProtectedFoundation />
      </SignedIn>
    </>
  );
}
