'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { ChartCard } from '@/components/chart-card';
import { RiskGauge } from '@/components/risk-gauge';
import { SeverityBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, Activity, AlertTriangle, Gauge } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ReferenceArea, ReferenceLine, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { getForecast } from '@/lib/api';
import type { ForecastResult } from '@/lib/types';
import { CATEGORY_COLORS, SEVERITY_COLORS } from '@/lib/types';

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

function renderAnomalyDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return <g key={`empty-${cx ?? 0}`} />;
  if (payload.flagged) {
    return <circle key={`flag-${cx}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1} />;
  }
  return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={2} fill="hsl(var(--chart-1))" />;
}

function ForecastContent() {
  const [horizon, setHorizon] = useState<5 | 15 | 30>(15);
  const [data, setData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getForecast(horizon)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [horizon]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-lg font-semibold">Failed to load forecast</h2>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-md bg-card/50" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-lg border bg-card/50" />
          <div className="h-80 animate-pulse rounded-lg border bg-card/50 lg:col-span-2" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg border bg-card/50" />
          <div className="h-72 animate-pulse rounded-lg border bg-card/50" />
        </div>
      </div>
    );
  }

  const sevColor = SEVERITY_COLORS[data.riskLevel];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Horizon Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Forecast horizon:</span>
          <div className="flex gap-1.5">
            {([5, 15, 30] as const).map((h) => (
              <Button
                key={h}
                variant={horizon === h ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHorizon(h)}
              >
                {h} min
              </Button>
            ))}
          </div>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          <Activity className="mr-1.5 h-3 w-3" /> Live forecast
        </Badge>
      </div>

      {/* Top row: Gauge + Info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6">
          <RiskGauge value={data.riskScore} label={data.riskLevel.toUpperCase()} sublabel={`Next ${horizon} min`} size={200} />
          <div className="mt-4 flex flex-col items-center gap-2">
            <SeverityBadge severity={data.riskLevel} />
            <p className="text-xs text-muted-foreground">
              Estimated attack risk in the next {horizon} minutes: <span className="font-bold text-foreground">{data.riskScore}%</span>
            </p>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Forecast Confidence</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Model confidence in this prediction</p>
            </div>
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confidence Level</span>
                <span className="font-bold" style={{ color: sevColor.hex }}>{Math.round(data.confidence * 100)}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${data.confidence * 100}%`, backgroundColor: sevColor.hex }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-md border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: sevColor.hex }}>{data.riskScore}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Horizon</p>
                <p className="mt-1 text-2xl font-bold">{horizon}m</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Top Category</p>
                <p className="mt-1 text-sm font-bold" style={{ color: CATEGORY_COLORS[data.categoryProbabilities[0].category] }}>
                  {data.categoryProbabilities[0].category}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Predictions are probability estimates, not confirmed attacks. A high anomaly score may be a legitimate traffic spike.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk over time with forecast region */}
      <ChartCard
        title="Risk Over Time — Historical & Forecast"
        description={`Historical risk with ${horizon}-minute forecast region (shaded)`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.riskTimeline}>
            <defs>
              <linearGradient id="histRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sevColor.hex} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sevColor.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              labelFormatter={(l) => formatTime(l as string)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceArea y1={0} y2={35} fill="#10b981" fillOpacity={0.03} />
            <ReferenceArea y1={35} y2={65} fill="#eab308" fillOpacity={0.03} />
            <ReferenceArea y1={65} y2={85} fill="#f97316" fillOpacity={0.03} />
            <ReferenceArea y1={85} y2={100} fill="#ef4444" fillOpacity={0.03} />
            <Area type="monotone" dataKey="historical" stroke="hsl(var(--chart-1))" fill="url(#histRisk)" strokeWidth={2} name="Historical Risk" connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke={sevColor.hex} fill="url(#forecastRisk)" strokeWidth={2} strokeDasharray="5 5" name="Forecast Risk" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Category probability + Anomaly timeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Predicted Attack Category Probabilities" description="Likelihood by attack category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.categoryProbabilities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
              <XAxis type="number" domain={[0, 0.5]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} width={130} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              />
              <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                {data.categoryProbabilities.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Anomaly Score Timeline" description="Real-time anomaly detection with flagged points">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.anomalyTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="time" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 1]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => formatTime(l as string)}
              />
              <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Anomaly threshold', fontSize: 10, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={renderAnomalyDot} name="Anomaly Score" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Baseline comparison */}
      <ChartCard
        title="Current vs Historical Baseline"
        description="Comparison of current traffic metrics against the established baseline"
      >
        <div className="space-y-4">
          {data.baselineComparison.map((metric) => {
            const isIncrease = metric.delta > 0;
            return (
              <div key={metric.metric} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.metric}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Baseline: {metric.baseline.toLocaleString()}</span>
                    <span className="font-bold">{metric.current.toLocaleString()}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                      {isIncrease ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                      {isIncrease ? '+' : ''}{metric.delta}%
                    </span>
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-muted-foreground/40" style={{ width: `${Math.min(100, (metric.baseline / Math.max(metric.current, metric.baseline)) * 100)}%` }} />
                  <div className={`h-full ${isIncrease ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (metric.current / Math.max(metric.current, metric.baseline)) * 100) - Math.min(100, (metric.baseline / Math.max(metric.current, metric.baseline)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );
}

export default function ForecastPage() {
  return (
    <ProtectedRoute>
      <ForecastContent />
    </ProtectedRoute>
  );
}
