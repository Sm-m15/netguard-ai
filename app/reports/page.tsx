'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { ChartCard } from '@/components/chart-card';
import { CategoryBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Download, FileText, FileSpreadsheet, Calendar, BarChart3,
  TrendingUp, AlertTriangle, Activity, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { getReports } from '@/lib/api';
import type { ReportData } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import { toast } from 'sonner';

type Range = 'daily' | 'weekly' | 'custom';

function ReportsContent() {
  const [range, setRange] = useState<Range>('weekly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReports(range, customStart || undefined, customEnd || undefined);
      setData(result);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const downloadCsv = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push('NetGuard AI - Security Report');
    rows.push(`Period,${formatDate(data.period.start)} to ${formatDate(data.period.end)}`);
    rows.push('');
    rows.push('Section,Attack Category Summary');
    rows.push('Category,Count,Percent,Avg Risk');
    data.attackSummary.forEach((a) => rows.push(`${a.category},${a.count},${a.percent}%,${a.avgRisk}`));
    rows.push('');
    rows.push('Section,Risk Trend');
    rows.push('Date,Avg Risk,Max Risk,Attacks');
    data.riskTrend.forEach((r) => rows.push(`${formatShortDate(r.date)},${r.avgRisk},${r.maxRisk},${r.attacks}`));
    rows.push('');
    rows.push('Section,Top Flagged Hosts');
    rows.push('IP,Alerts,Flows,Top Category');
    data.topHosts.forEach((h) => rows.push(`${h.ip},${h.alerts},${h.flows},${h.topCategory}`));
    rows.push('');
    rows.push('Section,Model Metrics');
    rows.push(`Precision,${data.modelMetrics.precision}`);
    rows.push(`Recall,${data.modelMetrics.recall}`);
    rows.push(`F1 Score,${data.modelMetrics.f1}`);
    rows.push(`PR-AUC,${data.modelMetrics.prAuc}`);
    rows.push(`False Alarm Rate,${data.modelMetrics.far}`);
    rows.push(`Accuracy,${data.modelMetrics.accuracy}`);
    rows.push('');
    rows.push(`Total Alerts,${data.totalAlerts}`);
    rows.push(`Resolved Alerts,${data.resolvedAlerts}`);
    rows.push(`Critical Alerts,${data.criticalAlerts}`);
    rows.push(`Total Flows Analyzed,${data.totalFlowsAnalyzed}`);

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netguard-report-${range}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded');
  };

  const downloadPdf = () => {
    if (!data) return;
    // Generate a printable HTML report and open print dialog as PDF
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Please allow popups to download PDF');
      return;
    }
    win.document.write(`
      <html><head><title>NetGuard AI Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a2e; }
        h1 { color: #0e7490; border-bottom: 2px solid #0e7490; padding-bottom: 8px; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0fdfa; color: #0e7490; }
        .header { display: flex; justify-content: space-between; }
        .metric { display: inline-block; margin: 8px 16px 8px 0; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .metric span { display: block; font-size: 11px; color: #64748b; }
        .metric strong { font-size: 20px; color: #1a1a2e; }
      </style></head><body>
      <div class="header">
        <h1>NetGuard AI — Security Report</h1>
        <p style="color:#64748b">${formatDate(data.period.start)} — ${formatDate(data.period.end)}<br/>Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div>
        <div class="metric"><span>Total Alerts</span><strong>${data.totalAlerts}</strong></div>
        <div class="metric"><span>Resolved</span><strong>${data.resolvedAlerts}</strong></div>
        <div class="metric"><span>Critical</span><strong>${data.criticalAlerts}</strong></div>
        <div class="metric"><span>Flows Analyzed</span><strong>${data.totalFlowsAnalyzed.toLocaleString()}</strong></div>
      </div>
      <h2>Attack Category Summary</h2>
      <table><tr><th>Category</th><th>Count</th><th>Percent</th><th>Avg Risk</th></tr>
      ${data.attackSummary.map((a) => `<tr><td>${a.category}</td><td>${a.count}</td><td>${a.percent}%</td><td>${a.avgRisk}</td></tr>`).join('')}
      </table>
      <h2>Risk Trend</h2>
      <table><tr><th>Date</th><th>Avg Risk</th><th>Max Risk</th><th>Attacks</th></tr>
      ${data.riskTrend.map((r) => `<tr><td>${formatShortDate(r.date)}</td><td>${r.avgRisk}</td><td>${r.maxRisk}</td><td>${r.attacks}</td></tr>`).join('')}
      </table>
      <h2>Top Flagged Hosts</h2>
      <table><tr><th>IP</th><th>Alerts</th><th>Flows</th><th>Top Category</th></tr>
      ${data.topHosts.map((h) => `<tr><td>${h.ip}</td><td>${h.alerts}</td><td>${h.flows}</td><td>${h.topCategory}</td></tr>`).join('')}
      </table>
      <h2>Model Metrics</h2>
      <table><tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Precision</td><td>${(data.modelMetrics.precision * 100).toFixed(1)}%</td></tr>
      <tr><td>Recall</td><td>${(data.modelMetrics.recall * 100).toFixed(1)}%</td></tr>
      <tr><td>F1 Score</td><td>${(data.modelMetrics.f1 * 100).toFixed(1)}%</td></tr>
      <tr><td>PR-AUC</td><td>${(data.modelMetrics.prAuc * 100).toFixed(1)}%</td></tr>
      <tr><td>False Alarm Rate</td><td>${(data.modelMetrics.far * 100).toFixed(1)}%</td></tr>
      <tr><td>Accuracy</td><td>${(data.modelMetrics.accuracy * 100).toFixed(1)}%</td></tr>
      </table>
      <p style="margin-top:30px;color:#64748b;font-size:11px">Dataset: IoT-SFC v2 (2026) | Model: NetGuard-XGBoost v2.3.1 | Report generated by NetGuard AI</p>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
    toast.success('PDF report opened — use print dialog to save as PDF');
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-96 animate-pulse rounded-md bg-card/50" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg border bg-card/50" />
          <div className="h-72 animate-pulse rounded-lg border bg-card/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Range selector + export */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Report Range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {range === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-40" />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV
            </Button>
            <Button size="sm" onClick={downloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Report period: {formatDate(data.period.start)} — {formatDate(data.period.end)}
        </div>
      </Card>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Total Alerts</p><p className="mt-1 text-xl font-bold">{data.totalAlerts}</p></div>
            <AlertTriangle className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Resolved</p><p className="mt-1 text-xl font-bold text-emerald-500">{data.resolvedAlerts}</p></div>
            <Activity className="h-8 w-8 text-emerald-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Critical Alerts</p><p className="mt-1 text-xl font-bold text-red-500">{data.criticalAlerts}</p></div>
            <AlertTriangle className="h-8 w-8 text-red-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Flows Analyzed</p><p className="mt-1 text-xl font-bold">{(data.totalFlowsAnalyzed / 1_000_000).toFixed(1)}M</p></div>
            <BarChart3 className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
      </div>

      {/* Risk trend + Attack summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Risk Trend" description="Average and maximum risk over the report period">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.riskTrend}>
              <defs>
                <linearGradient id="avgRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} labelFormatter={(l) => formatShortDate(l as string)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="avgRisk" stroke="hsl(var(--chart-1))" fill="url(#avgRisk)" strokeWidth={2} name="Avg Risk" />
              <Area type="monotone" dataKey="maxRisk" stroke="#f97316" fill="none" strokeWidth={2} name="Max Risk" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attack Category Summary" description="Attacks by category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.attackSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.attackSummary.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top hosts + Model metrics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Most Frequently Flagged Hosts</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">IP Address</TableHead>
                <TableHead className="text-xs">Alerts</TableHead>
                <TableHead className="text-xs">Flows</TableHead>
                <TableHead className="text-xs">Top Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topHosts.map((host) => (
                <TableRow key={host.ip}>
                  <TableCell className="font-mono text-xs py-2">{host.ip}</TableCell>
                  <TableCell className="py-2 font-bold">{host.alerts}</TableCell>
                  <TableCell className="py-2">{host.flows.toLocaleString()}</TableCell>
                  <TableCell className="py-2"><CategoryBadge category={host.topCategory} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Model Performance Metrics</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Precision', value: data.modelMetrics.precision, color: '#10b981' },
              { label: 'Recall', value: data.modelMetrics.recall, color: '#0e7490' },
              { label: 'F1 Score', value: data.modelMetrics.f1, color: '#0e7490' },
              { label: 'PR-AUC', value: data.modelMetrics.prAuc, color: '#a855f7' },
              { label: 'Accuracy', value: data.modelMetrics.accuracy, color: '#10b981' },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-bold">{(metric.value * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${metric.value * 100}%`, backgroundColor: metric.color }} />
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">False Alarm Rate</span>
                <span className="font-bold text-orange-500">{(data.modelMetrics.far * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Attack summary table */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Detailed Attack Summary</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Count</TableHead>
              <TableHead className="text-xs">Percentage</TableHead>
              <TableHead className="text-xs">Avg Risk Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.attackSummary.map((a) => (
              <TableRow key={a.category}>
                <TableCell className="py-2"><CategoryBadge category={a.category} /></TableCell>
                <TableCell className="py-2 font-bold">{a.count}</TableCell>
                <TableCell className="py-2">{a.percent}%</TableCell>
                <TableCell className="py-2">{a.avgRisk}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}
