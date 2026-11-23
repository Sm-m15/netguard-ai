'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { ChartCard } from '@/components/chart-card';
import { SeverityBadge, CategoryBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Upload, FileUp, Search, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Network, Activity,
  ArrowUpDown, FileText, Database,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getTrafficFlows, uploadCsv, CSV_REQUIRED_COLUMNS, CSV_OPTIONAL_COLUMNS } from '@/lib/api';
import type { Flow, TrafficFilters, ValidationSummary, Protocol, AttackCategory, Severity } from '@/lib/types';
import { CATEGORY_COLORS, DATASET_INFO } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers';

const PROTOCOLS: (Protocol | 'all')[] = ['all', 'TCP', 'UDP', 'MQTT', 'HTTP', 'CoAP', 'Modbus'];
const RISK_LEVELS: (Severity | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];
const CATEGORIES: (AttackCategory | 'all')[] = ['all', 'Normal', 'Network Scanning', 'Flood / DoS', 'Brute Force', 'Botnet / DDoS', 'MITM / Spoofing', 'MQTT Suspicious Activity', 'IoT Device Attack'];
const TIME_RANGES = ['all', '1h', '6h', '24h', '7d'] as const;

const formatTime = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatBytes = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : n >= 1000 ? `${(n / 1000).toFixed(1)} KB` : `${n} B`;

function TrafficContent() {
  const { user } = useAuth();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [protocol, setProtocol] = useState<Protocol | 'all'>('all');
  const [srcIP, setSrcIP] = useState('');
  const [destIP, setDestIP] = useState('');
  const [riskLevel, setRiskLevel] = useState<Severity | 'all'>('all');
  const [category, setCategory] = useState<AttackCategory | 'all'>('all');
  const [timeRange, setTimeRange] = useState<typeof TIME_RANGES[number]>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters: TrafficFilters = { search: debouncedSearch, protocol, srcIP, destIP, riskLevel, category, timeRange };

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTrafficFlows(filters);
      setFlows(result.flows);
      setTotal(result.total);
      setPage(0);
    } catch {
      toast.error('Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, protocol, srcIP, destIP, riskLevel, category, timeRange]);

  useEffect(() => { loadFlows(); }, [loadFlows]);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadCsv(file);
      setValidation(result);
      setShowPreview(true);
      if (result.status === 'pass') {
        toast.success(`CSV validated: ${result.rows.toLocaleString()} rows, ${result.columns} columns`);
      } else if (result.status === 'warn') {
        toast.warning(`CSV validated with warnings: ${result.rows.toLocaleString()} rows`);
      } else {
        toast.error(`CSV validation failed: ${result.missingRequired.length} required columns missing`);
      }
    } catch {
      toast.error('Failed to process CSV file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const pageFlows = flows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(flows.length / pageSize);

  // Stats
  const protocolDist = useMemo(() => {
    const dist: Record<string, number> = {};
    flows.forEach((f) => { dist[f.protocol] = (dist[f.protocol] || 0) + 1; });
    return Object.entries(dist).map(([protocol, count]) => ({ protocol, count }));
  }, [flows]);

  const totalBytes = flows.reduce((s, f) => s + f.srcBytes + f.destBytes, 0);
  const totalPackets = flows.reduce((s, f) => s + f.srcPackets + f.destPackets, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CSV Upload */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Upload IoT-SFC v2 Traffic Data</h3>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-all ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className={`mx-auto h-10 w-10 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="mt-3 text-sm font-medium">
            {dragActive ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse — IoT-SFC v2 format with {CSV_REQUIRED_COLUMNS.length} required columns
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <><span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Processing...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Select CSV File</>
            )}
          </Button>
        </div>

        {/* Validation Summary */}
        {validation && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Validation Summary</h4>
              <div className="flex items-center gap-2">
                {validation.status === 'pass' && (
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="mr-1 h-3 w-3" /> Pass</Badge>
                )}
                {validation.status === 'warn' && (
                  <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500"><AlertTriangle className="mr-1 h-3 w-3" /> Warnings</Badge>
                )}
                {validation.status === 'fail' && (
                  <Badge className="border-red-500/30 bg-red-500/10 text-red-500"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setValidation(null); setShowPreview(false); }}>Dismiss</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Rows</p>
                <p className="mt-1 text-lg font-bold">{validation.rows.toLocaleString()}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">Pass</Badge>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Columns</p>
                <p className="mt-1 text-lg font-bold">{validation.columns}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">Pass</Badge>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Missing Values</p>
                <p className="mt-1 text-lg font-bold">{validation.missingValues}</p>
                <Badge variant="outline" className={`mt-1 text-[10px] ${validation.missingValues > 10 ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                  {validation.missingValues > 10 ? 'Warn' : 'Pass'}
                </Badge>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Duplicates</p>
                <p className="mt-1 text-lg font-bold">{validation.duplicates}</p>
                <Badge variant="outline" className={`mt-1 text-[10px] ${validation.duplicates > 10 ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                  {validation.duplicates > 10 ? 'Warn' : 'Pass'}
                </Badge>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Invalid Values</p>
                <p className="mt-1 text-lg font-bold">{validation.invalidValues}</p>
                <Badge variant="outline" className={`mt-1 text-[10px] ${validation.invalidValues > 5 ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`}>
                  {validation.invalidValues > 5 ? 'Warn' : 'Pass'}
                </Badge>
              </div>
            </div>

            {validation.missingRequired.length > 0 && (
              <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-xs font-semibold text-red-500">Missing Required Columns ({validation.missingRequired.length})</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {validation.missingRequired.map((col) => (
                    <Badge key={col} variant="outline" className="border-red-500/30 text-red-500 text-[10px]">{col}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Detected Columns ({validation.detectedColumns.length})</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {validation.detectedColumns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-[10px]">{col}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Optional Protocol Columns Present ({validation.optionalPresent.length})</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {validation.optionalPresent.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground">None detected — protocol-specific fields will be sparse</span>
                  ) : (
                    validation.optionalPresent.map((col) => (
                      <Badge key={col} variant="outline" className="border-primary/30 text-primary text-[10px]">{col}</Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            {showPreview && validation.preview.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Data Preview (first {validation.preview.length} rows)</span>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {Object.keys(validation.preview[0]).slice(0, 10).map((col) => (
                          <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.slice(0, 8).map((row, i) => (
                        <tr key={i} className="border-t border-border/50">
                          {Object.values(row).slice(0, 10).map((val, j) => (
                            <td key={j} className="whitespace-nowrap px-3 py-1.5 font-mono text-[10px]">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              Validated {validation.sampleSize} sampled rows of ~{validation.rows.toLocaleString()} total. Large datasets are sampled to avoid memory issues.
            </div>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Flows</p>
              <p className="mt-1 text-xl font-bold">{total}</p>
            </div>
            <Network className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Bytes</p>
              <p className="mt-1 text-xl font-bold">{formatBytes(totalBytes)}</p>
            </div>
            <Activity className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Packets</p>
              <p className="mt-1 text-xl font-bold">{totalPackets.toLocaleString()}</p>
            </div>
            <ArrowUpDown className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Suspicious</p>
              <p className="mt-1 text-xl font-bold text-orange-500">
                {flows.filter((f) => f.isAttack).length} ({total > 0 ? Math.round((flows.filter((f) => f.isAttack).length / total) * 100) : 0}%)
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500/30" />
          </div>
        </Card>
      </div>

      {/* Protocol Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Protocol Distribution" description="Traffic by protocol type">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={protocolDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="protocol" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Attack Category Distribution" description="Detected attack types">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={flows.filter((f) => f.isAttack).reduce((acc, f) => {
                  const existing = acc.find((a) => a.category === f.attackCategory);
                  if (existing) existing.count++;
                  else acc.push({ category: f.attackCategory, count: 1 });
                  return acc;
                }, [] as { category: string; count: number }[])}
                dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}
              >
                {flows.filter((f) => f.isAttack).reduce((acc, f) => {
                  if (!acc.find((a) => a.category === f.attackCategory)) acc.push({ category: f.attackCategory, count: 1 });
                  return acc;
                }, [] as { category: string; count: number }[]).map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as AttackCategory]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="IP, ID, label..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Protocol</Label>
            <Select value={protocol} onValueChange={(v) => setProtocol(v as Protocol | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PROTOCOLS.map((p) => <SelectItem key={p} value={p}>{p === 'all' ? 'All Protocols' : p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Risk Level</Label>
            <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as Severity | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{RISK_LEVELS.map((r) => <SelectItem key={r} value={r}>{r === 'all' ? 'All Risk Levels' : r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Attack Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AttackCategory | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Source IP</Label>
            <Input placeholder="192.168.x.x" value={srcIP} onChange={(e) => setSrcIP(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Destination IP</Label>
            <Input placeholder="192.168.x.x" value={destIP} onChange={(e) => setDestIP(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Time Range</Label>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof TIME_RANGES[number])}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TIME_RANGES.map((t) => <SelectItem key={t} value={t}>{t === 'all' ? 'All Time' : t === '1h' ? 'Last hour' : t === '6h' ? 'Last 6 hours' : t === '24h' ? 'Last 24 hours' : 'Last 7 days'}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="w-full h-9" onClick={() => { setSearch(''); setProtocol('all'); setSrcIP(''); setDestIP(''); setRiskLevel('all'); setCategory('all'); setTimeRange('all'); }}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Traffic Table */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Traffic Flows</h3>
          <span className="text-xs text-muted-foreground">{total} records</span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-muted/30" />)}
          </div>
        ) : pageFlows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No traffic flows found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">Flow ID</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Time</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Source</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Destination</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Proto</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Service</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Duration</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Bytes</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Category</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageFlows.map((flow) => (
                    <TableRow
                      key={flow.id}
                      className="cursor-pointer text-xs"
                      onClick={() => { setSelectedFlow(flow); setSheetOpen(true); }}
                    >
                      <TableCell className="font-mono text-[10px] py-2.5">{flow.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground py-2.5">{formatTime(flow.timestamp)}</TableCell>
                      <TableCell className="font-mono py-2.5">
                        <div>{flow.srcIP}</div>
                        <div className="text-[10px] text-muted-foreground">:{flow.srcPort}</div>
                      </TableCell>
                      <TableCell className="font-mono py-2.5">
                        <div>{flow.destIP}</div>
                        <div className="text-[10px] text-muted-foreground">:{flow.destPort}</div>
                      </TableCell>
                      <TableCell className="py-2.5"><Badge variant="outline" className="text-[10px]">{flow.protocol}</Badge></TableCell>
                      <TableCell className="py-2.5">{flow.service}</TableCell>
                      <TableCell className="py-2.5">{flow.duration}s</TableCell>
                      <TableCell className="py-2.5">{formatBytes(flow.srcBytes + flow.destBytes)}</TableCell>
                      <TableCell className="py-2.5"><CategoryBadge category={flow.attackCategory} /></TableCell>
                      <TableCell className="py-2.5">
                        <span className={flow.riskScore >= 65 ? 'font-bold text-red-500' : flow.riskScore >= 35 ? 'font-bold text-orange-500' : 'font-medium text-emerald-500'}>
                          {flow.riskScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages || 1} ({flows.length} results)
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg scrollbar-thin">
          {selectedFlow && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selectedFlow.id}</SheetTitle>
                <SheetDescription>
                  Flow detail and AI prediction
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <CategoryBadge category={selectedFlow.attackCategory} />
                  <SeverityBadge severity={selectedFlow.riskScore >= 85 ? 'Critical' : selectedFlow.riskScore >= 65 ? 'High' : selectedFlow.riskScore >= 35 ? 'Medium' : 'Low'} />
                  <Badge variant="outline" className="text-xs">{selectedFlow.protocol}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedFlow.zeekLog}</Badge>
                </div>

                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">Connection Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-muted-foreground">Timestamp</span><p className="font-mono text-xs">{formatTime(selectedFlow.timestamp)}</p></div>
                    <div><span className="text-xs text-muted-foreground">Duration</span><p className="font-medium">{selectedFlow.duration}s</p></div>
                    <div><span className="text-xs text-muted-foreground">Source IP:Port</span><p className="font-mono text-xs">{selectedFlow.srcIP}:{selectedFlow.srcPort}</p></div>
                    <div><span className="text-xs text-muted-foreground">Dest IP:Port</span><p className="font-mono text-xs">{selectedFlow.destIP}:{selectedFlow.destPort}</p></div>
                    <div><span className="text-xs text-muted-foreground">Protocol</span><p className="font-medium">{selectedFlow.protocol}</p></div>
                    <div><span className="text-xs text-muted-foreground">Service</span><p className="font-medium">{selectedFlow.service}</p></div>
                    <div><span className="text-xs text-muted-foreground">Connection State</span><p className="font-mono text-xs">{selectedFlow.connState}</p></div>
                    <div><span className="text-xs text-muted-foreground">Zeek Log</span><p className="font-mono text-xs">{selectedFlow.zeekLog}</p></div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">Traffic Statistics</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-muted-foreground">Source Bytes</span><p className="font-medium">{selectedFlow.srcBytes.toLocaleString()}</p></div>
                    <div><span className="text-xs text-muted-foreground">Dest Bytes</span><p className="font-medium">{selectedFlow.destBytes.toLocaleString()}</p></div>
                    <div><span className="text-xs text-muted-foreground">Source Packets</span><p className="font-medium">{selectedFlow.srcPackets.toLocaleString()}</p></div>
                    <div><span className="text-xs text-muted-foreground">Dest Packets</span><p className="font-medium">{selectedFlow.destPackets.toLocaleString()}</p></div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">IoT Device & Environment</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">Device</span><span className="font-medium">{selectedFlow.device || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-muted-foreground">Environment</span><span className="font-medium">{selectedFlow.environment || '-'}</span></div>
                  </div>
                </div>

                {/* Protocol-specific info */}
                {selectedFlow.mqtt && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-primary">MQTT Activity</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-xs text-muted-foreground">Type</span><p className="font-medium text-xs">{selectedFlow.mqtt.type}</p></div>
                      <div><span className="text-xs text-muted-foreground">QoS</span><p className="font-medium">{selectedFlow.mqtt.qos}</p></div>
                      {selectedFlow.mqtt.topic && <div className="col-span-2"><span className="text-xs text-muted-foreground">Topic</span><p className="font-mono text-xs">{selectedFlow.mqtt.topic}</p></div>}
                      <div><span className="text-xs text-muted-foreground">Retain</span><p className="font-medium">{selectedFlow.mqtt.retain ? 'Yes' : 'No'}</p></div>
                    </div>
                  </div>
                )}
                {selectedFlow.http && (
                  <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-blue-500">HTTP Info</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Method</span><span className="font-medium text-xs">{selectedFlow.http.method}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">URI</span><span className="font-mono text-xs">{selectedFlow.http.uri}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Status</span><span className="font-medium">{selectedFlow.http.statusCode}</span></div>
                      {selectedFlow.http.userAgent && <div className="flex justify-between"><span className="text-xs text-muted-foreground">User-Agent</span><span className="font-mono text-xs">{selectedFlow.http.userAgent}</span></div>}
                    </div>
                  </div>
                )}
                {selectedFlow.dns && (
                  <div className="rounded-md border border-purple-500/20 bg-purple-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-purple-500">DNS Info</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Query</span><span className="font-mono text-xs">{selectedFlow.dns.query}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">RCode</span><span className="font-medium text-xs">{selectedFlow.dns.rcode}</span></div>
                    </div>
                  </div>
                )}
                {selectedFlow.ssh && (
                  <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-orange-500">SSH Info</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Version</span><span className="font-mono text-xs">{selectedFlow.ssh.version}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Auth Success</span><span className="font-medium text-xs">{selectedFlow.ssh.authSuccess ? 'Yes' : 'No'}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Attempts</span><span className="font-medium">{selectedFlow.ssh.attempts}</span></div>
                    </div>
                  </div>
                )}
                {selectedFlow.ssl && (
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-emerald-500">SSL/TLS Info</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Version</span><span className="font-medium text-xs">{selectedFlow.ssl.version}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-muted-foreground">Cipher</span><span className="font-mono text-xs">{selectedFlow.ssl.cipher}</span></div>
                      {selectedFlow.ssl.subject && <div className="flex justify-between"><span className="text-xs text-muted-foreground">Subject</span><span className="font-mono text-xs">{selectedFlow.ssl.subject}</span></div>}
                    </div>
                  </div>
                )}

                {/* Prediction */}
                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">AI Prediction</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Predicted Label</span>
                      <span className="font-medium text-xs">{selectedFlow.predictedLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Risk Score</span>
                      <span className={`font-bold ${selectedFlow.riskScore >= 65 ? 'text-red-500' : selectedFlow.riskScore >= 35 ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {selectedFlow.riskScore}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Anomaly Score</span>
                      <span className="font-medium">{selectedFlow.anomalyScore.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Classification</span>
                      <span className={`font-medium ${selectedFlow.isAttack ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedFlow.isAttack ? 'Attack' : 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function TrafficPage() {
  return (
    <ProtectedRoute>
      <TrafficContent />
    </ProtectedRoute>
  );
}
