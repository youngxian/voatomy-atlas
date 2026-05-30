'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { config } from '@/lib/config';

export type PlanTier = 'starter' | 'pro' | 'business' | 'enterprise';

export interface PlanLimits {
  maxTeams: number;
  maxMembers: number;
  maxRepos: number;
  aiPlansPerMonth: number;
  maxPMIntegrations: number;
  allowedIntegrations: string[];
}

export interface PlanUsage {
  teamsUsed: number;
  membersUsed: number;
  reposUsed: number;
  aiPlansUsed: number;
}

export interface Subscription {
  tier: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd: string | null;
}

export type Feature =
  | 'unlimited_teams'
  | 'unlimited_repos'
  | 'unlimited_ai_plans'
  | 'figma_sync'
  | 'customer_signals'
  | 'advanced_analytics'
  | 'slack_teams_notifs'
  | 'crm_integration'
  | 'cross_team_deps'
  | 'api_access'
  | 'custom_workflows'
  | 'multi_team_dashboards'
  | 'revenue_backlog'
  | 'nexus_platform'
  | 'sso_saml'
  | 'rbac_audit'
  | 'dedicated_support';

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxTeams: 1,
    maxMembers: 8,
    maxRepos: 1,
    aiPlansPerMonth: 2,
    maxPMIntegrations: 1,
    allowedIntegrations: ['github', 'gitlab', 'jira', 'linear', 'clickup'],
  },
  pro: {
    maxTeams: -1,
    maxMembers: 50,
    maxRepos: -1,
    aiPlansPerMonth: -1,
    maxPMIntegrations: -1,
    allowedIntegrations: [
      'github', 'gitlab', 'bitbucket',
      'jira', 'linear', 'clickup', 'asana', 'monday', 'trello',
      'figma',
      'slack', 'teams', 'discord',
      'notion', 'confluence',
      'datadog', 'sentry',
    ],
  },
  business: {
    maxTeams: -1,
    maxMembers: 500,
    maxRepos: -1,
    aiPlansPerMonth: -1,
    maxPMIntegrations: -1,
    allowedIntegrations: [
      'github', 'gitlab', 'bitbucket',
      'jira', 'linear', 'clickup', 'asana', 'monday', 'trello',
      'figma',
      'slack', 'teams', 'discord',
      'salesforce', 'hubspot', 'pipedrive',
      'zendesk', 'intercom', 'freshdesk',
      'notion', 'confluence', 'google-drive',
      'datadog', 'pagerduty', 'opsgenie', 'sentry', 'grafana',
    ],
  },
  enterprise: {
    maxTeams: -1,
    maxMembers: -1,
    maxRepos: -1,
    aiPlansPerMonth: -1,
    maxPMIntegrations: -1,
    allowedIntegrations: ['*'],
  },
};

const TIER_RANK: Record<PlanTier, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };

const FEATURE_MIN_TIER: Record<Feature, PlanTier> = {
  unlimited_teams: 'pro',
  unlimited_repos: 'pro',
  unlimited_ai_plans: 'pro',
  figma_sync: 'pro',
  customer_signals: 'pro',
  advanced_analytics: 'pro',
  slack_teams_notifs: 'pro',
  crm_integration: 'business',
  cross_team_deps: 'business',
  api_access: 'business',
  custom_workflows: 'business',
  multi_team_dashboards: 'business',
  revenue_backlog: 'business',
  nexus_platform: 'enterprise',
  sso_saml: 'enterprise',
  rbac_audit: 'enterprise',
  dedicated_support: 'enterprise',
};

interface PlanContextValue {
  tier: PlanTier;
  limits: PlanLimits;
  usage: PlanUsage;
  subscription: Subscription | null;
  isFreeTier: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  /**
   * User is on Starter after a trial (or canceled/past_due paid sub) — show reactivation / downgrade UX.
   * Not true for orgs that were always on Starter with no trial history (no trial end date and active).
   */
  postTrialOnStarter: boolean;
  canAccess: (feature: Feature) => boolean;
  getMinTier: (feature: Feature) => PlanTier;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

const CACHE_KEY = 'voatomy_plan';
const API_BASE = config.apiBase;

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [usage, setUsage] = useState<PlanUsage>({
    teamsUsed: 0,
    membersUsed: 0,
    reposUsed: 0,
    aiPlansUsed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  const fetchPlan = useCallback(async () => {
    try {
      const token =
        typeof document !== 'undefined'
          ? document.cookie.match(/(?:^|; )session=([^;]*)/)?.[1]
          : null;
      const res = await fetch(`${API_BASE}/v1/billing/subscription`, {
        credentials: 'include',
        headers: token
          ? { Authorization: `Bearer ${decodeURIComponent(token)}` }
          : {},
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data ?? json;
        const nested = data.subscription ?? {};
        const sub: Subscription = {
          tier: data.plan_tier ?? nested.plan_tier ?? 'starter',
          status: data.status ?? nested.status ?? 'active',
          currentPeriodEnd: data.current_period_end ?? nested.current_period_end ?? null,
        };
        setSubscription(sub);
        localStorage.setItem(CACHE_KEY, JSON.stringify(sub));

        setIsTrialing(data.is_trialing ?? false);
        setTrialEndsAt(data.trial_ends_at ? new Date(data.trial_ends_at) : null);
        setTrialDaysLeft(data.trial_days_left ?? 0);

        if (data.is_trialing === true && typeof window !== 'undefined') {
          try {
            localStorage.setItem('voatomy_had_active_trial', '1');
          } catch {
            /* ignore */
          }
        }

        if (data.usage) {
          setUsage(data.usage);
        }
      } else {
        localStorage.removeItem(CACHE_KEY);
        const fallback: Subscription = { tier: 'starter', status: 'active', currentPeriodEnd: null };
        setSubscription(fallback);
        setIsTrialing(false);
        setTrialEndsAt(null);
        setTrialDaysLeft(0);
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
      setSubscription({ tier: 'starter', status: 'active', currentPeriodEnd: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    const onFocus = () => fetchPlan();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchPlan]);

  const tier = subscription?.tier ?? 'starter';
  const limits = PLAN_LIMITS[tier];
  const isFreeTier = tier === 'starter';

  const postTrialOnStarter = useMemo(() => {
    if (loading || isTrialing || tier !== 'starter') return false;
    const st = subscription?.status;
    if (st === 'canceled' || st === 'past_due') return true;
    if (trialEndsAt) {
      const t = trialEndsAt.getTime();
      if (!Number.isNaN(t) && t < Date.now()) return true;
    }
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('voatomy_had_active_trial') === '1';
    } catch {
      return false;
    }
  }, [loading, isTrialing, tier, subscription?.status, trialEndsAt]);

  const canAccess = useCallback(
    (feature: Feature) => {
      const minTier = FEATURE_MIN_TIER[feature];
      return TIER_RANK[tier] >= TIER_RANK[minTier];
    },
    [tier],
  );

  const getMinTier = useCallback((feature: Feature) => FEATURE_MIN_TIER[feature], []);

  const value = useMemo<PlanContextValue>(
    () => ({
      tier,
      limits,
      usage,
      subscription,
      isFreeTier,
      isTrialing,
      trialEndsAt,
      trialDaysLeft,
      postTrialOnStarter,
      canAccess,
      getMinTier,
      loading,
      refresh: fetchPlan,
    }),
    [
      tier,
      limits,
      usage,
      subscription,
      isFreeTier,
      isTrialing,
      trialEndsAt,
      trialDaysLeft,
      postTrialOnStarter,
      canAccess,
      getMinTier,
      loading,
      fetchPlan,
    ],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}

export { TIER_RANK, FEATURE_MIN_TIER, PLAN_LIMITS };
