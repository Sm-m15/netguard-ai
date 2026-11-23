'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  accent?: string;
  sublabel?: string;
}

export function KpiCard({ label, value, icon: Icon, trend, accent, sublabel }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={trend.direction === 'up' ? 'text-emerald-500' : 'text-red-500'}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">vs last hour</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            accent || 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
