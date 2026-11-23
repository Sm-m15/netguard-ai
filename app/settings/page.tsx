'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import {
  Users, Sliders, Cpu, Bell, Database, ScrollText,
  ShieldCheck, CheckCircle2, Trash2, Mail, Monitor,
  Activity, HardDrive, Calendar, Server, AlertTriangle,
} from 'lucide-react';
import {
  getUsers, updateUserRole, getSettings, saveSettings,
  getModelVersions, setActiveModel, getAuditLogs, getDatasetInfo,
} from '@/lib/api';
import type { User, Settings as SettingsType, ModelVersion, AuditLog } from '@/lib/types';
import { DATASET_INFO, CATEGORY_COLORS } from '@/lib/types';
import { useAuth } from '@/components/providers';
import { toast } from 'sonner';

const formatTime = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function SettingsContent() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    Promise.all([getUsers(), getSettings(), getModelVersions(), getAuditLogs()])
      .then(([u, s, m, a]) => {
        setUsers(u);
        setSettings(s);
        setModels(m);
        setAuditLogs(a);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, role: 'Admin' | 'Analyst') => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('User role updated');
    } catch {
      toast.error('Failed to update user role');
    }
  };

  const handleSaveThresholds = async () => {
    if (!settings) return;
    setSavingThresholds(true);
    try {
      await saveSettings({ alertThresholds: settings.alertThresholds });
      toast.success('Alert thresholds saved');
    } catch {
      toast.error('Failed to save thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  const handleToggleNotification = async (key: 'email' | 'inApp' | 'slack', value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, notifications: { ...settings.notifications, [key]: value } };
    setSettings(newSettings);
    try {
      await saveSettings({ notifications: newSettings.notifications });
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save notifications');
    }
  };

  const handleSetActiveModel = async (modelId: string) => {
    try {
      const updated = await setActiveModel(modelId);
      setModels((prev) => prev.map((m) => ({ ...m, isActive: m.id === modelId, status: m.id === modelId ? 'active' : 'archived' as const })));
      toast.success(`Model ${updated.version} set as active`);
    } catch {
      toast.error('Failed to set active model');
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-96 animate-pulse rounded-md bg-card/50" />
        <div className="h-96 animate-pulse rounded-lg border bg-card/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-thin">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Users & Roles</TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-1.5 text-xs"><Sliders className="h-3.5 w-3.5" /> Thresholds</TabsTrigger>
            <TabsTrigger value="models" className="gap-1.5 text-xs"><Cpu className="h-3.5 w-3.5" /> Models</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
            <TabsTrigger value="sources" className="gap-1.5 text-xs"><Database className="h-3.5 w-3.5" /> Data Sources</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs"><ScrollText className="h-3.5 w-3.5" /> Audit Log</TabsTrigger>
          </TabsList>
        </div>

        {/* Users & Roles */}
        <TabsContent value="users" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Users & Roles</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Manage team members and their access levels</p>
              </div>
              <Badge variant="outline">{users.length} users</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Last Active</TableHead>
                  <TableHead className="text-xs">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="py-3 text-sm font-medium">{u.name}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant={u.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">
                        {u.role === 'Admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{u.lastActive}</TableCell>
                    <TableCell className="py-3">
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v as 'Admin' | 'Analyst')}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Alert Thresholds */}
        <TabsContent value="thresholds" className="mt-4">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Alert Thresholds</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Set risk score cutoffs for severity levels</p>
            </div>
            <div className="space-y-6 max-w-md">
              {([
                { key: 'medium' as const, label: 'Medium Risk', color: '#eab308', min: 10, max: 50 },
                { key: 'high' as const, label: 'High Risk', color: '#f97316', min: 40, max: 80 },
                { key: 'critical' as const, label: 'Critical Risk', color: '#ef4444', min: 60, max: 100 },
              ]).map((t) => (
                <div key={t.key}>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </Label>
                    <span className="font-bold text-lg" style={{ color: t.color }}>{settings.alertThresholds[t.key]}</span>
                  </div>
                  <Slider
                    value={[settings.alertThresholds[t.key]]}
                    min={t.min}
                    max={t.max}
                    step={1}
                    onValueChange={(v) => setSettings({ ...settings, alertThresholds: { ...settings.alertThresholds, [t.key]: v[0] } })}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Alerts with risk score ≥ {settings.alertThresholds[t.key]} will be classified as {t.label.replace(' Risk', '')}</p>
                </div>
              ))}
              <Button onClick={handleSaveThresholds} disabled={savingThresholds} className="w-full">
                {savingThresholds ? 'Saving...' : 'Save Thresholds'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Model Management */}
        <TabsContent value="models" className="mt-4">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Model Management</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">View model versions and set the active model</p>
            </div>
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.id} className={`rounded-lg border p-4 ${model.isActive ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{model.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{model.version}</Badge>
                        {model.isActive && (
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Dataset: {model.dataset} | {model.columns} columns | {model.records} records | {model.features} features</p>
                      <p className="text-xs text-muted-foreground">Last trained: {formatTime(model.lastTrained)}</p>
                    </div>
                    {!model.isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveModel(model.id)}>
                        Set Active
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[
                      { label: 'Precision', value: model.precision },
                      { label: 'Recall', value: model.recall },
                      { label: 'F1', value: model.f1 },
                      { label: 'PR-AUC', value: model.prAuc },
                      { label: 'FAR', value: model.far },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-md bg-muted/30 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                        <p className="mt-0.5 text-sm font-bold">{(metric.value * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Notification Preferences</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Choose how you receive alerts and updates</p>
            </div>
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive alert summaries and critical incidents via email</p>
                  </div>
                </div>
                <Switch checked={settings.notifications.email} onCheckedChange={(v) => handleToggleNotification('email', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">In-App Notifications</p>
                    <p className="text-xs text-muted-foreground">Show real-time alerts within the application</p>
                  </div>
                </div>
                <Switch checked={settings.notifications.inApp} onCheckedChange={(v) => handleToggleNotification('inApp', v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Slack Integration</p>
                    <p className="text-xs text-muted-foreground">Send critical alerts to your Slack channel</p>
                  </div>
                </div>
                <Switch checked={settings.notifications.slack} onCheckedChange={(v) => handleToggleNotification('slack', v)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Data Sources */}
        <TabsContent value="sources" className="mt-4">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Dataset: IoT-SFC v2 (2026)</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Network intrusion detection dataset</p>
                </div>
                <Badge className="border-primary/30 bg-primary/10 text-primary">
                  <Database className="mr-1.5 h-3 w-3" /> Active
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Records</span></div>
                  <p className="mt-1.5 text-lg font-bold">~49.9M</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2"><Server className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Columns</span></div>
                  <p className="mt-1.5 text-lg font-bold">88</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Normal Traffic</span></div>
                  <p className="mt-1.5 text-lg font-bold text-emerald-500">{DATASET_INFO.normalPercent}%</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Attack Traffic</span></div>
                  <p className="mt-1.5 text-lg font-bold text-orange-500">{DATASET_INFO.attackPercent}%</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Collection Period</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{DATASET_INFO.collectionPeriod}</span>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Architecture</p>
                  <p className="text-sm">Edge–Fog–Cloud IoT/IIoT testbed</p>
                </div>
              </div>

              <div className="mt-4 rounded-md border p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Supported Protocols</p>
                <div className="flex flex-wrap gap-1.5">
                  {DATASET_INFO.protocols.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-md border p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Environments</p>
                <div className="flex flex-wrap gap-1.5">
                  {DATASET_INFO.environments.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-md border p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Devices</p>
                <div className="flex flex-wrap gap-1.5">
                  {DATASET_INFO.devices.map((d) => (
                    <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-md border p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Zeek Log Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {DATASET_INFO.logSources.map((l) => (
                    <Badge key={l} variant="outline" className="font-mono text-xs">{l}</Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Attack labels */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold">Attack Labels (14 types)</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Original labels grouped into detection categories</p>
              <div className="mt-4 space-y-2">
                {DATASET_INFO.attackLabels.filter((a) => a.label !== 'Normal').map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-xs font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} />
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">{DATASET_INFO.labelNote}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Audit Log</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">All user actions and system events</p>
              </div>
              <Badge variant="outline">{auditLogs.length} entries</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Timestamp</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Resource</TableHead>
                  <TableHead className="text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.timestamp)}</TableCell>
                    <TableCell className="py-2.5 text-xs font-medium">{log.user}</TableCell>
                    <TableCell className="py-2.5 text-xs"><Badge variant="outline" className="text-xs">{log.action}</Badge></TableCell>
                    <TableCell className="py-2.5 text-xs font-mono">{log.resource}</TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <SettingsContent />
    </ProtectedRoute>
  );
}
