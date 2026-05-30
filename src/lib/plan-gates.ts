import type { PlanTier, Feature } from './plan';

export interface RouteGate {
  minTier: PlanTier;
  feature?: Feature;
  label: string;
}

export const ROUTE_GATES: Record<string, RouteGate> = {
  '/dashboard': { minTier: 'starter', label: 'Dashboard' },
  '/chat': { minTier: 'starter', label: 'ATLAS AI' },
  '/sprint/plan': { minTier: 'starter', label: 'Plan Sprint' },
  '/tickets': { minTier: 'starter', label: 'Tickets' },
  '/sprint/burndown': { minTier: 'starter', label: 'Burndown' },
  '/sprint/scoreboard': { minTier: 'starter', label: 'Scoreboard' },
  '/history': { minTier: 'starter', label: 'History' },

  '/dependencies': { minTier: 'pro', feature: 'cross_team_deps', label: 'Dependencies' },
  '/automations': { minTier: 'pro', feature: 'custom_workflows', label: 'Automations' },
  '/accuracy': { minTier: 'pro', feature: 'advanced_analytics', label: 'Accuracy' },
  '/retro': { minTier: 'pro', label: 'Retrospective' },
  '/standups': { minTier: 'pro', label: 'Daily Standups' },
  '/sprint/planning-notes': { minTier: 'pro', label: 'Planning Notes' },
  '/insights/complexity': { minTier: 'pro', feature: 'advanced_analytics', label: 'Complexity' },
  '/insights/debt': { minTier: 'pro', feature: 'advanced_analytics', label: 'Tech Debt' },
  '/backlog': { minTier: 'pro', label: 'Backlog' },
  '/analytics': { minTier: 'pro', feature: 'advanced_analytics', label: 'Analytics' },

  '/capacity': { minTier: 'business', feature: 'multi_team_dashboards', label: 'Capacity' },
  '/revenue': { minTier: 'business', feature: 'revenue_backlog', label: 'Revenue' },
  '/projects': { minTier: 'business', label: 'Projects' },
  '/nexus': { minTier: 'enterprise', feature: 'nexus_platform', label: 'NEXUS Feed' },

  '/integrations': { minTier: 'starter', label: 'Integrations' },
  '/stakeholder': { minTier: 'pro', label: 'Stakeholder' },
  '/notifications': { minTier: 'starter', label: 'Notifications' },
  '/settings': { minTier: 'starter', label: 'Settings' },
  '/repos': { minTier: 'starter', label: 'Repos' },
  '/team': { minTier: 'starter', label: 'Team' },
  '/boards': { minTier: 'pro', label: 'Boards' },
};

export function getRouteGate(href: string): RouteGate | undefined {
  return ROUTE_GATES[href];
}

export function isRouteLocked(href: string, currentTier: PlanTier): boolean {
  const gate = ROUTE_GATES[href];
  if (!gate) return false;
  const rank: Record<PlanTier, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };
  return rank[currentTier] < rank[gate.minTier];
}

export function getRequiredTierLabel(tier: PlanTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
