'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sun, Moon, Bell, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Operations Dashboard',
  '/traffic': 'Traffic Explorer',
  '/forecast': 'Attack Forecasting',
  '/alerts': 'Alerts & Incidents',
  '/explain': 'AI Explanation',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings & Administration',
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [lastUpdate] = useState(() => new Date());

  const title = PAGE_TITLES[pathname] || 'NetGuard AI';

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Last data update: {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary sm:inline-flex">
          Model v2.3.1
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none">{user?.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{user?.role}</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold">{user?.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            {user?.role === 'Admin' && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
