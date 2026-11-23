'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { SeverityBadge, CategoryBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Bell, Search, ChevronLeft, ChevronRight, AlertTriangle,
  Shield, Trash2, CheckCircle2, MessageSquarePlus, Clock, User as UserIcon,
  FileWarning, Lightbulb,
} from 'lucide-react';
import { getAlerts, updateAlert, deleteAlert, addAlertNote } from '@/lib/api';
import type { Alert, AlertFilters, AlertStatus, Severity, AttackCategory } from '@/lib/types';
import { useAuth } from '@/components/providers';
import { toast } from 'sonner';

const SEVERITIES: (Severity | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES: (AlertStatus | 'all')[] = ['all', 'New', 'Investigating', 'Resolved'];
const CATEGORIES: (AttackCategory | 'all')[] = ['all', 'Normal', 'Network Scanning', 'Flood / DoS', 'Brute Force', 'Botnet / DDoS', 'MITM / Spoofing', 'MQTT Suspicious Activity', 'IoT Device Attack'];
const TIME_RANGES = ['all', '1h', '24h', '7d', '30d'] as const;

const formatTime = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const statusBadge = (status: AlertStatus) => {
  if (status === 'Resolved') return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="mr-1 h-3 w-3" />{status}</Badge>;
  if (status === 'Investigating') return <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
  return <Badge variant="outline"><AlertTriangle className="mr-1 h-3 w-3" />{status}</Badge>;
};

function AlertsContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [category, setCategory] = useState<AttackCategory | 'all'>('all');
  const [status, setStatus] = useState<AlertStatus | 'all'>('all');
  const [timeRange, setTimeRange] = useState<typeof TIME_RANGES[number]>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState<AlertStatus>('New');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters: AlertFilters = { severity, category, status, timeRange };

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getAlerts(filters);
      let filtered = result;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((a) =>
          a.id.toLowerCase().includes(q) || a.sourceIP.includes(q) ||
          a.destIP.includes(q) || a.predictedLabel.toLowerCase().includes(q) ||
          a.assignedTo.toLowerCase().includes(q)
        );
      }
      setAlerts(filtered);
      setPage(0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [severity, category, status, timeRange, debouncedSearch]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const openAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setNewStatus(alert.status);
    setNoteText('');
    setSheetOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedAlert) return;
    try {
      const updated = await updateAlert(selectedAlert.id, newStatus, noteText || undefined);
      setSelectedAlert(updated);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success(`Alert ${selectedAlert.id} updated to ${newStatus}`);
      setNoteText('');
    } catch {
      toast.error('Failed to update alert');
    }
  };

  const handleAddNote = async () => {
    if (!selectedAlert || !noteText.trim()) return;
    try {
      const updated = await addAlertNote(selectedAlert.id, user?.name || 'Analyst', noteText);
      setSelectedAlert(updated);
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success('Note added');
      setNoteText('');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAlert(deleteId);
      setAlerts((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success('Alert deleted');
      setDeleteId(null);
      if (selectedAlert?.id === deleteId) setSheetOpen(false);
    } catch {
      toast.error('Failed to delete alert');
    } finally {
      setDeleting(false);
    }
  };

  const pageAlerts = alerts.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(alerts.length / pageSize);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
              <p className="mt-1 text-xl font-bold">{alerts.length}</p>
            </div>
            <Bell className="h-8 w-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="mt-1 text-xl font-bold text-red-500">{alerts.filter((a) => a.severity === 'Critical').length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Investigating</p>
              <p className="mt-1 text-xl font-bold text-yellow-500">{alerts.filter((a) => a.status === 'Investigating').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="mt-1 text-xl font-bold text-emerald-500">{alerts.filter((a) => a.status === 'Resolved').length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ID, IP, label..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Severities' : s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AlertStatus | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AttackCategory | 'all')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Time Range</Label>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof TIME_RANGES[number])}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{TIME_RANGES.map((t) => <SelectItem key={t} value={t}>{t === 'all' ? 'All Time' : t === '1h' ? 'Last hour' : t === '24h' ? 'Last 24 hours' : t === '7d' ? 'Last 7 days' : 'Last 30 days'}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Alerts & Incidents</h3>
          <span className="text-xs text-muted-foreground">{alerts.length} alerts</span>
        </div>
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p className="mt-3 text-sm font-medium">Failed to load alerts</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadAlerts}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-muted/30" />)}</div>
        ) : pageAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No alerts found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Alert ID</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Risk</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Source IP</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageAlerts.map((alert) => (
                    <TableRow key={alert.id} className="cursor-pointer text-xs" onClick={() => openAlert(alert)}>
                      <TableCell className="font-mono text-[10px] py-2.5">{alert.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground py-2.5">{formatTime(alert.timestamp)}</TableCell>
                      <TableCell className="py-2.5"><SeverityBadge severity={alert.severity} /></TableCell>
                      <TableCell className="py-2.5">
                        <span className={alert.riskScore >= 85 ? 'font-bold text-red-500' : alert.riskScore >= 65 ? 'font-bold text-orange-500' : 'font-medium'}>{alert.riskScore}</span>
                      </TableCell>
                      <TableCell className="py-2.5"><CategoryBadge category={alert.predictedCategory} /></TableCell>
                      <TableCell className="font-mono text-[10px] py-2.5">{alert.sourceIP}</TableCell>
                      <TableCell className="py-2.5">{statusBadge(alert.status)}</TableCell>
                      <TableCell className="py-2.5 text-xs">{alert.assignedTo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages || 1}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detail Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl scrollbar-thin">
          {selectedAlert && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selectedAlert.id}</SheetTitle>
                <SheetDescription>{selectedAlert.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge severity={selectedAlert.severity} />
                  <CategoryBadge category={selectedAlert.predictedCategory} />
                  <Badge variant="outline" className="text-xs">{selectedAlert.protocol}</Badge>
                  {statusBadge(selectedAlert.status)}
                </div>

                {/* Evidence */}
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold">Supporting Evidence</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedAlert.evidence.map((ev) => (
                      <div key={ev.label} className="flex justify-between rounded-sm bg-muted/30 px-2.5 py-1.5">
                        <span className="text-xs text-muted-foreground">{ev.label}</span>
                        <span className="font-mono text-xs font-medium">{ev.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Original attack label */}
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">Original Attack Label (IoT-SFC v2)</p>
                  <p className="mt-1 text-sm font-semibold">{selectedAlert.predictedLabel}</p>
                </div>

                {/* Recommendations */}
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <p className="text-xs font-semibold">Recommended Defensive Actions</p>
                  </div>
                  <ul className="space-y-2">
                    {selectedAlert.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status change */}
                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold">Change Status</p>
                  <div className="flex gap-2">
                    {(['New', 'Investigating', 'Resolved'] as AlertStatus[]).map((s) => (
                      <Button
                        key={s}
                        variant={newStatus === s ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        disabled={s === 'Resolved' && !isAdmin}
                        onClick={() => setNewStatus(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                  {!isAdmin && (
                    <p className="mt-2 text-[11px] text-muted-foreground">Only Admins can resolve alerts.</p>
                  )}
                  <Button className="mt-3 w-full" size="sm" onClick={handleStatusChange} disabled={newStatus === selectedAlert.status && !noteText}>
                    Apply Status Change
                  </Button>
                </div>

                {/* Notes */}
                <div className="rounded-md border p-4">
                  <p className="mb-3 text-xs font-semibold">Analyst Notes Timeline</p>
                  {selectedAlert.notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes yet. Add the first note below.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedAlert.notes.map((note) => (
                        <div key={note.id} className="rounded-md bg-muted/30 p-3">
                          <div className="flex items-center gap-2 text-xs">
                            <UserIcon className="h-3 w-3 text-primary" />
                            <span className="font-medium">{note.author}</span>
                            <span className="text-muted-foreground">{formatTime(note.timestamp)}</span>
                          </div>
                          <p className="mt-1.5 text-xs">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Add an investigation note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="min-h-[60px] text-xs"
                    />
                    <Button size="sm" className="w-full text-xs" onClick={handleAddNote} disabled={!noteText.trim()}>
                      <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> Add Note
                    </Button>
                  </div>
                </div>

                {/* Delete (Admin only) */}
                {isAdmin && (
                  <div className="rounded-md border border-red-500/20 bg-red-500/5 p-4">
                    <p className="mb-2 text-xs font-semibold text-red-500">Danger Zone</p>
                    <Button variant="destructive" size="sm" className="w-full text-xs" onClick={() => setDeleteId(selectedAlert.id)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Alert
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The alert {deleteId} will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <AlertsContent />
    </ProtectedRoute>
  );
}
