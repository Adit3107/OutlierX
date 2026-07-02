'use client';

import React from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Activity,
  BadgeHelp,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Moon,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
} from 'lucide-react';
import type {
  ActivityLog,
  AdminDashboardPayload,
  ApiKey,
  Membership,
  OrganizationUsageSummary,
  PaginatedResponse,
  ProfilePayload,
  SettingsPayload,
  SystemHealthPayload,
} from '@anomaly/shared';
import { PERMISSIONS } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { useAuthData } from '../../providers/auth-provider';

type EnterpriseView =
  | 'organization'
  | 'team'
  | 'profile'
  | 'api-keys'
  | 'settings'
  | 'subscription'
  | 'admin'
  | 'health'
  | 'activity'
  | 'help';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value?: string | Date | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '-';
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatBytes(value?: number | null) {
  const bytes = value ?? 0;
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0] || 'UX';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <input
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <select
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-alt p-3">
      <span className="text-sm text-foreground">{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  const positive = ['ACTIVE', 'UP', 'CONNECTED', 'READY'].includes((value ?? '').toUpperCase());
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md border px-2 font-mono text-[11px] uppercase',
        positive
          ? 'border-severity-low/40 bg-severity-low/10 text-severity-low'
          : 'border-severity-critical/40 bg-severity-critical/10 text-severity-critical'
      )}
    >
      {value ?? 'UNKNOWN'}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-2 font-mono text-xs text-muted-foreground">{hint}</p> : null}
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-md border border-border bg-surface" />
      ))}
    </div>
  );
}

function PermissionGate({
  allowed,
  children,
}: {
  allowed: boolean;
  children: React.ReactNode;
}) {
  if (allowed) {
    return <>{children}</>;
  }

  return (
    <EnterpriseShell view="settings" title="Access Restricted">
      <Panel title="403" subtitle="Your current role does not include access to this management surface.">
        <EmptyState label="Ask an organization owner or admin to update your access." />
      </Panel>
    </EnterpriseShell>
  );
}

function EnterpriseShell({
  view,
  title,
  children,
}: {
  view: EnterpriseView;
  title: string;
  children: React.ReactNode;
}) {
  const { auth } = useAuthData();
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const items = [
    { key: 'organization', label: 'Organization', href: '/organization', icon: Building2 },
    { key: 'team', label: 'Team', href: '/team', icon: Users },
    { key: 'profile', label: 'Profile', href: '/profile', icon: UserCog },
    { key: 'api-keys', label: 'API Keys', href: '/api-keys', icon: KeyRound },
    { key: 'settings', label: 'Settings', href: '/settings', icon: Settings },
    { key: 'subscription', label: 'Subscription', href: '/subscription', icon: CreditCard },
    { key: 'admin', label: 'Admin', href: '/admin', icon: LayoutDashboard },
    { key: 'health', label: 'Health', href: '/system-health', icon: Gauge },
    { key: 'activity', label: 'Activity', href: '/activity', icon: Activity },
    { key: 'help', label: 'Help', href: '/help', icon: BadgeHelp },
  ] as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-surface text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-none">OutlierX</p>
            <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Enterprise Ops</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <Link
              key={item.key}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
                view === item.key
                  ? 'border border-border bg-surface-alt text-foreground'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground'
              )}
              href={item.href}
            >
              <item.icon className={cn('h-4 w-4', view === item.key && 'text-primary')} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-xs uppercase text-muted-foreground">Workspace</p>
            <p className="mt-2 truncate text-sm text-foreground">{auth?.organization.name ?? 'OutlierX'}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{auth?.role ?? 'LOCKED'}</p>
          </div>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6">
            <div className="min-w-0">
              <div className="font-mono text-xs uppercase text-muted-foreground">OutlierX / Enterprise</div>
              <h1 className="mt-1 font-display text-2xl font-semibold leading-none">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle theme"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                type="button"
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.key}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-2 rounded-md border px-2 text-xs',
                  view === item.key ? 'border-primary bg-surface-alt text-foreground' : 'border-border text-muted-foreground'
                )}
                href={item.href}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <div className="space-y-4 px-4 py-4 lg:px-6">{children}</div>
      </div>
    </main>
  );
}

function useEnterpriseClient() {
  const { getToken } = useAuth();
  return React.useMemo(() => createApiClient(() => getToken()), [getToken]);
}

function OrganizationView() {
  const client = useEnterpriseClient();
  const queryClient = useQueryClient();
  const { auth } = useAuthData();
  const [form, setForm] = React.useState({
    name: '',
    logo: '',
    industry: '',
    website: '',
    timezone: 'UTC',
    defaultCurrency: 'USD',
    language: 'en',
  });
  const [transferId, setTransferId] = React.useState('');
  const [confirmName, setConfirmName] = React.useState('');

  const organizationQuery = useQuery({
    queryKey: ['organization'],
    queryFn: async () => (await client.get<{ data: typeof form & { id: string; maxUsers: number } }>('/organization')).data.data,
  });
  const usageQuery = useQuery({
    queryKey: ['organization', 'usage'],
    queryFn: async () => (await client.get<{ data: OrganizationUsageSummary }>('/organization/usage')).data.data,
  });
  const membersQuery = useQuery({
    queryKey: ['team', 'transfer'],
    queryFn: async () =>
      (await client.get<{ data: PaginatedResponse<Membership> }>('/team', { params: { page: 1, limit: 100, status: 'ACTIVE' } })).data.data,
  });

  React.useEffect(() => {
    if (organizationQuery.data) {
      setForm({
        name: organizationQuery.data.name ?? '',
        logo: organizationQuery.data.logo ?? '',
        industry: organizationQuery.data.industry ?? '',
        website: organizationQuery.data.website ?? '',
        timezone: organizationQuery.data.timezone ?? 'UTC',
        defaultCurrency: organizationQuery.data.defaultCurrency ?? 'USD',
        language: organizationQuery.data.language ?? 'en',
      });
    }
  }, [organizationQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () => (await client.patch('/organization', { ...form, logo: form.logo || null, website: form.website || null, industry: form.industry || null })).data,
    onSuccess: () => {
      toast.success('Organization updated');
      void queryClient.invalidateQueries({ queryKey: ['organization'] });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });
  const transferMutation = useMutation({
    mutationFn: async () => (await client.post('/organization/transfer-ownership', { membershipId: transferId })).data,
    onSuccess: () => {
      toast.success('Ownership transferred');
      void queryClient.invalidateQueries({ queryKey: ['team'] });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Transfer failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => (await client.delete('/organization', { data: { confirmName } })).data,
    onSuccess: () => toast.success('Organization deletion completed'),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Delete failed'),
  });

  const canUpdate = Boolean(auth?.permissions.includes(PERMISSIONS.ORGANIZATION_UPDATE));
  const isOwner = auth?.role === 'OWNER';
  const usage = usageQuery.data;

  return (
    <EnterpriseShell view="organization" title="Organization Settings">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Members" value={usage?.members ?? 0} hint={`${usage?.activeMembers ?? 0} active`} />
        <StatCard label="Uploads" value={usage?.uploads ?? 0} hint="Organization total" />
        <StatCard label="Storage" value={formatBytes(usage?.storageBytes)} hint="Uploaded CSV files" />
        <StatCard label="Transactions" value={formatNumber(usage?.transactionsProcessed)} hint="Processed records" />
      </div>
      <Panel title="Profile" subtitle="Core workspace identity and localization.">
        {organizationQuery.isLoading ? (
          <LoadingGrid />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field disabled={!canUpdate} label="Name" onChange={(name) => setForm((value) => ({ ...value, name }))} value={form.name} />
            <Field disabled={!canUpdate} label="Logo URL" onChange={(logo) => setForm((value) => ({ ...value, logo }))} value={form.logo} />
            <Field disabled={!canUpdate} label="Industry" onChange={(industry) => setForm((value) => ({ ...value, industry }))} value={form.industry} />
            <Field disabled={!canUpdate} label="Website" onChange={(website) => setForm((value) => ({ ...value, website }))} value={form.website} />
            <Field disabled={!canUpdate} label="Timezone" onChange={(timezone) => setForm((value) => ({ ...value, timezone }))} value={form.timezone} />
            <SelectField disabled={!canUpdate} label="Default Currency" onChange={(defaultCurrency) => setForm((value) => ({ ...value, defaultCurrency }))} options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']} value={form.defaultCurrency} />
            <Field disabled={!canUpdate} label="Language" onChange={(language) => setForm((value) => ({ ...value, language }))} value={form.language} />
            <div className="flex items-end">
              <button className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!canUpdate || updateMutation.isPending} onClick={() => updateMutation.mutate()} type="button">
                Save
              </button>
            </div>
          </div>
        )}
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Transfer Ownership" subtitle="Owner only. Current owner becomes admin after transfer.">
          <div className="flex flex-wrap gap-2">
            <select className="h-9 min-w-64 rounded-md border border-border bg-background px-3 text-sm outline-none" disabled={!isOwner} onChange={(event) => setTransferId(event.target.value)} value={transferId}>
              <option value="">Select active member</option>
              {(membersQuery.data?.items ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user?.email} / {member.role}
                </option>
              ))}
            </select>
            <button className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-50" disabled={!isOwner || !transferId || transferMutation.isPending} onClick={() => transferMutation.mutate()} type="button">
              Transfer
            </button>
          </div>
        </Panel>
        <Panel title="Delete Organization" subtitle="Owner only. This permanently removes the workspace.">
          <div className="flex flex-wrap gap-2">
            <input className="h-9 min-w-64 rounded-md border border-border bg-background px-3 text-sm outline-none" disabled={!isOwner} onChange={(event) => setConfirmName(event.target.value)} placeholder="Type organization name" value={confirmName} />
            <button className="h-9 rounded-md bg-severity-critical px-3 text-sm font-medium text-white disabled:opacity-50" disabled={!isOwner || !confirmName || deleteMutation.isPending} onClick={() => deleteMutation.mutate()} type="button">
              Delete
            </button>
          </div>
        </Panel>
      </div>
    </EnterpriseShell>
  );
}

function TeamView() {
  const client = useEnterpriseClient();
  const queryClient = useQueryClient();
  const { auth } = useAuthData();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [invite, setInvite] = React.useState({ email: '', role: 'MEMBER' });
  const canWrite = Boolean(auth?.permissions.includes(PERMISSIONS.MEMBERS_UPDATE));
  const canInvite = Boolean(auth?.permissions.includes(PERMISSIONS.MEMBERS_CREATE));

  const teamQuery = useQuery({
    queryKey: ['team', page, search, role, status],
    queryFn: async () =>
      (await client.get<{ data: PaginatedResponse<Membership> }>('/team', {
        params: { page, limit: 10, search: search || undefined, role: role || undefined, status: status || undefined },
      })).data.data,
  });
  const inviteMutation = useMutation({
    mutationFn: async () => (await client.post('/team/invite', invite)).data,
    onSuccess: () => {
      toast.success('Member invitation placeholder created');
      setInvite({ email: '', role: 'MEMBER' });
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Invite failed'),
  });
  const patchMember = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, string> }) => (await client.patch(`/team/${id}`, payload)).data,
    onSuccess: () => {
      toast.success('Member updated');
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });
  const removeMember = useMutation({
    mutationFn: async (id: string) => (await client.delete(`/team/${id}`)).data,
    onSuccess: () => {
      toast.success('Member removed');
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Remove failed'),
  });
  const resend = useMutation({
    mutationFn: async (id: string) => (await client.post(`/team/${id}/resend-invitation`)).data,
    onSuccess: () => toast.success('Invitation resend placeholder queued'),
  });
  const data = teamQuery.data;

  return (
    <EnterpriseShell view="team" title="Team Management">
      <Panel title="Invite Member" subtitle="Invitation delivery is prepared as a placeholder.">
        <div className="flex flex-wrap gap-2">
          <input className="h-9 min-w-64 rounded-md border border-border bg-background px-3 text-sm outline-none" disabled={!canInvite} onChange={(event) => setInvite((value) => ({ ...value, email: event.target.value }))} placeholder="user@example.com" value={invite.email} />
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" disabled={!canInvite} onChange={(event) => setInvite((value) => ({ ...value, role: event.target.value }))} value={invite.role}>
            {['ADMIN', 'ANALYST', 'MEMBER', 'VIEWER'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!canInvite || !invite.email || inviteMutation.isPending} onClick={() => inviteMutation.mutate()} type="button">
            Invite
          </button>
        </div>
      </Panel>
      <Panel title="Members" subtitle="Search, filter, paginate, suspend, reactivate, and change roles.">
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="flex h-9 min-w-64 items-center gap-2 rounded-md border border-border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-transparent text-sm outline-none" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search members" value={search} />
          </div>
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm" onChange={(event) => { setRole(event.target.value); setPage(1); }} value={role}>
            <option value="">All roles</option>
            {['OWNER', 'ADMIN', 'ANALYST', 'MEMBER', 'VIEWER'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
            <option value="">All statuses</option>
            {['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
              <tr className="h-9 border-b border-border">
                <th className="px-3">Member</th><th className="px-3">Role</th><th className="px-3">Status</th><th className="px-3">Joined</th><th className="px-3" />
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((member) => (
                <tr key={member.id} className="h-12 border-b border-border/70">
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-alt font-mono text-xs">{initials(`${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`, member.user?.email)}</div>
                      <div><p className="text-foreground">{member.user?.firstName} {member.user?.lastName}</p><p className="font-mono text-xs text-muted-foreground">{member.user?.email}</p></div>
                    </div>
                  </td>
                  <td className="px-3">
                    <select className="h-8 rounded-md border border-border bg-background px-2 text-xs" disabled={!canWrite || member.role === 'OWNER'} onChange={(event) => patchMember.mutate({ id: member.id, payload: { role: event.target.value } })} value={member.role}>
                      {['OWNER', 'ADMIN', 'ANALYST', 'MEMBER', 'VIEWER'].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </td>
                  <td className="px-3"><StatusBadge value={member.status} /></td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(member.joinedAt)}</td>
                  <td className="px-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="h-8 rounded-md border border-border px-2 text-xs disabled:opacity-50" disabled={!canInvite} onClick={() => resend.mutate(member.id)} type="button">Resend</button>
                      <button className="h-8 rounded-md border border-border px-2 text-xs disabled:opacity-50" disabled={!canWrite || member.role === 'OWNER'} onClick={() => patchMember.mutate({ id: member.id, payload: { status: member.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } })} type="button">{member.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}</button>
                      <button className="h-8 rounded-md border border-severity-critical/40 px-2 text-xs text-severity-critical disabled:opacity-50" disabled={!canWrite || member.role === 'OWNER'} onClick={() => removeMember.mutate(member.id)} type="button">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teamQuery.isLoading && data?.items.length === 0 ? <EmptyState label="No members match the current filters." /> : null}
        </div>
        <Pager page={page} totalPages={data?.totalPages ?? 1} onPage={setPage} total={data?.total ?? 0} />
      </Panel>
    </EnterpriseShell>
  );
}

function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-mono text-xs text-muted-foreground">
      <span>{total} records</span>
      <div className="flex items-center gap-2">
        <button aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} type="button"><ChevronLeft className="h-4 w-4" /></button>
        <span>Page {page}</span>
        <button aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-40" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function ProfileView() {
  const client = useEnterpriseClient();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ firstName: '', lastName: '', avatar: '', theme: 'dark', language: 'en', timezone: 'UTC' });
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await client.get<{ data: ProfilePayload }>('/profile')).data.data,
  });
  React.useEffect(() => {
    const user = profileQuery.data?.user;
    if (user) setForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', avatar: user.avatar ?? '', theme: user.theme ?? 'dark', language: user.language ?? 'en', timezone: user.timezone ?? 'UTC' });
  }, [profileQuery.data]);
  const update = useMutation({
    mutationFn: async () => (await client.patch('/profile', { ...form, avatar: form.avatar || null })).data,
    onSuccess: () => {
      toast.success('Profile updated');
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Profile update failed'),
  });
  const profile = profileQuery.data;
  return (
    <EnterpriseShell view="profile" title="User Profile">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="Identity">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-surface-alt font-display text-xl">{initials(`${form.firstName} ${form.lastName}`, profile?.user.email)}</div>
            <div><p className="text-lg font-semibold">{form.firstName} {form.lastName}</p><p className="font-mono text-xs text-muted-foreground">{profile?.user.email}</p></div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Info label="Organization" value={profile?.organization.name} />
            <Info label="Role" value={profile?.membership.role} />
            <Info label="Joined" value={formatDate(profile?.membership.joinedAt)} />
          </div>
        </Panel>
        <Panel title="Preferences">
          {profileQuery.isLoading ? <LoadingGrid /> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="First Name" value={form.firstName} onChange={(firstName) => setForm((value) => ({ ...value, firstName }))} />
              <Field label="Last Name" value={form.lastName} onChange={(lastName) => setForm((value) => ({ ...value, lastName }))} />
              <Field label="Avatar URL" value={form.avatar} onChange={(avatar) => setForm((value) => ({ ...value, avatar }))} />
              <SelectField label="Theme" value={form.theme} onChange={(theme) => setForm((value) => ({ ...value, theme }))} options={['dark', 'light', 'system']} />
              <Field label="Language" value={form.language} onChange={(language) => setForm((value) => ({ ...value, language }))} />
              <Field label="Timezone" value={form.timezone} onChange={(timezone) => setForm((value) => ({ ...value, timezone }))} />
              <div className="flex items-end"><button className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground" onClick={() => update.mutate()} type="button">Save Profile</button></div>
            </div>
          )}
        </Panel>
      </div>
      <Panel title="Recent Activity">
        <ActivityList items={profile?.recentActivity ?? []} />
      </Panel>
    </EnterpriseShell>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-b border-border/60 py-2"><span className="text-muted-foreground">{label}</span><span className="text-right text-foreground">{value ?? '-'}</span></div>;
}

function ApiKeysView() {
  const client = useEnterpriseClient();
  const queryClient = useQueryClient();
  const [create, setCreate] = React.useState({ name: '', expiresAt: '' });
  const [rawKey, setRawKey] = React.useState<string | null>(null);
  const keysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => (await client.get<{ data: ApiKey[] }>('/api-keys')).data.data,
  });
  const createMutation = useMutation({
    mutationFn: async () => (await client.post<{ data: ApiKey & { key?: string } }>('/api-keys', { name: create.name, expiresAt: create.expiresAt || undefined })).data.data,
    onSuccess: (data) => {
      setRawKey(data.key ?? null);
      setCreate({ name: '', expiresAt: '' });
      toast.success('API key created');
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Create failed'),
  });
  const updateKey = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => (await client.patch<{ data: ApiKey & { key?: string } }>(`/api-keys/${id}`, payload)).data.data,
    onSuccess: (data) => {
      if (data.key) setRawKey(data.key);
      toast.success(data.key ? 'API key rotated' : 'API key updated');
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Update failed'),
  });
  const revoke = useMutation({
    mutationFn: async (id: string) => (await client.delete(`/api-keys/${id}`)).data,
    onSuccess: () => {
      toast.success('API key revoked');
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
  return (
    <EnterpriseShell view="api-keys" title="API Key Management">
      {rawKey ? (
        <Panel title="Copy Key" subtitle="This raw key is shown once.">
          <div className="flex flex-wrap gap-2">
            <code className="min-w-0 flex-1 rounded-md border border-border bg-background p-3 font-mono text-xs">{rawKey}</code>
            <button className="h-10 rounded-md border border-border px-3 text-sm" onClick={() => { void navigator.clipboard.writeText(rawKey); toast.success('Copied'); }} type="button"><Clipboard className="inline h-4 w-4" /></button>
            <button className="h-10 rounded-md border border-border px-3 text-sm" onClick={() => setRawKey(null)} type="button">Dismiss</button>
          </div>
        </Panel>
      ) : null}
      <Panel title="Generate Key">
        <div className="flex flex-wrap gap-2">
          <input className="h-9 min-w-64 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setCreate((value) => ({ ...value, name: event.target.value }))} placeholder="Key name" value={create.name} />
          <input className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setCreate((value) => ({ ...value, expiresAt: event.target.value }))} type="datetime-local" value={create.expiresAt} />
          <button className="h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!create.name} onClick={() => createMutation.mutate()} type="button">Generate</button>
        </div>
      </Panel>
      <Panel title="Keys">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-muted-foreground"><tr className="h-9 border-b border-border"><th className="px-3">Name</th><th className="px-3">Preview</th><th className="px-3">Status</th><th className="px-3">Last Used</th><th className="px-3">Expires</th><th className="px-3" /></tr></thead>
            <tbody>
              {(keysQuery.data ?? []).map((key) => (
                <tr key={key.id} className="h-12 border-b border-border/70">
                  <td className="px-3"><input className="h-8 rounded-md border border-border bg-background px-2 text-sm" defaultValue={key.name} onBlur={(event) => event.target.value !== key.name && updateKey.mutate({ id: key.id, payload: { name: event.target.value } })} /></td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{key.keyPreview}</td>
                  <td className="px-3"><StatusBadge value={key.status} /></td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(key.lastUsedAt)}</td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(key.expiresAt)}</td>
                  <td className="px-3 text-right"><div className="flex justify-end gap-2"><button className="h-8 rounded-md border border-border px-2 text-xs" onClick={() => updateKey.mutate({ id: key.id, payload: { rotate: true } })} type="button">Rotate</button><button className="h-8 rounded-md border border-severity-critical/40 px-2 text-xs text-severity-critical" onClick={() => revoke.mutate(key.id)} type="button">Revoke</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </EnterpriseShell>
  );
}

function SettingsView() {
  const client = useEnterpriseClient();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await client.get<{ data: SettingsPayload }>('/settings')).data.data,
  });
  const [notifications, setNotifications] = React.useState({ email: true, browser: true, criticalAlerts: true, highAlerts: true, weeklySummary: true, marketing: false });
  React.useEffect(() => { if (settingsQuery.data?.notifications) setNotifications(settingsQuery.data.notifications); }, [settingsQuery.data]);
  const update = useMutation({
    mutationFn: async () => (await client.patch('/settings', { notificationPreferences: notifications })).data,
    onSuccess: () => {
      toast.success('Settings saved');
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  const settingsSections = ['General', 'Appearance', 'Notifications', 'Security', 'Organization', 'API', 'Billing', 'Support', 'About'];
  return (
    <EnterpriseShell view="settings" title="Settings">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Panel title="Sections">
          <div className="space-y-1">{settingsSections.map((item) => <div key={item} className="rounded-md border border-border bg-surface-alt px-3 py-2 text-sm">{item}</div>)}</div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Notifications" subtitle="Email, browser, alert, summary, and marketing preferences.">
            <div className="grid gap-2 md:grid-cols-2">
              {Object.entries(notifications).map(([key, value]) => (
                <Toggle key={key} checked={value} label={key.replace(/[A-Z]/g, ' $&')} onChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked }))} />
              ))}
            </div>
            <button className="mt-4 h-9 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground" onClick={() => update.mutate()} type="button">Save Settings</button>
          </Panel>
          <Panel title="About">
            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Plan" value={settingsQuery.data?.organization.subscriptionPlan} />
              <Info label="Users" value={`${settingsQuery.data?.usage.members ?? 0} / ${settingsQuery.data?.organization.maxUsers ?? 0}`} />
              <Info label="Storage" value={formatBytes(settingsQuery.data?.usage.storageBytes)} />
            </div>
          </Panel>
        </div>
      </div>
    </EnterpriseShell>
  );
}

function SubscriptionView() {
  const client = useEnterpriseClient();
  const settingsQuery = useQuery({ queryKey: ['settings', 'subscription'], queryFn: async () => (await client.get<{ data: SettingsPayload }>('/settings')).data.data });
  const usage = settingsQuery.data?.usage;
  const plans = [
    ['Free', 'Starter workspace', '5 users', 'Basic alerts'],
    ['Pro', 'Production operations', '25 users', 'Advanced analytics'],
    ['Enterprise', 'Scaled governance', 'Custom users', 'Admin dashboard'],
  ];
  return (
    <EnterpriseShell view="subscription" title="Subscription">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Current Plan" value={settingsQuery.data?.organization.subscriptionPlan ?? 'FREE'} hint="Billing placeholder" />
        <StatCard label="API Calls" value="0" hint="Meter placeholder" />
        <StatCard label="Uploads" value={usage?.uploads ?? 0} hint="Current workspace" />
        <StatCard label="Storage" value={formatBytes(usage?.storageBytes)} hint="Uploaded data" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map(([name, summary, users, feature]) => (
          <Panel key={name} title={name} subtitle={summary}>
            <div className="space-y-3 text-sm"><Info label="Users" value={users} /><Info label="Feature" value={feature} /><Info label="Transactions" value={name === 'Free' ? '10K' : name === 'Pro' ? '1M' : 'Custom'} /></div>
            <button className="mt-4 h-9 w-full rounded-md border border-border px-3 text-sm text-muted-foreground" disabled type="button">Upgrade</button>
          </Panel>
        ))}
      </div>
    </EnterpriseShell>
  );
}

function AdminView() {
  const client = useEnterpriseClient();
  const { auth } = useAuthData();
  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await client.get<{ data: AdminDashboardPayload }>('/admin/dashboard')).data.data,
  });
  const data = query.data;
  return (
    <PermissionGate allowed={auth?.role === 'OWNER' || auth?.role === 'ADMIN'}>
      <EnterpriseShell view="admin" title="Admin Dashboard">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Organizations" value={data?.totals.organizations ?? 0} />
          <StatCard label="Users" value={data?.totals.users ?? 0} />
          <StatCard label="Uploads" value={data?.totals.uploads ?? 0} />
          <StatCard label="Transactions" value={formatNumber(data?.totals.transactions)} />
          <StatCard label="Alerts" value={data?.totals.alerts ?? 0} />
          <StatCard label="API Keys" value={data?.totals.apiKeys ?? 0} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Organizations"><SimpleList items={(data?.recentOrganizations ?? []).map((item) => [item.name, item.subscriptionPlan, formatDate(item.createdAt)])} /></Panel>
          <Panel title="Users"><SimpleList items={(data?.recentUsers ?? []).map((item) => [item.email, item.status, formatDate(item.createdAt)])} /></Panel>
          <Panel title="Uploads"><SimpleList items={(data?.recentUploads ?? []).map((item) => [item.originalFilename, item.status, formatDate(item.createdAt)])} /></Panel>
          <Panel title="System Health"><HealthCells health={data?.health} /></Panel>
        </div>
        <Panel title="Activity Logs"><ActivityList items={data?.recentActivity ?? []} /></Panel>
      </EnterpriseShell>
    </PermissionGate>
  );
}

function HealthCells({ health }: { health?: SystemHealthPayload }) {
  const cells = [
    ['Backend', health?.backendStatus],
    ['ML Service', health?.mlServiceStatus],
    ['Database', health?.databaseStatus],
    ['Storage', health?.storageStatus],
    ['API Version', health?.apiVersion],
    ['Model Version', health?.modelVersion],
    ['Environment', health?.environment],
  ];
  return <div className="grid gap-2 md:grid-cols-2">{cells.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-md border border-border bg-surface-alt p-3 text-sm"><span className="text-muted-foreground">{label}</span><StatusBadge value={value} /></div>)}</div>;
}

function HealthView() {
  const client = useEnterpriseClient();
  const query = useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => (await client.get<{ data: SystemHealthPayload }>('/system/health')).data.data,
    refetchInterval: 60000,
  });
  return (
    <EnterpriseShell view="health" title="System Health">
      <Panel title="Runtime" subtitle="Polls every minute." action={<button className="flex h-9 w-9 items-center justify-center rounded-md border border-border" onClick={() => void query.refetch()} type="button"><RefreshCw className="h-4 w-4" /></button>}>
        <HealthCells health={query.data} />
      </Panel>
    </EnterpriseShell>
  );
}

function ActivityView() {
  const client = useEnterpriseClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [entity, setEntity] = React.useState('');
  const query = useQuery({
    queryKey: ['activity', page, search, entity],
    queryFn: async () => (await client.get<{ data: PaginatedResponse<ActivityLog> }>('/activity', { params: { page, limit: 20, search: search || undefined, entity: entity || undefined } })).data.data,
  });
  return (
    <EnterpriseShell view="activity" title="Activity Logs">
      <Panel title="Audit Trail">
        <div className="mb-3 flex flex-wrap gap-2"><input className="h-9 min-w-64 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search activity" value={search} /><select className="h-9 rounded-md border border-border bg-background px-3 text-sm" onChange={(event) => { setEntity(event.target.value); setPage(1); }} value={entity}><option value="">All entities</option>{['USER', 'ORGANIZATION', 'MEMBERSHIP', 'API_KEY', 'UPLOAD', 'TRANSACTION', 'RULE', 'ALERT', 'SYSTEM'].map((item) => <option key={item}>{item}</option>)}</select></div>
        <ActivityList items={query.data?.items ?? []} />
        <Pager page={page} totalPages={query.data?.totalPages ?? 1} total={query.data?.total ?? 0} onPage={setPage} />
      </Panel>
    </EnterpriseShell>
  );
}

function ActivityList({ items }: { items: ActivityLog[] }) {
  if (items.length === 0) return <EmptyState label="No activity recorded." />;
  return <div className="space-y-2">{items.map((item) => <div key={item.id} className="grid gap-2 rounded-md border border-border bg-surface-alt p-3 text-sm md:grid-cols-[1fr_140px_180px]"><div><p className="font-mono text-xs uppercase text-foreground">{item.action}</p><p className="mt-1 text-xs text-muted-foreground">{item.user?.email ?? 'System'} / {item.entity}</p></div><span className="font-mono text-xs text-muted-foreground">{item.entityId ?? '-'}</span><span className="font-mono text-xs text-muted-foreground">{formatDate(item.createdAt)}</span></div>)}</div>;
}

function HelpView() {
  const docs = [
    ['Getting Started', 'Set up an organization, invite analysts, upload CSVs, and review high-risk activity.'],
    ['Uploading Transactions', 'Use CSV files with transaction_id, timestamp, amount, currency, and merchant columns.'],
    ['Understanding Risk Scores', 'Scores combine rule, machine learning, and decision signals already present in OutlierX.'],
    ['Rule Engine', 'Create compact rule trees, test them, and review execution history.'],
    ['Machine Learning', 'Review ML predictions consumed by the decision engine; no new AI features are introduced here.'],
    ['Decision Engine', 'Inspect recommendations, confidence, and signal breakdowns per transaction.'],
    ['Alerts', 'Triage open alerts, assign analysts, resolve, archive, or bulk update.'],
    ['Analytics', 'Review risk trends, volume, merchant, country, and model distributions.'],
    ['API Keys', 'Generate keys, copy once, rotate, rename, expire, and revoke.'],
    ['FAQ', 'Billing and invitation delivery are placeholders in Phase 1.'],
  ];
  return (
    <EnterpriseShell view="help" title="Help & Documentation">
      <div className="grid gap-4 md:grid-cols-2">
        {docs.map(([title, body]) => <Panel key={title} title={title}><p className="text-sm leading-6 text-muted-foreground">{body}</p></Panel>)}
      </div>
    </EnterpriseShell>
  );
}

function SimpleList({ items }: { items: string[][] }) {
  if (items.length === 0) return <EmptyState label="No records available." />;
  return <div className="space-y-2">{items.map((item, index) => <div key={index} className="grid gap-2 rounded-md border border-border bg-surface-alt p-3 text-sm md:grid-cols-3">{item.map((cell, cellIndex) => <span key={cellIndex} className={cn(cellIndex > 0 && 'font-mono text-xs text-muted-foreground')}>{cell}</span>)}</div>)}</div>;
}

export function EnterpriseConsole({ view }: { view: EnterpriseView }) {
  if (view === 'organization') return <OrganizationView />;
  if (view === 'team') return <TeamView />;
  if (view === 'profile') return <ProfileView />;
  if (view === 'api-keys') return <ApiKeysView />;
  if (view === 'settings') return <SettingsView />;
  if (view === 'subscription') return <SubscriptionView />;
  if (view === 'admin') return <AdminView />;
  if (view === 'health') return <HealthView />;
  if (view === 'activity') return <ActivityView />;
  return <HelpView />;
}
