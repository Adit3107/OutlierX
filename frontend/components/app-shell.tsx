'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Activity,
  Cpu,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  UploadCloud,
  User,
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
  { label: 'Model Registry', icon: Cpu, href: '/models' },
  { label: 'ML Monitoring', icon: Activity, href: '/monitoring' },
  { label: 'Playground', icon: FlaskConical, href: '/rules/playground' },
];

export function CustomUserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded || !user) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-surface-alt border border-border" />;
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-alt overflow-hidden hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        type="button"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName || 'User Profile'} className="h-full w-full object-cover" />
        ) : (
          <User className="h-4.5 w-4.5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-border bg-surface shadow-xl z-50 py-1.5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User Details */}
          <div className="px-4 py-2.5 border-b border-border/60">
            <p className="text-xs font-semibold text-foreground truncate">
              {user.fullName || user.username || 'Analyst'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          
          {/* Actions */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-foreground/80 hover:bg-surface-alt hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs text-severity-critical hover:bg-severity-critical/10 transition-colors text-left"
              type="button"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Activity className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="font-display text-base font-bold tracking-tight text-foreground">OutlierX</p>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Fraud Detection AI</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-all duration-150 ease-out',
                active
                  ? 'border border-primary/30 bg-primary/10 font-semibold text-primary shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : 'text-muted-foreground hover:bg-surface-alt hover:text-foreground'
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
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">AI Engine</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-low">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-low" />
              ACTIVE
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Accuracy</span>
            <span className="font-mono text-[10px] text-primary font-bold">99.8%</span>
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
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            type="button"
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {userButton && <CustomUserButton />}
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
