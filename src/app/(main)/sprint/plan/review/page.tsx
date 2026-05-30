'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Plus,
  ArrowLeft,
  ArrowRight,
  Copy,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui';
import type { SprintTicket, ExcludedTicket } from '@/lib/mock-data';
import { getSprintPlan, pushSprintPlan, type SprintPlan } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { getProviderLabel } from '@/lib/project-utils';
import { Reveal } from '@/components/Reveal';
import { planToSprintTickets, planToExcludedTickets } from '@/lib/sprint-review-config';
import { ReviewHeader } from '@/components/sprint-review/ReviewHeader';
import { TicketGrid } from '@/components/sprint-review/TicketGrid';
import { RiskFactors } from '@/components/sprint-review/RiskFactors';
import { SprintSimulation } from '@/components/sprint-review/SprintSimulation';
import { SignalSummary } from '@/components/sprint-review/SignalSummary';
import { EstimationBreakdown } from '@/components/sprint-review/EstimationBreakdown';

const SPRINT_PLAN_WRITEBACK_KEY = 'sprint-plan-writeback';

export default function SprintPlanReviewPage() {
  const router = useRouter();
  const { activeProjectId, activeProject } = useProject();
  const providerLabel = getProviderLabel(activeProject);
  const [sprintTickets, setSprintTickets] = useState<SprintTicket[]>([]);
  const [excludedTickets, setExcludedTickets] = useState<ExcludedTicket[]>([]);
  const [pushState, setPushState] = useState<'idle' | 'pushing' | 'error'>('idle');
  const [pushError, setPushError] = useState<string | null>(null);
  const [planMeta, setPlanMeta] = useState<SprintPlan | null>(null);
  const [planLoadState, setPlanLoadState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const apiLabelsByTicketId = useRef<Map<string, string[]>>(new Map());

  const [showAll, setShowAll] = useState(false);
  const [removedTickets, setRemovedTickets] = useState<Set<string>>(new Set());
  const [addedBackTickets, setAddedBackTickets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!activeProjectId) {
      setSprintTickets([]);
      setExcludedTickets([]);
      setPlanMeta(null);
      setPlanLoadState('idle');
      apiLabelsByTicketId.current = new Map();
      return;
    }
    setSprintTickets([]);
    setExcludedTickets([]);
    setPlanMeta(null);
    let cancelled = false;
    setPlanLoadState('loading');
    getSprintPlan(activeProjectId)
      .then((plan) => {
        if (cancelled) return;
        const labelMap = new Map<string, string[]>();
        for (const { ticket } of plan.included_tickets) {
          labelMap.set(ticket.external_id, ticket.labels ?? []);
        }
        for (const { ticket } of plan.excluded_tickets) {
          if (!labelMap.has(ticket.external_id)) {
            labelMap.set(ticket.external_id, ticket.labels ?? []);
          }
        }
        apiLabelsByTicketId.current = labelMap;
        setPlanMeta(plan);
        setSprintTickets(planToSprintTickets(plan));
        setExcludedTickets(planToExcludedTickets(plan));
        setPlanLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        apiLabelsByTicketId.current = new Map();
        setPlanMeta(null);
        setSprintTickets([]);
        setExcludedTickets([]);
        setPlanLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  const recommendedTickets = sprintTickets.filter(
    (t) => !removedTickets.has(t.id)
  );

  const addedExcluded = excludedTickets.filter((t) =>
    addedBackTickets.has(t.id)
  );

  const totalPlanned =
    recommendedTickets.reduce((sum, t) => sum + t.atlasPoints, 0) +
    addedExcluded.reduce((sum, t) => sum + t.atlasPoints, 0);

  const capacity =
    planMeta && planMeta.capacity_used_pct > 0
      ? Math.max(1, Math.round(planMeta.total_points / (planMeta.capacity_used_pct / 100)))
      : 54;
  const buffer = capacity - totalPlanned;
  const capacityPct =
    capacity > 0 ? Math.round((totalPlanned / capacity) * 100) : 0;

  const visibleRecommended = showAll
    ? recommendedTickets
    : recommendedTickets.slice(0, 6);
  const hiddenCount = recommendedTickets.length - 6;

  const removeTicket = (id: string) =>
    setRemovedTickets((prev) => new Set(prev).add(id));

  const addBackTicket = (id: string) =>
    setAddedBackTickets((prev) => new Set(prev).add(id));

  const remainingExcluded = excludedTickets.filter(
    (t) => !addedBackTickets.has(t.id)
  );

  const highRiskCount = recommendedTickets.filter(t => t.risk === 'high' || t.risk === 'critical').length;

  const handleSimApply = useCallback(
    (added: string[], removed: string[]) => {
      if (removed.length > 0) {
        setRemovedTickets((prev) => {
          const next = new Set(prev);
          removed.forEach((id) => next.add(id));
          return next;
        });
      }
      if (added.length > 0) {
        setAddedBackTickets((prev) => {
          const next = new Set(prev);
          added.forEach((id) => next.add(id));
          return next;
        });
      }
    },
    []
  );

  const showPlanLoading =
    !!activeProjectId &&
    planLoadState !== 'ready' &&
    planLoadState !== 'error';

  return (
    <Reveal>
      {showPlanLoading ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading sprint plan…</p>
        </Card>
      ) : !activeProjectId ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          Select a project in the header to load your sprint plan review.
        </Card>
      ) : planLoadState === 'error' ? (
        <Card className="py-16 text-center text-sm text-destructive">
          Could not load sprint plan. Generate a plan from the sprint planner, then try again.
        </Card>
      ) : (
        <div className="space-y-8">
          <ReviewHeader
            totalPlanned={totalPlanned}
            capacity={capacity}
            capacityPct={capacityPct}
            buffer={buffer}
            recommendedTickets={recommendedTickets.length}
            addedExcluded={addedExcluded.length}
            highRiskCount={highRiskCount}
          />

          <TicketGrid
            sprintTickets={sprintTickets}
            recommendedTickets={recommendedTickets}
            excludedTickets={excludedTickets}
            visibleRecommended={visibleRecommended}
            addedExcluded={addedExcluded}
            hiddenCount={hiddenCount}
            showAll={showAll}
            setShowAll={setShowAll}
            removeTicket={removeTicket}
            addedBackTickets={addedBackTickets}
            setAddedBackTickets={setAddedBackTickets}
            apiLabelsByTicketId={apiLabelsByTicketId}
            totalPlanned={totalPlanned}
          />

          {/* What-if outcome simulator callout */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">What if?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use the outcome simulator below to see how adding or removing tickets affects sprint delivery. Best case, likely, and worst-case scenarios update as you adjust scope.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskFactors />
            <SprintSimulation
              capacity={capacity}
              totalPlanned={totalPlanned}
              highRiskCount={highRiskCount}
              recommendedTickets={recommendedTickets}
              excludedTickets={remainingExcluded}
              onApply={handleSimApply}
            />
          </div>

          {remainingExcluded.length > 0 && (
            <div className="space-y-3" role="region" aria-label="Excluded tickets">
              <SectionHeader
                title="Left in Backlog"
                subtitle={`${remainingExcluded.length} tickets — ATLAS recommends excluding`}
              />
              {remainingExcluded.map((ticket) => (
                <Card key={ticket.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => addBackTicket(ticket.id)} className="w-7 h-7 rounded-md bg-success/10 hover:bg-success/20 flex items-center justify-center transition-colors" title="Add to sprint">
                        <Plus className="w-3.5 h-3.5 text-success" />
                      </button>
                      <a href="#" className="text-sm font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        {ticket.id}<ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-sm text-muted-foreground">{ticket.title}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{ticket.atlasPoints} pts</span>
                  </div>
                  <div className="flex items-start gap-2 ml-10">
                    <Badge variant="danger">{ticket.reasonLabel}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ticket.explanation}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <SignalSummary />

          {pushState === 'error' && pushError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">{pushError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-4 border-t border-border">
            <Link href="/sprint/plan" className="flex-1 sm:flex-initial">
              <button className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium border border-border transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />Regenerate
              </button>
            </Link>
            <button className="px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium border border-border transition-colors flex items-center justify-center gap-2">
              <Copy className="w-4 h-4" />Copy as Markdown
            </button>
            <button
              type="button"
              disabled={pushState === 'pushing' || !activeProjectId}
              onClick={async () => {
                if (!activeProjectId || !planMeta) return;
                setPushState('pushing');
                setPushError(null);
                try {
                  const raw = typeof sessionStorage !== 'undefined'
                    ? sessionStorage.getItem(SPRINT_PLAN_WRITEBACK_KEY)
                    : null;
                  const wb: Record<string, boolean> = raw ? JSON.parse(raw) : { wb_sprint: true, wb_points: true, wb_labels: true };
                  await pushSprintPlan(activeProjectId, wb, planMeta.sprint?.id);
                  router.push('/sprint/plan/pushed');
                } catch (err: unknown) {
                  setPushState('error');
                  setPushError(
                    err instanceof Error ? err.message : 'Failed to push sprint plan. Please try again.',
                  );
                }
              }}
              className="flex-1 sm:flex-initial sm:ml-auto w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.25)',
              }}
            >
              {pushState === 'pushing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pushing…
                </>
              ) : (
                <>
                  Push to {providerLabel}<ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <EstimationBreakdown />
        </div>
      )}
    </Reveal>
  );
}
