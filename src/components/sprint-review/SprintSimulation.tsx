'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Brain,
  Info,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { slideInStyle, barGrowStyle } from '@/lib/sprint-review-config';
import type { SprintTicket, ExcludedTicket } from '@/lib/mock-data';

// ── Types ──

interface SprintSimulationProps {
  capacity: number;
  totalPlanned: number;
  highRiskCount?: number;
  /** Full list of AI-recommended tickets (before user removals). */
  recommendedTickets?: SprintTicket[];
  /** All excluded tickets from the AI plan. */
  excludedTickets?: ExcludedTicket[];
  /** Called when the user applies a simulated plan change. */
  onApply?: (added: string[], removed: string[]) => void;
}

interface SimOutcome {
  scenario: string;
  points: number;
  probability: number;
  color: string;
}

// ── Core computation ──

export function computeOutcomes(
  totalPlanned: number,
  capacity: number,
  highRiskCount: number
): SimOutcome[] {
  const loadPct = capacity > 0 ? totalPlanned / capacity : 0;
  const riskPenalty = Math.min(highRiskCount * 2, 15);
  const bestMult = 1.0;
  const likelyMult = 0.92 - (loadPct > 0.9 ? 0.08 : 0) - riskPenalty / 100;
  const conservativeMult =
    0.82 - (loadPct > 0.95 ? 0.05 : 0) - riskPenalty / 100;
  const worstMult = 0.65 - riskPenalty / 100;
  return [
    {
      scenario: 'Best Case',
      points: Math.round(totalPlanned * bestMult),
      probability: loadPct > 0.85 ? 10 : 15,
      color: '#10b981',
    },
    {
      scenario: 'Likely',
      points: Math.round(totalPlanned * likelyMult),
      probability: loadPct > 0.9 ? 45 : 55,
      color: '#f16e2c',
    },
    {
      scenario: 'Conservative',
      points: Math.round(totalPlanned * conservativeMult),
      probability: 25,
      color: '#f59e0b',
    },
    {
      scenario: 'Worst Case',
      points: Math.round(totalPlanned * worstMult),
      probability: 5,
      color: '#ef4444',
    },
  ];
}

function capacityBand(pct: number): { label: string; color: string } {
  if (pct < 80) return { label: 'Healthy', color: 'text-success' };
  if (pct <= 95) return { label: 'At Risk', color: 'text-warning' };
  return { label: 'Over-allocated', color: 'text-destructive' };
}

// ── Component ──

export function SprintSimulation({
  capacity,
  totalPlanned,
  highRiskCount = 0,
  recommendedTickets,
  excludedTickets,
  onApply,
}: SprintSimulationProps) {
  const [simMode, setSimMode] = useState(false);
  const [simRemoved, setSimRemoved] = useState<Set<string>>(new Set());
  const [simAdded, setSimAdded] = useState<Set<string>>(new Set());

  const hasInteractiveData =
    (recommendedTickets && recommendedTickets.length > 0) ||
    (excludedTickets && excludedTickets.length > 0);

  // Simulated totals
  const simTotalPlanned = useMemo(() => {
    if (!simMode) return totalPlanned;
    const included = (recommendedTickets ?? [])
      .filter((t) => !simRemoved.has(t.id))
      .reduce((sum, t) => sum + t.atlasPoints, 0);
    const added = (excludedTickets ?? [])
      .filter((t) => simAdded.has(t.id))
      .reduce((sum, t) => sum + t.atlasPoints, 0);
    return included + added;
  }, [simMode, totalPlanned, recommendedTickets, excludedTickets, simRemoved, simAdded]);

  const simHighRisk = useMemo(() => {
    if (!simMode) return highRiskCount;
    return (recommendedTickets ?? []).filter(
      (t) =>
        !simRemoved.has(t.id) &&
        (t.risk === 'high' || t.risk === 'critical')
    ).length;
  }, [simMode, highRiskCount, recommendedTickets, simRemoved]);

  const outcomes = useMemo(
    () => computeOutcomes(simTotalPlanned, capacity, simHighRisk),
    [simTotalPlanned, capacity, simHighRisk]
  );

  const capacityPct =
    capacity > 0 ? Math.round((simTotalPlanned / capacity) * 100) : 0;
  const likelyOutcome = outcomes[1];
  const expectedDelivery = likelyOutcome.points;
  const plannedPct =
    simTotalPlanned > 0
      ? Math.round((expectedDelivery / simTotalPlanned) * 100)
      : 0;
  const band = capacityBand(capacityPct);

  const isDirty = simRemoved.size > 0 || simAdded.size > 0;

  const handleReset = useCallback(() => {
    setSimRemoved(new Set());
    setSimAdded(new Set());
  }, []);

  const handleApply = useCallback(() => {
    onApply?.(Array.from(simAdded), Array.from(simRemoved));
    setSimMode(false);
    setSimRemoved(new Set());
    setSimAdded(new Set());
  }, [onApply, simAdded, simRemoved]);

  const toggleSimRemove = useCallback((id: string) => {
    setSimRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSimAdd = useCallback((id: string) => {
    setSimAdded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-3" role="region" aria-label="Sprint simulation">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" aria-hidden="true" />
          Sprint Simulation
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            band.color === 'text-success' ? 'bg-success/10' :
            band.color === 'text-warning' ? 'bg-warning/10' :
            'bg-destructive/10'
          } ${band.color}`}>
            {band.label}
          </span>
        </h2>
        {hasInteractiveData && (
          <button
            type="button"
            onClick={() => {
              if (simMode) {
                handleReset();
                setSimMode(false);
              } else {
                setSimMode(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              simMode
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Play className="w-3 h-3" />
            {simMode ? 'Exit Simulator' : 'Simulate'}
          </button>
        )}
      </div>
      <Card className="space-y-4">
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {simMode
            ? 'Add or remove tickets below to see how it affects outcomes. Click Apply to use this plan.'
            : 'What-if outcomes based on your current ticket selection. Add or remove tickets to see updated capacity, confidence, and risk.'}
        </p>

        {/* Simulator ticket lists (only in sim mode) */}
        {simMode && (
          <div className="space-y-3 border-t border-border pt-3">
            {/* Included tickets */}
            {recommendedTickets && recommendedTickets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Included ({recommendedTickets.filter((t) => !simRemoved.has(t.id)).length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {recommendedTickets.map((t) => {
                    const isRemoved = simRemoved.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isRemoved
                            ? 'bg-destructive/5 border border-destructive/20 opacity-60'
                            : 'bg-muted/50 border border-border/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSimRemove(t.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isRemoved
                              ? 'bg-success/10 hover:bg-success/20 text-success'
                              : 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                          }`}
                        >
                          {isRemoved ? (
                            <Plus className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        <span
                          className={`font-mono text-primary truncate ${isRemoved ? 'line-through' : ''}`}
                        >
                          {t.id}
                        </span>
                        <span className="text-muted-foreground truncate flex-1">
                          {t.title}
                        </span>
                        <span className="font-semibold tabular-nums shrink-0">
                          {t.atlasPoints}
                          <span className="text-muted-foreground ml-0.5">
                            pts
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Excluded tickets to add */}
            {excludedTickets && excludedTickets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Excluded — add to simulate
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {excludedTickets.map((t) => {
                    const isAdded = simAdded.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isAdded
                            ? 'bg-success/5 border border-success/20'
                            : 'bg-muted/30 border border-border/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSimAdd(t.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isAdded
                              ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                              : 'bg-success/10 hover:bg-success/20 text-success'
                          }`}
                        >
                          {isAdded ? (
                            <Minus className="w-3 h-3" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                        </button>
                        <span className="font-mono text-primary truncate">
                          {t.id}
                        </span>
                        <span className="text-muted-foreground truncate flex-1">
                          {t.title}
                        </span>
                        <span className="font-semibold tabular-nums shrink-0">
                          {t.atlasPoints}
                          <span className="text-muted-foreground ml-0.5">
                            pts
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outcome bars */}
        <div className="space-y-3">
          {outcomes.map((outcome, idx) => (
            <div key={outcome.scenario} style={slideInStyle(0.2 + idx * 0.1)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground font-medium">
                  {outcome.scenario}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: outcome.color }}
                  >
                    {outcome.points} pts
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {outcome.probability}%
                  </span>
                </div>
              </div>
              <div className="h-5 bg-muted rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md origin-left"
                  style={{
                    width: `${Math.min(100, (outcome.points / capacity) * 100)}%`,
                    backgroundColor: outcome.color,
                    opacity: 0.7,
                    ...barGrowStyle(0.4 + idx * 0.15),
                  }}
                />
                <div
                  className="absolute top-0 h-full rounded-md flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.min(100, (outcome.points / capacity) * 100)}%`,
                  }}
                >
                  <span className="text-[9px] font-bold text-white/80">
                    {outcome.probability}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Capacity band indicator */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <span className="w-3 h-0 border-t-2 border-dashed border-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Planned: {simTotalPlanned} pts · Capacity: {capacity} pts (
            {capacityPct}% utilized)
            {simHighRisk > 0 && ` · ${simHighRisk} high-risk tickets`}
          </span>
          <span className={`text-[10px] font-semibold ${band.color} ml-auto`}>
            {band.label}
          </span>
        </div>

        {/* Capacity warning */}
        {capacityPct > 95 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
            <span className="text-[10px] text-destructive">
              Sprint is over-allocated at {capacityPct}%. Consider removing{' '}
              {Math.ceil(simTotalPlanned - capacity * 0.85)} points to reach a
              healthy load.
            </span>
          </div>
        )}

        {/* Expected delivery */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-primary mb-1">
            Expected Delivery
          </p>
          <p className="text-xl font-bold text-primary">
            {expectedDelivery} pts
          </p>
          <p className="text-[10px] text-primary/60">
            {likelyOutcome.probability}% probability | {plannedPct}% of planned
          </p>
        </div>

        {/* Sim mode action buttons */}
        {simMode && isDirty && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to AI Plan
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
              }}
            >
              <Check className="w-3 h-3" />
              Apply Changes
            </button>
          </div>
        )}

        {/* Historical comparison */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 border border-border p-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Sprint 22
            </p>
            <p className="text-sm font-bold text-muted-foreground">37</p>
          </div>
          <div className="rounded-lg bg-muted/50 border border-border p-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Sprint 23
            </p>
            <p className="text-sm font-bold text-muted-foreground">42</p>
          </div>
          <div className="rounded-lg bg-muted/50 border border-border p-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Sprint 24
            </p>
            <p className="text-sm font-bold text-foreground">41</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
