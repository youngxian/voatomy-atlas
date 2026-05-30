import type { Ticket, Sprint } from './api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketRiskBadge =
  | 'blocked'
  | 'at-risk'
  | 'stale'
  | 'estimation-suggestion';

export interface TicketRiskBadgeResult {
  type: TicketRiskBadge;
  label: string;
  /** For estimation-suggestion: the AI-suggested points. */
  suggestedPoints?: number;
}

export interface SprintInsights {
  blockedCount: number;
  staleCount: number;
  atRiskCount: number;
  scopeCreepAlert: boolean;
  outcomePrediction: {
    expectedPct: number;
    label: string;
    confidence: 'high' | 'medium' | 'low';
  };
  blockedTickets: Ticket[];
  staleTickets: Ticket[];
  atRiskTickets: Ticket[];
}

const STALE_DAYS_THRESHOLD = 7;
const ESTIMATION_DIFF_THRESHOLD = 2;
const IN_PROGRESS_AT_RISK_DAYS = 5; // in_progress for 5+ days with no update = at-risk

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

function isStale(ticket: Ticket): boolean {
  if (ticket.status === 'done' || ticket.status === 'cancelled') return false;
  const days = daysSince(ticket.updated_at ?? ticket.created_at);
  return days >= STALE_DAYS_THRESHOLD;
}

function hasEstimationSuggestion(ticket: Ticket): boolean {
  const ai = ticket.ai_points;
  const human = ticket.human_points;
  if (ai == null || ai === undefined) return false;
  const humanVal = human ?? 0;
  return Math.abs(ai - humanVal) >= ESTIMATION_DIFF_THRESHOLD;
}

// ---------------------------------------------------------------------------
// getTicketRiskBadges
// ---------------------------------------------------------------------------

/**
 * Returns risk badges for a ticket based on status, updated_at, and ai_points vs human_points.
 * Order of precedence: blocked > at-risk > stale > estimation-suggestion.
 */
export function getTicketRiskBadges(ticket: Ticket): TicketRiskBadgeResult[] {
  const badges: TicketRiskBadgeResult[] = [];

  if (ticket.status === 'blocked') {
    badges.push({ type: 'blocked', label: 'Blocked' });
    return badges;
  }

  // At-risk: in_progress for long time (no update 5+ days) or blocked dependency
  const daysSinceUpdate = daysSince(ticket.updated_at ?? ticket.created_at);
  const inProgressLong =
    ticket.status === 'in_progress' && daysSinceUpdate >= IN_PROGRESS_AT_RISK_DAYS;
  if (inProgressLong) {
    badges.push({ type: 'at-risk', label: 'At risk' });
  }

  // Stale: no update 7+ days AND status not 'done'
  if (isStale(ticket)) {
    badges.push({ type: 'stale', label: 'Stale' });
  }

  // Estimation-suggestion: ai_points exists and differs from human_points by 2+
  if (hasEstimationSuggestion(ticket)) {
    badges.push({
      type: 'estimation-suggestion',
      label: `Atlas suggests ${ticket.ai_points ?? 0}pt`,
      suggestedPoints: ticket.ai_points,
    });
  }

  return badges;
}

// ---------------------------------------------------------------------------
// getSprintInsights
// ---------------------------------------------------------------------------

/**
 * Returns sprint-level insights: blocked count, stale count, at-risk count,
 * scope creep alert, and outcome prediction.
 */
export function getSprintInsights(
  tickets: Ticket[],
  sprint: Sprint | null,
  options?: {
    /** Optional burndown points_added total to detect scope creep. */
    totalPointsAdded?: number;
    /** Completion % (0-100) for outcome prediction. */
    completionPct?: number;
    /** Capacity utilization % (0-100). */
    capacityPct?: number;
  }
): SprintInsights {
  const blockedTickets = tickets.filter(t => t.status === 'blocked');
  const staleTickets = tickets.filter(t => isStale(t));
  const atRiskTickets = tickets.filter(t => {
    if (t.status === 'blocked' || t.status === 'done' || t.status === 'cancelled')
      return false;
    const days = daysSince(t.updated_at ?? t.created_at);
    return t.status === 'in_progress' && days >= IN_PROGRESS_AT_RISK_DAYS;
  });

  // Scope creep: significant points added vs planned
  const plannedPoints = sprint?.planned_points ?? 0;
  const currentPoints = tickets.reduce(
    (sum, t) => sum + (t.human_points ?? t.ai_points ?? 0),
    0
  );
  const totalPointsAdded = options?.totalPointsAdded ?? 0;
  const scopeCreepAlert =
    plannedPoints > 0 &&
    (totalPointsAdded > plannedPoints * 0.15 ||
      (currentPoints > plannedPoints * 1.2 && totalPointsAdded > 0));

  // Outcome prediction from completion %, capacity
  const completionPct = options?.completionPct ?? 0;
  const capacityPct = options?.capacityPct ?? 0;
  const blockedCount = blockedTickets.length;
  const staleCount = staleTickets.length;

  let expectedPct = 85;
  let label = 'On track';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (blockedCount > 0 || staleCount > 3) {
    expectedPct = Math.max(60, 85 - blockedCount * 8 - staleCount * 2);
    label = blockedCount > 0 ? 'At risk' : 'Slightly behind';
    confidence = blockedCount > 0 ? 'low' : 'medium';
  } else if (capacityPct > 95) {
    expectedPct = 75;
    label = 'Over-allocated';
    confidence = 'medium';
  } else if (completionPct > 50 && completionPct < 80) {
    // Mid-sprint: extrapolate
    expectedPct = Math.min(95, completionPct + 25);
    label = 'On track';
    confidence = 'high';
  }

  return {
    blockedCount,
    staleCount,
    atRiskCount: atRiskTickets.length,
    scopeCreepAlert,
    outcomePrediction: {
      expectedPct,
      label,
      confidence,
    },
    blockedTickets,
    staleTickets,
    atRiskTickets,
  };
}
