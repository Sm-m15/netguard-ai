'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Severity } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/types';

interface RiskGaugeProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  thresholds?: { medium: number; high: number; critical: number };
}

export function RiskGauge({
  value,
  max = 100,
  size = 200,
  label,
  sublabel,
  className,
  thresholds = { medium: 35, high: 65, critical: 85 },
}: RiskGaugeProps) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - pct * 0.75);

  const severity: Severity =
    value >= thresholds.critical ? 'Critical' :
    value >= thresholds.high ? 'High' :
    value >= thresholds.medium ? 'Medium' : 'Low';
  const color = SEVERITY_COLORS[severity];

  return (
    <div className={cn('relative flex flex-col items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={12}
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
          opacity={0.3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.hex}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight" style={{ color: color.hex }}>
          {value}
        </span>
        {label && (
          <span className="mt-1 text-sm font-medium" style={{ color: color.hex }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-xs text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
