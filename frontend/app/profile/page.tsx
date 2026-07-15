'use client';

import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import {
  Building2,
  Calendar,
  Key,
  Mail,
  Shield,
  ShieldCheck,
  User,
  Info,
  Clock,
  Globe,
  Palette,
} from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { useAuthData } from '../../providers/auth-provider';

import Link from 'next/link';

function SignedOutState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-surface-alt text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none">OutlierX</h1>
            <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">User Profile</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Authenticate to view your analyst profile details.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-primary-strong px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong/90"
        >
          Sign in
        </Link>
      </section>
    </main>
  );
}

function ProfileContent() {
  const { auth, isLoading } = useAuthData();

  if (isLoading) {
    return (
      <AppShell title="Profile" breadcrumb="OPS / PROFILE">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </AppShell>
    );
  }

  if (!auth) {
    return (
      <AppShell title="Profile" breadcrumb="OPS / PROFILE">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Failed to load profile data.</p>
        </div>
      </AppShell>
    );
  }

  const { user, organization, membership, role } = auth;
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '-';

  return (
    <AppShell title="Profile" breadcrumb="OPS / PROFILE">
      <div className="space-y-6 max-w-4xl">
        {/* User Card */}
        <section className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-surface-alt h-32 relative" />
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-4 gap-4">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="h-24 w-24 rounded-xl border-4 border-surface bg-surface-alt overflow-hidden shadow-lg shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-surface">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="pb-1.5">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Analyst Account'}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[10px] font-medium text-primary uppercase mt-1">
                    <Shield className="h-3 w-3" />
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-6">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/40 p-3">
                <Mail className="h-4.5 w-4.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Email Address</p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/40 p-3">
                <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Member Since</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/40 p-3">
                <Key className="h-4.5 w-4.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Clerk User Identifier</p>
                  <p className="text-xs font-semibold text-foreground font-mono truncate mt-0.5">{user.clerkUserId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt/40 p-3">
                <ShieldCheck className="h-4.5 w-4.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">User Status</p>
                  <p className="text-xs font-semibold text-severity-low mt-0.5">ACTIVE</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Organization Details */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              Active Workspace
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Name</span>
                <span className="text-xs font-semibold text-foreground">{organization.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Slug</span>
                <span className="text-xs font-mono font-medium text-foreground">{organization.slug}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Subscription Plan</span>
                <span className="inline-flex items-center rounded-md border border-severity-low/30 bg-severity-low/10 px-2 py-0.5 font-mono text-[10px] font-medium text-severity-low uppercase">
                  {organization.subscriptionPlan}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Team Size Limit</span>
                <span className="text-xs font-mono text-foreground">{organization.maxUsers} seats</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-muted-foreground">Workspace Status</span>
                <span className="text-xs font-mono text-primary">ACTIVE</span>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              User Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" /> Theme
                </span>
                <span className="text-xs font-semibold text-foreground uppercase">{user.theme || 'Dark'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Language
                </span>
                <span className="text-xs font-semibold text-foreground uppercase">{user.language || 'English'}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Timezone
                </span>
                <span className="text-xs font-mono text-foreground">{user.timezone || 'UTC'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <>
      <SignedOut>
        <SignedOutState />
      </SignedOut>
      <SignedIn>
        <ProfileContent />
      </SignedIn>
    </>
  );
}
