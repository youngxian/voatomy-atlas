'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { getSprintInsights, type SprintInsights } from '@/lib/smart-insights';
import type { Ticket, Sprint } from '@/lib/api';
import { Tooltip } from '@/components/ui';
import { clsx } from 'clsx';

interface SmartInsightsCardProps {
  sprintTickets: Ticket[];
  activeSprint: Sprint | null;
  projectId: string | null;
  /** Completion % (0-100). */
  completionPct?: number;
  /** Capacity utilization % (0-100). */
  capacityPct?: number;
  /** Optional: points added during sprint (for scope creep). */
  totalPointsAdded?: number;
  /** Default collapsed state. */
  defaultCollapsed?: boolean;
  /** Called when user dismisses the card. */
  onDismiss?: () => void;
  className?: string;
}

export function SmartInsightsCard({
  sprintTickets,
  activeSprint,
  projectId,
  completionPct = 0,
  capacityPct = 0,
  totalPointsAdded = 0,
  defaultCollapsed = false,
  onDismiss,
  className = '',
}: SmartInsightsCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [dismissed, setDismissed] = useState(false);

  const insights: SprintInsights = getSprintInsights(
    sprintTickets,
    activeSprint,
    {
      completionPct,
      capacityPct,
      totalPointsAdded,
    }
  );

  const hasInsights =
    insights.blockedCount > 0 ||
    insights.staleCount > 0 ||
    insights.atRiskCount > 0 ||
    insights.scopeCreepAlert ||
    insights.outcomePrediction.label !== 'On track';

  if (dismissed) return null;

  const ConfidenceBadge = () => {
    const { confidence } = insights.outcomePrediction;
    const cls =
      confidence === 'high'
        ? 'bg-success/10 text-success'
        : confidence === 'medium'
          ? 'bg-warning/10 text-warning'
          : 'bg-destructive/10 text-destructive';
    return (
      <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded', cls)}>
        {confidence} confidence
      </span>
    );
  };

  return (
    <div
      className={clsx(
        'rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm shadow-black/5',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Sprint insights
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {insights.outcomePrediction.label} · ~
              {insights.outcomePrediction.expectedPct}% expected delivery
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasInsights && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              {insights.blockedCount + insights.staleCount + insights.atRiskCount} need attention
            </span>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
                onDismiss();
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body - collapsible */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/30">
          {/* Blocked tickets */}
          {insights.blockedCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-foreground">
                  Blocked tickets need attention
                </span>
                <Link
                  href={projectId ? `/tickets?status=blocked` : '#'}
                  className="text-[11px] font-medium text-primary hover:text-primary/80 ml-auto"
                >
                  View {insights.blockedCount} ticket
                  {insights.blockedCount !== 1 ? 's' : ''}
                </Link>
              </div>
              <div className="flex flex-wrap gap-1">
                {insights.blockedTickets.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    href={
                      t.external_url ??
                      (projectId ? `/tickets?status=blocked` : '#')
                    }
                    target={t.external_url ? '_blank' : undefined}
                    rel={t.external_url ? 'noopener noreferrer' : undefined}
                    className="text-[11px] text-muted-foreground hover:text-primary truncate max-w-[180px]"
                  >
                    {t.external_id ?? t.id}
                  </Link>
                ))}
                {insights.blockedCount > 5 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{insights.blockedCount - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stale tickets */}
          {insights.staleCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Stale tickets
                </span>
                <Tooltip content="No update in 7+ days">
                  <span className="text-[10px] text-muted-foreground">
                    ({insights.staleCount} with no update 7+ days)
                  </span>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-1">
                {insights.staleTickets.slice(0, 4).map((t) => (
                  <Link
                    key={t.id}
                    href={t.external_url ?? '#'}
                    target={t.external_url ? '_blank' : undefined}
                    rel={t.external_url ? 'noopener noreferrer' : undefined}
                    className="text-[11px] text-muted-foreground hover:text-primary truncate max-w-[160px]"
                  >
                    {t.external_id ?? t.id}
                  </Link>
                ))}
                {insights.staleCount > 4 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{insights.staleCount - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sprint outcome prediction */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Sprint outcome prediction
              </span>
              <ConfidenceBadge />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Based on completion {completionPct}% and capacity usage {capacityPct}%, we
              expect ~{insights.outcomePrediction.expectedPct}% delivery (
              {insights.outcomePrediction.label}).
            </p>
          </div>

          {/* Scope creep */}
          {insights.scopeCreepAlert && (
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-foreground">
                  Scope creep indicator
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Significant points have been added during this sprint. Consider
                reviewing scope.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
