'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/app-shell';
import { ChartCard } from '@/components/chart-card';
import { CategoryBadge } from '@/components/severity-badge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb, Brain, AlertTriangle, TrendingUp, TrendingDown,
  Info, CheckCircle2, Cpu, Database,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { getPredictions, getExplanation } from '@/lib/api';
import type { Prediction, Explanation } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

function ExplainContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loadingPreds, setLoadingPreds] = useState(true);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPredictions()
      .then((preds) => {
        setPredictions(preds);
        if (preds.length > 0) setSelectedId(preds[0].id);
      })
      .catch(() => setError(true))
      .finally(() => setLoadingPreds(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingExplain(true);
    getExplanation(selectedId)
      .then(setExplanation)
      .catch(() => setError(true))
      .finally(() => setLoadingExplain(false));
  }, [selectedId]);

  if (loadingPreds) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-md bg-card/50" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-lg border bg-card/50 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-lg border bg-card/50" />
        </div>
      </div>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-lg font-semibold">No predictions available</h2>
        <p className="mt-1 text-sm text-muted-foreground">Attack predictions will appear here once detected.</p>
      </div>
    );
  }

  const selectedPred = predictions.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Prediction selector */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Select a Prediction to Explain</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {predictions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} — {p.predictedLabel} (Risk: {p.riskScore})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedPred && (
            <div className="flex flex-wrap gap-2">
              <CategoryBadge category={selectedPred.predictedCategory} />
              <Badge variant="outline" className="text-xs">Risk: {selectedPred.riskScore}</Badge>
              <Badge variant="outline" className="text-xs">Anomaly: {selectedPred.anomalyScore.toFixed(2)}</Badge>
            </div>
          )}
        </div>
      </Card>

      {loadingExplain || !explanation ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-lg border bg-card/50 lg:col-span-2" />
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-lg border bg-card/50" />
            <div className="h-48 animate-pulse rounded-lg border bg-card/50" />
          </div>
        </div>
      ) : (
        <>
          {/* Feature contributions + side panel */}
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title="Feature Contributions (SHAP-style)"
              description="How each feature contributes to the prediction — positive increases risk, negative decreases it"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={explanation.contributions} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis type="category" dataKey="feature" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} width={140} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => v.toFixed(3)}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {explanation.contributions.map((c, i) => (
                      <Cell key={i} fill={c.direction === 'positive' ? '#ef4444' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Increases risk</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Decreases risk</span>
              </div>
            </ChartCard>

            <div className="space-y-4">
              {/* Confidence */}
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Confidence Level</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Model Confidence</span>
                      <span className="font-bold text-primary">{Math.round(explanation.confidence * 100)}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${explanation.confidence * 100}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-muted/30 p-2">
                      <span className="text-muted-foreground">Risk Score</span>
                      <p className="mt-0.5 text-lg font-bold">{explanation.riskScore}</p>
                    </div>
                    <div className="rounded-md bg-muted/30 p-2">
                      <span className="text-muted-foreground">Base Value</span>
                      <p className="mt-0.5 text-lg font-bold">{explanation.baseValue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Model info */}
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Model Information</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">NetGuard-XGBoost</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">{explanation.modelVersion}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Dataset</span><span className="font-medium">IoT-SFC v2 (2026)</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Flow ID</span><span className="font-mono">{explanation.flowId}</span></div>
                </div>
              </Card>
            </div>
          </div>

          {/* Plain English explanation */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Plain-English Explanation</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{explanation.plainEnglish}</p>
          </Card>

          {/* Model limitations */}
          <Card className="p-5 border-yellow-500/20 bg-yellow-500/5">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">Model Limitations</h3>
            </div>
            <ul className="space-y-2.5">
              {explanation.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                  <span className="text-muted-foreground">{lim}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Top contributing features summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explanation.contributions.slice(0, 4).map((c) => (
              <Card key={c.feature} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{c.feature}</p>
                  {c.direction === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <p className="mt-2 text-lg font-bold" style={{ color: c.direction === 'positive' ? '#ef4444' : '#10b981' }}>
                  {c.contribution > 0 ? '+' : ''}{c.contribution.toFixed(3)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Feature value: {c.value.toFixed(2)}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ExplainPage() {
  return (
    <ProtectedRoute>
      <ExplainContent />
    </ProtectedRoute>
  );
}
