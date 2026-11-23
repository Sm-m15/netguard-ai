'use client';

import React from 'react';
import { useAuth } from '@/components/providers';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main className="min-h-[calc(100vh-4rem)] p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  if (requireAdmin && user.role !== 'Admin') {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold">Access Restricted</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This area is restricted to administrators. Your current role is <span className="font-semibold text-foreground">{user.role}</span>. Contact your administrator if you need elevated access.
          </p>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
