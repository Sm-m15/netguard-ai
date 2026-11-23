'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import {
  LayoutDashboard, Network, TrendingUp, Bell, Lightbulb,
  FileBarChart, Settings, ShieldCheck, Lock,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/traffic', label: 'Traffic Explorer', icon: Network },
  { href: '/forecast', label: 'Forecasting', icon: TrendingUp },
  { href: '/alerts', label: 'Alerts & Incidents', icon: Bell },
  { href: '/explain', label: 'AI Explanation', icon: Lightbulb },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'Admin');

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/50 bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">NetGuard AI</p>
          <p className="truncate text-[10px] text-muted-foreground">Attack Forecasting</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 shrink-0', active ? 'text-primary' : 'group-hover:text-sidebar-foreground')} style={{ width: 18, height: 18 }} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2 rounded-md bg-sidebar-foreground/5 px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] text-muted-foreground">Model v2.3.1 active</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'Admin');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-1 py-1.5 lg:hidden">
      {items.slice(0, 5).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
