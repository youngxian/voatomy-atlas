import { Flame, Users, Timer, Eye, Zap, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import type { SprintTicket, ExcludedTicket, ExclusionReason, RiskLevel } from '@/lib/mock-data';
import type { SprintPlan, Ticket } from '@/lib/api';

// ---------------------------------------------------------------------------
// Animation style helpers (use sr- prefixed keyframes from globals.css)
// ---------------------------------------------------------------------------

export const shimmerStyle = {
  background: 'linear-gradient(90deg, transparent, rgba(241,110,44,0.08), transparent)',
  backgroundSize: '200% 100%',
  animation: 'sr-shimmer 2.5s ease-in-out infinite',
};

export const pulseGlowStyle = {
  animation: 'sr-pulse-glow 2s ease-in-out infinite',
};

export const slideInStyle = (delay: number) => ({
  animation: `sr-slide-in 0.5s ease-out ${delay}s both`,
});

export const barGrowStyle = (delay: number) => ({
  animation: `sr-bar-grow 1s ease-out ${delay}s both`,
});

// ---------------------------------------------------------------------------
// Assignee data
// ---------------------------------------------------------------------------

export const assigneeColors: Record<string, string> = {
  'Alex Chen': '#f16e2c',
  'Sarah Kim': '#3b82f6',
  'Jordan Lee': '#8b5cf6',
  'Priya Patel': '#10b981',
  'Marcus Wright': '#f59e0b',
};

export const assigneeInitials: Record<string, string> = {
  'Alex Chen': 'AC',
  'Sarah Kim': 'SK',
  'Jordan Lee': 'JL',
  'Priya Patel': 'PP',
  'Marcus Wright': 'MW',
};

// ---------------------------------------------------------------------------
// Story labels
// ---------------------------------------------------------------------------

export const storyLabels: Record<string, string[]> = {
  'COMP-217': ['payments', 'critical-path', 'stripe'],
  'COMP-218': ['auth', 'bug', 'security'],
  'COMP-219': ['users', 'feature', 'frontend'],
  'COMP-220': ['performance', 'enterprise', 'database'],
  'COMP-221': ['notifications', 'feature', 'email'],
  'COMP-222': ['ui', 'mobile', 'navigation'],
  'COMP-223': ['search', 'api', 'elasticsearch'],
  'COMP-224': ['onboarding', 'ux', 'bugfix'],
  'COMP-225': ['api', 'webhooks', 'reliability'],
};

export const labelColors: Record<string, string> = {
  payments: 'bg-destructive/20 text-destructive border-destructive/30',
  'critical-path': 'bg-warning/20 text-warning border-warning/30',
  stripe: 'bg-primary/20 text-primary border-primary/30',
  auth: 'bg-primary/20 text-primary border-primary/30',
  bug: 'bg-destructive/20 text-destructive border-destructive/30',
  security: 'bg-warning/20 text-warning border-warning/30',
  users: 'bg-primary/20 text-primary border-primary/30',
  feature: 'bg-primary/20 text-primary border-primary/30',
  frontend: 'bg-primary/20 text-primary border-primary/30',
  performance: 'bg-warning/20 text-warning border-warning/30',
  enterprise: 'bg-primary/20 text-primary border-primary/30',
  database: 'bg-primary/20 text-primary border-primary/30',
  notifications: 'bg-success/20 text-success border-success/30',
  email: 'bg-primary/20 text-primary border-primary/30',
  ui: 'bg-primary/20 text-primary border-primary/30',
  mobile: 'bg-primary/20 text-primary border-primary/30',
  navigation: 'bg-primary/20 text-primary border-primary/30',
  search: 'bg-warning/20 text-warning border-warning/30',
  api: 'bg-success/20 text-success border-success/30',
  elasticsearch: 'bg-warning/20 text-warning border-warning/30',
  onboarding: 'bg-primary/20 text-primary border-primary/30',
  ux: 'bg-primary/20 text-primary border-primary/30',
  bugfix: 'bg-destructive/20 text-destructive border-destructive/30',
  webhooks: 'bg-primary/20 text-primary border-primary/30',
  reliability: 'bg-success/20 text-success border-success/30',
};

// ---------------------------------------------------------------------------
// Risk factors
// ---------------------------------------------------------------------------

export const riskFactors = [
  {
    title: 'Payments Module Debt',
    severity: 'critical' as const,
    icon: Flame,
    description: '2.8x debt multiplier on payments/ module affects 2 sprint tickets. Legacy Stripe v1 callbacks increase merge conflict probability.',
    probability: 85,
    impact: 'HIGH',
  },
  {
    title: 'Capacity Gap Week 1',
    severity: 'high' as const,
    icon: Users,
    description: 'Sarah Kim on PTO reduces effective capacity by 8 pts in week 1. Front-loading her tickets is recommended.',
    probability: 100,
    impact: 'MED',
  },
  {
    title: 'On-Call Disruption',
    severity: 'medium' as const,
    icon: Timer,
    description: 'Jordan Lee on-call rotation week 2 may reduce throughput by 4 pts. COMP-220 is assigned to Jordan.',
    probability: 70,
    impact: 'MED',
  },
  {
    title: 'Stale Customer Signal',
    severity: 'low' as const,
    icon: Eye,
    description: 'Zendesk integration stale for 3 days. Customer-linked ticket priorities may be outdated.',
    probability: 40,
    impact: 'LOW',
  },
];

// ---------------------------------------------------------------------------
// Sprint simulation
// ---------------------------------------------------------------------------

export const simulationOutcomes = [
  { scenario: 'Best Case', points: 48, probability: 15, color: '#10b981' },
  { scenario: 'Likely', points: 42, probability: 55, color: '#f16e2c' },
  { scenario: 'Conservative', points: 37, probability: 25, color: '#f59e0b' },
  { scenario: 'Worst Case', points: 28, probability: 5, color: '#ef4444' },
];

// ---------------------------------------------------------------------------
// Estimation breakdown
// ---------------------------------------------------------------------------

export const estimationBreakdown = {
  ticketId: 'COMP-217',
  title: 'Implement Stripe payment flow for subscription upgrades',
  teamEstimate: 5,
  atlasEstimate: 8,
  signals: [
    {
      name: 'Code Complexity',
      icon: Zap,
      detail: 'payments/ module: 8.2 complexity score, 14,320 LOC, 7 open issues',
      impact: '+1.5 pts',
    },
    {
      name: 'Tech Debt',
      icon: AlertTriangle,
      detail: 'Debt multiplier 2.8x -- legacy Stripe v1 with nested callbacks',
      impact: '+1.0 pts',
    },
    {
      name: 'Revenue Signal',
      icon: TrendingUp,
      detail: 'Blocks $120K pipeline -- prioritized but adds review overhead',
      impact: '+0.3 pts',
    },
    {
      name: 'Historical',
      icon: Clock,
      detail: 'Similar tickets in payments/ averaged 1.6x team estimates over last 4 sprints',
      impact: '+0.2 pts',
    },
  ],
  confidence: 62,
  assignee: 'Alex Chen',
  module: 'payments/',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function riskBadge(risk: string) {
  switch (risk) {
    case 'high':
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/15 border border-destructive/25 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" style={pulseGlowStyle} />
          <span className="text-destructive font-medium uppercase">{risk}</span>
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/15 border border-warning/25 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          <span className="text-warning font-medium uppercase">{risk}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/15 border border-success/25 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-success font-medium uppercase">{risk}</span>
        </span>
      );
  }
}

export function statusIndicator(status: string) {
  const configs: Record<string, { color: string; label: string; animate: boolean }> = {
    todo: { color: 'bg-muted-foreground', label: 'To Do', animate: false },
    in_progress: { color: 'bg-primary', label: 'In Progress', animate: true },
    review: { color: 'bg-primary', label: 'In Review', animate: true },
    done: { color: 'bg-success', label: 'Done', animate: false },
  };
  const cfg = configs[status] || configs.todo;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span
        className={`w-2 h-2 rounded-full ${cfg.color}`}
        style={cfg.animate ? { animation: 'sr-pulse-glow 2s ease-in-out infinite' } : undefined}
      />
      {cfg.label}
    </span>
  );
}

export function complexityDots(points: number) {
  const maxDots = 5;
  const filledDots = Math.min(Math.ceil(points / 2), maxDots);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxDots }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < filledDots
              ? points >= 8
                ? 'bg-destructive'
                : points >= 5
                ? 'bg-warning'
                : 'bg-success'
              : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

export function priorityToRisk(priority: Ticket['priority']): RiskLevel {
  switch (priority) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

export function mapTicketStatus(status: Ticket['status']): SprintTicket['status'] {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'in_review':
      return 'review';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

export function parseEstimationConfidence(raw: string | undefined): number {
  if (raw == null || raw === '') return 70;
  const n = Number(raw);
  if (!Number.isNaN(n)) return Math.min(100, Math.max(0, n));
  const lower = raw.toLowerCase();
  if (lower.includes('high')) return 85;
  if (lower.includes('med')) return 65;
  if (lower.includes('low')) return 40;
  return 70;
}

export function mapExclusionReason(reason: string): ExclusionReason {
  const key = reason.toLowerCase().replace(/\s+/g, '_');
  if (key.includes('debt')) return 'debt_risk';
  if (key.includes('capacity')) return 'over_capacity';
  if (key.includes('depend')) return 'dependency_blocked';
  return 'scope_creep';
}

export function reasonLabelFromApi(reason: string): string {
  const trimmed = reason.trim();
  if (!trimmed) return 'Excluded';
  return trimmed
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function planToSprintTickets(plan: SprintPlan): SprintTicket[] {
  const sorted = [...plan.included_tickets].sort((a, b) => a.order_index - b.order_index);
  return sorted.map(({ ticket, points }) => ({
    id: ticket.external_id,
    title: ticket.title,
    atlasPoints: points ?? ticket.ai_points ?? ticket.human_points ?? 0,
    teamPoints: ticket.human_points ?? 0,
    risk: priorityToRisk(ticket.priority),
    module: ticket.labels?.[0] ?? '',
    signals: [],
    confidence: parseEstimationConfidence(ticket.estimation_confidence),
    assignee: '',
    status: mapTicketStatus(ticket.status),
  }));
}

export function planToExcludedTickets(plan: SprintPlan): ExcludedTicket[] {
  return plan.excluded_tickets.map(({ ticket, reason }) => ({
    id: ticket.external_id,
    title: ticket.title,
    atlasPoints: ticket.ai_points ?? ticket.human_points ?? 0,
    teamPoints: ticket.human_points ?? 0,
    reason: mapExclusionReason(reason),
    reasonLabel: reasonLabelFromApi(reason),
    explanation: reason,
    module: ticket.labels?.[0] ?? '',
  }));
}
