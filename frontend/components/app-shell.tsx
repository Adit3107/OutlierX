'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import {
  BarChart3,
  FlaskConical,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  UploadCloud,
  WalletCards,
  Zap,
} from 'lucide-react';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/' },
  { label: 'Data Sources', icon: UploadCloud, href: '/data-sources' },
  { label: 'Transactions', icon: WalletCards, href: '/transactions' },
  { label: 'Rules', icon: Zap, href: '/rules' },
  { label: 'Playground', icon: FlaskConical, href: '/rules/playground' },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-background lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-surface text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none">OutlierX</p>
          <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Fraud Ops</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm transition-colors duration-150 ease-out',
                active
                  ? 'border border-border bg-surface-alt font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="border-t border-border p-3">
        <div className="rounded-md border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Engine</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              LIVE
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Storage</span>
            <span className="font-mono text-[10px] text-primary">READY</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppHeader({
  title,
  breadcrumb,
  userButton = true,
}: {
  title: string;
  breadcrumb?: string;
  userButton?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{breadcrumb}</span>
            </div>
          )}
          <h1 className="font-display text-2xl font-semibold leading-none">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            type="button"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {userButton && <UserButton afterSignOutUrl="/" />}
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  breadcrumb,
}: {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex flex-1 flex-col lg:pl-56">
        <AppHeader title={title} breadcrumb={breadcrumb} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
