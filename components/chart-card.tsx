'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({ title, description, children, className, action }: ChartCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 sm:p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
