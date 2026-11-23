'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { Role, User } from '@/lib/types';
import { Toaster } from '@/components/ui/sonner';

interface AuthContextValue {
  user: User | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS: Record<Role, User> = {
  Admin: {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@netguard.ai',
    role: 'Admin',
    lastActive: '2 min ago',
  },
  Analyst: {
    id: 'u2',
    name: 'Marcus Reid',
    email: 'marcus.reid@netguard.ai',
    role: 'Analyst',
    lastActive: '5 min ago',
  },
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session is in-memory only (no localStorage per requirements)
    setIsLoading(false);
  }, []);

  const login = (email: string, role: Role) => {
    const baseUser = DEMO_USERS[role];
    setUser({ ...baseUser, email });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        {children}
        <Toaster richColors position="bottom-right" theme="dark" />
      </AuthProvider>
    </NextThemesProvider>
  );
}
