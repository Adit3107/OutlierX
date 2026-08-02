'use client';

import React from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Globe,
  Key,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
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
          className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          Sign in
        </Link>
      </section>
    </main>
  );
}

function ProfileContent() {
  const { auth, isLoading } = useAuthData();
  const [copiedId, setCopiedId] = React.useState(false);

  // Preference Toggles State
  const [prefs, setPrefs] = React.useState({
    criticalAlerts: true,
    dailyDigest: true,
    soundEffects: false,
    securityLogs: true,
  });

  const [saving, setSaving] = React.useState(false);

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
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Failed to load profile data.</p>
        </div>
      </AppShell>
    );
  }

  const { user, organization, role } = auth;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active';

  const handleCopyId = () => {
    if (user.clerkUserId) {
      navigator.clipboard.writeText(user.clerkUserId);
      setCopiedId(true);
      toast.success('Clerk User ID copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSavePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Notification preferences updated successfully!');
    }, 600);
  };

  return (
    <AppShell title="Profile" breadcrumb="OPS / PROFILE">
      <div className="space-y-6 max-w-5xl">
        {/* User Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface shadow-xl">
          {/* Header Radiant Banner */}
          <div
            className="h-32 w-full bg-gradient-to-r from-primary/30 via-purple-600/20 to-surface-alt relative"
            style={{ background: 'radial-gradient(circle at 20% 0, rgba(99,102,241,0.25), transparent 70%), linear-gradient(90deg, #15172a, #0e101d)' }}
          />

          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-4 gap-4">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="relative h-24 w-24 rounded-2xl border-4 border-surface bg-surface-alt overflow-hidden shadow-2xl shrink-0 group">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary bg-primary/10">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-surface" />
                </div>
                <div className="pb-1">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Analyst Account'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary uppercase">
                      <Shield className="h-3.5 w-3.5" />
                      {role}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 uppercase">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ACTIVE
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      {organization.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyId}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-alt px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-surface"
                  type="button"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span>{copiedId ? 'Copied ID' : 'Copy User ID'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Assigned Role</p>
                  <p className="text-xs font-bold text-foreground truncate mt-0.5">{role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Engine Mode</p>
                  <p className="text-xs font-bold text-emerald-400 truncate mt-0.5">Real-time Stream</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Plan Tier</p>
                  <p className="text-xs font-bold text-purple-400 truncate mt-0.5">{organization.subscriptionPlan}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Team Allocation</p>
                  <p className="text-xs font-bold text-foreground truncate mt-0.5">{organization.maxUsers} Seats</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 Column Details Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal & Account Details */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border/80">
              <User className="h-5 w-5 text-primary" />
              Personal Credentials
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-alt/30 p-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Email Address</p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-alt/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Member Since</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-alt/30 p-3">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Clerk User Identifier</p>
                  <p className="text-xs font-mono font-medium text-foreground truncate mt-0.5">{user.clerkUserId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-alt/30 p-3">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">Timezone & Locale</p>
                  <p className="text-xs font-mono font-medium text-foreground mt-0.5">{user.timezone || 'UTC'} · English (US)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Active Workspace */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border/80">
              <Building2 className="h-5 w-5 text-primary" />
              Active Workspace
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground">Organization Name</span>
                <span className="text-xs font-bold text-foreground">{organization.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground">Workspace Identifier</span>
                <span className="text-xs font-mono font-semibold text-primary">{organization.slug}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground">Subscription Tier</span>
                <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400 uppercase">
                  {organization.subscriptionPlan}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground">Max Analyst Seats</span>
                <span className="text-xs font-mono text-foreground font-semibold">{organization.maxUsers} Seats</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs text-muted-foreground">Security Protocol</span>
                <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                  <Lock className="h-3 w-3" /> TLS 1.3 / Encrypted
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Workspace Status</span>
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
                </span>
              </div>
            </div>
          </section>

          {/* Security & Authentication */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border/80">
              <Lock className="h-5 w-5 text-primary" />
              Security & SSO
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-alt/30 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Authentication Provider</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Clerk Identity Management</p>
                </div>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">
                  VERIFIED
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-alt/30 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Multi-Factor Auth (MFA)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">TOTP Authenticator & Passkey</p>
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-400">
                  ENABLED
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-alt/30 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">Active Session</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Signed in via Web Browser</p>
                </div>
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Current Device
                </span>
              </div>
            </div>
          </section>

          {/* Preferences & Notifications */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-5 pb-3 border-b border-border/80">
              <Bell className="h-5 w-5 text-primary" />
              Alerting Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Critical Fraud Email Alerts</p>
                  <p className="text-[11px] text-muted-foreground">Notify instantly when risk score &gt; 85</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, criticalAlerts: !p.criticalAlerts }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    prefs.criticalAlerts ? 'bg-primary' : 'bg-surface-alt'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      prefs.criticalAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Daily Anomaly Summary Digest</p>
                  <p className="text-[11px] text-muted-foreground">Receive daily report of ingestion velocity</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, dailyDigest: !p.dailyDigest }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    prefs.dailyDigest ? 'bg-primary' : 'bg-surface-alt'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      prefs.dailyDigest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Live Anomaly Sound Feedback</p>
                  <p className="text-[11px] text-muted-foreground">Play subtle alert sound on flagged transactions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, soundEffects: !p.soundEffects }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    prefs.soundEffects ? 'bg-primary' : 'bg-surface-alt'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      prefs.soundEffects ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-display text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-strong disabled:opacity-50"
                  type="button"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Save Notification Preferences</span>
                    </>
                  )}
                </button>
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
