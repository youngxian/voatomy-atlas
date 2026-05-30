import {
  Scissors,
  GitMerge,
  Gauge,
  Users,
  ArrowUpRight,
  Layers,
  Target,
  Edit3,
  BarChart3,
  ChevronDown,
  Calendar,
  ExternalLink,
  FileEdit,
  Bug,
  Sparkles,
  Wrench,
  Hammer,
  Beaker,
} from 'lucide-react';
import type {
  SprintTicket,
  TicketModificationSuggestion,
  NextSprintSuggestion,
  DelayAnticipation,
  SuggestionType,
  DelayRisk,
} from '@/lib/mock-data';
import * as api from '@/lib/api';

// ---------------------------------------------------------------------------
// Animation styles (injected via <style> in the page)
// ---------------------------------------------------------------------------

export const animationStyles = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerBg {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes riskPulse {
    0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--destructive) 30%, transparent); }
    50% { box-shadow: 0 0 12px 4px color-mix(in srgb, var(--destructive) 10%, transparent); }
  }
  @keyframes successPop {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes borderGlow {
    0%, 100% { border-color: color-mix(in srgb, var(--warning) 20%, transparent); }
    50% { border-color: color-mix(in srgb, var(--warning) 50%, transparent); }
  }
`;

// ---------------------------------------------------------------------------
// Config objects
// ---------------------------------------------------------------------------

export const suggestionTypeConfig: Record<SuggestionType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  split: { label: 'Split', icon: Scissors, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  merge: { label: 'Merge', icon: GitMerge, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  're-estimate': { label: 'Re-estimate', icon: Gauge, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  're-assign': { label: 'Re-assign', icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  're-prioritize': { label: 'Re-prioritize', icon: ArrowUpRight, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  'add-dependency': { label: 'Add Dependency', icon: GitMerge, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  'add-label': { label: 'Add Label', icon: Layers, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  'refine-scope': { label: 'Refine Scope', icon: Target, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
};

export const delayRiskConfig: Record<DelayRisk, { label: string; color: string; bg: string; border: string; badge: 'danger' | 'warning' | 'info' | 'muted' }> = {
  imminent: { label: 'Imminent', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', badge: 'danger' },
  likely: { label: 'Likely', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', badge: 'warning' },
  possible: { label: 'Possible', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', badge: 'warning' },
  unlikely: { label: 'Unlikely', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', badge: 'muted' },
};

export const assigneeColors: Record<string, string> = {
  'Alex Chen': 'var(--warning)',
  'Sarah Kim': 'var(--primary)',
  'Jordan Lee': 'var(--primary)',
  'Priya Patel': 'var(--warning)',
  'Marcus Wright': 'var(--warning)',
};

export const assigneeInitials: Record<string, string> = {
  'Alex Chen': 'AC',
  'Sarah Kim': 'SK',
  'Jordan Lee': 'JL',
  'Priya Patel': 'PP',
  'Marcus Wright': 'MW',
};

export const statusColors: Record<string, { color: string; bg: string; chipBg: string; border: string; label: string }> = {
  todo: { color: 'text-muted-foreground', bg: 'bg-muted-foreground', chipBg: 'bg-muted', border: 'border-border', label: 'To Do' },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-500', chipBg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'In Progress' },
  review: { color: 'text-violet-600', bg: 'bg-violet-500', chipBg: 'bg-violet-500/10', border: 'border-violet-500/20', label: 'Review' },
  done: { color: 'text-success', bg: 'bg-success', chipBg: 'bg-success/10', border: 'border-success/20', label: 'Done' },
};

export const riskColors: Record<string, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-destructive',
  critical: 'text-destructive',
};

export const aiTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  feature: { label: 'Feature', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  chore: { label: 'Chore', icon: Wrench, color: 'text-secondary-foreground', bg: 'bg-muted/10', border: 'border-border/20' },
  tech_debt: { label: 'Tech Debt', icon: Hammer, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  spike: { label: 'Spike', icon: Beaker, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
};

export const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Edit3,
  number: BarChart3,
  select: ChevronDown,
  'multi-select': Layers,
  date: Calendar,
  user: Users,
  url: ExternalLink,
  'rich-text': FileEdit,
};

// ---------------------------------------------------------------------------
// API mappers
// ---------------------------------------------------------------------------

export function mapAPITicketToSprintTicket(t: api.Ticket): SprintTicket {
  const statusMap: Record<string, SprintTicket['status']> = {
    backlog: 'todo',
    todo: 'todo',
    in_progress: 'in_progress',
    in_review: 'review',
    done: 'done',
    cancelled: 'done',
    blocked: 'todo',
  };
  const priorityToRisk: Record<string, SprintTicket['risk']> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return {
    id: t.external_id || t.id,
    title: t.title,
    atlasPoints: t.ai_points ?? 0,
    teamPoints: t.human_points ?? 0,
    risk: priorityToRisk[t.priority] ?? 'low',
    module: (t.labels && t.labels[0]) ?? 'General',
    signals: [],
    confidence: 75,
    assignee: t.assignee_id ?? 'Unassigned',
    status: statusMap[t.status] ?? 'todo',
    ai_type: t.ai_type,
  };
}

export function mapAPISuggestionToMock(s: api.TicketSuggestion): TicketModificationSuggestion {
  const typeMap: Record<string, SuggestionType> = {
    split: 'split',
    merge: 'merge',
    re_estimate: 're-estimate',
    re_assign: 're-assign',
    de_scope: 'refine-scope',
  };
  const confidencePct = Math.round(s.confidence * 100);
  const signalSourcesByType: Record<string, string[]> = {
    split: ['Code Complexity', 'Module Analysis'],
    merge: ['Dependency Analysis'],
    re_estimate: ['Historical Accuracy', 'Code Signal'],
    re_assign: ['Capacity Signal', 'Assignment History'],
    de_scope: ['Scope Analysis', 'Priority Analysis'],
  };
  return {
    id: s.id,
    ticketId: s.ticket_id,
    ticketTitle: s.title,
    type: typeMap[s.type] ?? 're-estimate',
    title: s.title,
    description: s.description,
    reason: s.description,
    impact: s.impact,
    confidence: confidencePct >= 80 ? 'high' : confidencePct >= 60 ? 'medium' : 'low',
    confidencePercent: confidencePct,
    accepted: null,
    signalSources: signalSourcesByType[s.type] ?? ['AI Analysis'],
  };
}

export function mapAPINextSprintToMock(rec: api.NextSprintRecommendation): NextSprintSuggestion[] {
  if (!Array.isArray(rec.tickets)) return [];
  return rec.tickets.map((rt, idx) => {
    const priorityMap: Record<string, NextSprintSuggestion['priority']> = {
      critical: 'P0',
      high: 'P1',
      medium: 'P2',
      low: 'P3',
    };
    return {
      id: rt.ticket.id,
      title: rt.ticket.title,
      suggestedPoints: rt.points,
      priority: priorityMap[rt.ticket.priority] ?? 'P2',
      module: (rt.ticket.labels && rt.ticket.labels[0]) ?? 'General',
      reason: rt.reason,
      signalSources: ['Backlog Analysis', 'Velocity History'],
      confidence: 75 + Math.min(idx * 2, 20),
      revenueImpact: null,
      customerTickets: 0,
      dependsOn: [],
    };
  });
}

export function mapAPIDelayRiskToMock(r: api.DelayRisk): DelayAnticipation {
  const riskMap: Record<string, DelayRisk> = {
    critical: 'imminent',
    high: 'likely',
    medium: 'possible',
    low: 'unlikely',
  };
  return {
    id: r.id,
    ticketId: r.ticket_id ?? r.id,
    ticketTitle: r.ticket_title,
    assignee: 'Unassigned',
    originalEstimate: r.impact_days + 3,
    revisedEstimate: r.impact_days + 3 + r.impact_days,
    delayDays: r.impact_days,
    risk: riskMap[r.risk_level] ?? 'possible',
    probability: Math.round(r.probability * 100),
    reason: r.description,
    mitigation: r.mitigation,
    impactedTickets: [],
    revenueAtRisk: null,
  };
}
