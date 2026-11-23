'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Severity } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/types';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  withDot?: boolean;
}

export function SeverityBadge({ severity, className, withDot = true }: SeverityBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colors.bg,
        colors.text,
        className
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />}
      {severity}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const isNormal = category === 'Normal';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isNormal
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
          : 'border-primary/30 bg-primary/10 text-primary',
        className
      )}
    >
      {category}
    </span>
  );
}
