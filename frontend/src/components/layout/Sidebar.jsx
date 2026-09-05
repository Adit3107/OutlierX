'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertOctagon, Upload, Settings, User, BarChart, LogOut, Shield, Radio, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Radio, label: 'Live Feed', path: '/live' },
  { icon: BarChart, label: 'Analysis', path: '/analysis' },
  { icon: AlertOctagon, label: 'Anomalies', path: '/anomalies' },
  { icon: Upload, label: 'Ingestion', path: '/upload' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const sidebarContent = (
    <>
      <Link href="/" className="mb-10 w-full px-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src="/anomalyze-logo.svg" alt="Anomalyze Logo" className="h-8 w-8" />
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground tracking-tight">
          Anomalyze
        </h1>
      </Link>

      <nav className="w-full px-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-muted/50"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 rounded-xl border border-indigo-500/30"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className={cn(
                  "h-5 w-5 z-10 transition-colors duration-300",
                  isActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "font-medium z-10 transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Panel Link - Only visible to admins */}
      {isAdmin && (
        <div className="w-full px-4 mb-2">
          <Link
            href="/admin/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 group"
          >
            <Shield className="h-5 w-5 transition-colors" />
            <span className="font-medium">Admin Panel</span>
            <span className="ml-auto text-[10px] font-bold uppercase bg-red-500/20 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>
      )}

      <div className="w-full px-4 mb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 group"
        >
          <LogOut className="h-5 w-5 transition-colors group-hover:text-red-400" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      <div className="w-full px-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
          <h4 className="text-sm font-semibold text-foreground mb-1">Status</h4>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Operational
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl glass-card border border-border/50 text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 glass-card m-4 !rounded-2xl border-r-0 z-50 flex-col items-center py-8">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-72 glass-card !rounded-none !rounded-r-2xl border-r-0 z-[70] flex flex-col items-center py-8 md:hidden overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
