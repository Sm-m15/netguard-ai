'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { KpiCard } from '@/components/kpi-card';
import { ChartCard } from '@/components/chart-card';
import { RiskGauge } from '@/components/risk-gauge';
import { SeverityBadge, CategoryBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, AlertTriangle, Network, Gauge, Database,
  CheckCircle2, Cpu, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getDashboardSummary } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import Link from 'next/link';

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const formatNumber = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

function DashboardContent() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-lg font-semibold">Failed to load dashboard data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please try refreshing the page.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-card/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg border bg-card/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Flows Analyzed"
          value={formatNumber(data.totalFlows)}
          icon={Activity}
          trend={{ value: 12, direction: 'up' }}
          sublabel="Last 24 hours"
        />
        <KpiCard
          label="Total Packets"
          value={formatNumber(data.totalPackets)}
          icon={Network}
          trend={{ value: 8, direction: 'up' }}
          accent="bg-blue-500/10 text-blue-500"
        />
        <KpiCard
          label="Suspicious Traffic"
          value={`${data.suspiciousPercent}%`}
          icon={AlertTriangle}
          trend={{ value: 3, direction: 'down' }}
          accent="bg-orange-500/10 text-orange-500"
          sublabel="IoT-SFC v2 baseline: 18.56%"
        />
        <KpiCard
          label="Current Risk Score"
          value={`${data.riskScore}/100`}
          icon={Gauge}
          accent="bg-red-500/10 text-red-500"
          sublabel={data.riskScore >= 65 ? 'High risk' : data.riskScore >= 35 ? 'Medium risk' : 'Low risk'}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Traffic Volume Over Time"
          description="Normal vs suspicious flows per hour"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trafficVolume}>
              <defs>
                <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CATEGORY_COLORS.Normal} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CATEGORY_COLORS.Normal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CATEGORY_COLORS['Flood / DoS']} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={CATEGORY_COLORS['Flood / DoS']} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="time" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => formatTime(l as string)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="normal" stroke={CATEGORY_COLORS.Normal} fill="url(#normalGrad)" strokeWidth={2} name="Normal" />
              <Area type="monotone" dataKey="suspicious" stroke={CATEGORY_COLORS['Flood / DoS']} fill="url(#suspGrad)" strokeWidth={2} name="Suspicious" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Score Gauge" description="Current overall network risk">
          <div className="flex flex-col items-center justify-center py-2">
            <RiskGauge value={data.riskScore} label={data.riskScore >= 65 ? 'HIGH' : data.riskScore >= 35 ? 'MEDIUM' : 'LOW'} sublabel="Live risk score" size={180} />
            <div className="mt-4 flex gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-500"><CheckCircle2 className="mr-1 h-3 w-3" /> System Active</Badge>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Risk Score Over Time" description="24-hour risk trend with forecast" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.riskTrend}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="time" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(l) => formatTime(l as string)}
              />
              <Line type="monotone" dataKey="risk" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Risk Score" />
              <Line type="monotone" dataKey="forecast" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Predicted Attack Distribution" description="By attack category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.categoryDistribution.filter((d) => d.category !== 'Normal')}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {data.categoryDistribution.filter((d) => d.category !== 'Normal').map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Normal vs Suspicious Traffic" description="Flow counts by category">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.categoryDistribution.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.categoryDistribution.slice(0, 8).map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Source IPs" description="Most active attack sources">
          <div className="space-y-3">
            {data.topSourceIPs.map((ip, i) => (
              <div key={ip.ip} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium font-mono">{ip.ip}</span>
                    <span className="text-xs text-muted-foreground">{ip.attacks} attacks</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(ip.attacks / data.topSourceIPs[0].attacks) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Model Status */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Model Status</h3>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Model</span>
              <span className="ml-auto font-medium">{data.modelStatus.name}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Dataset</span>
              <span className="ml-auto font-medium">IoT-SFC v2 (2026)</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="ml-auto font-mono text-xs">{data.modelStatus.version}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Last Trained</span>
              <span className="ml-auto text-xs">{new Date(data.modelStatus.lastTrained).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Data Freshness</span>
              <span className="ml-auto text-xs text-emerald-500">Real-time</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted/50 p-2">
                  <span className="text-muted-foreground">Precision</span>
                  <p className="mt-0.5 font-bold">{(data.modelStatus.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <span className="text-muted-foreground">Recall</span>
                  <p className="mt-0.5 font-bold">{(data.modelStatus.recall * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Alerts</h3>
          <Link href="/alerts">
            <Button variant="ghost" size="sm" className="text-xs">View all →</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Alert ID</th>
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Severity</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Source IP</th>
                <th className="pb-2 pr-4 font-medium">Risk</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAlerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2.5 pr-4 font-mono text-xs">{alert.id}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 pr-4"><SeverityBadge severity={alert.severity} /></td>
                  <td className="py-2.5 pr-4"><CategoryBadge category={alert.predictedCategory} /></td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{alert.sourceIP}</td>
                  <td className="py-2.5 pr-4 font-medium">{alert.riskScore}</td>
                  <td className="py-2.5">
                    <Badge variant={alert.status === 'Resolved' ? 'default' : alert.status === 'Investigating' ? 'secondary' : 'outline'} className="text-xs">
                      {alert.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
