'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  ChevronDown,
  Download,
  CheckCircle2,
  Eye,
  Bot,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge, Button, SectionHeader } from '@/components/ui';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';
import type { SprintVelocity } from '@/lib/analytics-mock';
import { teamMembers } from '@/lib/analytics-mock';
import type { AIRecommendation } from '@/components/analytics/AIRecommendations';
import type { ReviewMatrixRow, PairProgrammingRow } from '@/components/analytics/CollaborationSection';
import type { HealthMetricItem } from '@/components/analytics/HealthTrends';
import { VelocityChart } from '@/components/analytics/VelocityChart';
import { TeamPerformance } from '@/components/analytics/TeamPerformance';
import { AccuracyMatrix } from '@/components/analytics/AccuracyMatrix';
import { HealthTrends } from '@/components/analytics/HealthTrends';
import { CollaborationSection } from '@/components/analytics/CollaborationSection';
import { AIRecommendations } from '@/components/analytics/AIRecommendations';

function SkeletonGrid() {
  return (
    <div className="px-6 pt-6 space-y-8 pb-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-56 rounded-2xl" />
        <div className="skeleton h-56 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  onRetry: () => void;
}

function ErrorBanner({ onRetry }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-destructive/10 border border-destructive/20 mb-4">
        <AlertCircle className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Failed to load analytics</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm">
        We couldn&apos;t fetch the analytics data. Check your connection and try again.
      </p>
      <Button variant="primary" size="sm" onClick={onRetry}>
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </Button>
    </div>
  );
}

const PLACEHOLDER = '—';

function toSprintVelocity(p: { sprint_name: string; planned: number; actual: number }): SprintVelocity {
  return { sprint: p.sprint_name || PLACEHOLDER, committed: p.planned, delivered: p.actual };
}

export default function AnalyticsPage() {
  const { activeProjectId } = useProject();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<atlas.AnalyticsOverview | null>(null);
  const [apiVelocity, setApiVelocity] = useState<atlas.VelocityTrend | null>(null);
  const [apiAccuracy, setApiAccuracy] = useState<atlas.AccuracyOverview | null>(null);
  const [apiAccuracyHistory, setApiAccuracyHistory] = useState<atlas.AccuracyHistory | null>(null);
  const [apiModuleAccuracy, setApiModuleAccuracy] = useState<atlas.ModuleAccuracy | null>(null);
  const [apiTeamAccuracy, setApiTeamAccuracy] = useState<atlas.TeamAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);

    const promises = [
      atlas.getAnalyticsOverview(activeProjectId).then(setApiAnalytics).catch(() => null),
      atlas.getVelocityTrend(activeProjectId).then(setApiVelocity).catch(() => null),
      atlas.getAccuracyOverview(activeProjectId).then(setApiAccuracy).catch(() => null),
      atlas.getAccuracyHistory(activeProjectId).then(setApiAccuracyHistory).catch(() => null),
      atlas.getModuleAccuracy(activeProjectId).then(setApiModuleAccuracy).catch(() => null),
      atlas.getTeamAccuracy(activeProjectId).then(setApiTeamAccuracy).catch(() => null),
    ];

    Promise.all(promises).then((results) => {
      if (results.every((r) => r === null)) setError(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeProjectId]);

  const velocityPoints = apiAnalytics?.velocity_data ?? apiVelocity?.points ?? [];
  const effectiveVelocityData: SprintVelocity[] = velocityPoints.map(toSprintVelocity);

  const maxVelocity = Math.max(1, ...effectiveVelocityData.flatMap((d) => [d.committed, d.delivered]));
  const targetLine = apiVelocity?.avg_velocity ?? apiAnalytics?.avg_velocity ?? 0;

  const lastSprint = effectiveVelocityData[effectiveVelocityData.length - 1];
  const prevSprint = effectiveVelocityData[effectiveVelocityData.length - 2];
  const sprintCompletion =
    lastSprint && lastSprint.committed > 0
      ? Math.round((lastSprint.delivered / lastSprint.committed) * 100)
      : null;
  const completionChange =
    sprintCompletion !== null && prevSprint && prevSprint.committed > 0
      ? sprintCompletion - Math.round((prevSprint.delivered / prevSprint.committed) * 100)
      : null;

  const dateRangeLabel =
    apiAnalytics?.sprint_count != null && apiAnalytics.sprint_count > 0
      ? `Last ${apiAnalytics.sprint_count} ${apiAnalytics.sprint_count === 1 ? 'sprint' : 'sprints'}`
      : PLACEHOLDER;

  const lastUpdated =
    apiAnalytics || apiAccuracy
      ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : PLACEHOLDER;

  const colors = ['#22C55E', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
  const effectiveTeamMembers =
    apiTeamAccuracy?.members?.length && apiTeamAccuracy.members.length > 0
      ? apiTeamAccuracy.members.map((m, i) => ({
          name: m.assignee_id || PLACEHOLDER,
          initials: (m.assignee_id || '?').slice(0, 2).toUpperCase(),
          color: colors[i % colors.length],
          role: PLACEHOLDER,
          velocity: m.delivered > 0 ? Math.round((m.delivered / 4) * 10) / 10 : 0,
          accuracy: Math.round(m.accuracy_pct),
          storiesCompleted: m.delivered,
          strengths: [],
          sprintTrend: [1, 1, 1, Math.max(1, m.delivered)] as number[],
          workload: { frontend: 34, backend: 33, infra: 33 },
        }))
      : teamMembers;

  const kpiCards = [
    {
      label: 'Avg Velocity',
      value:
        apiAnalytics?.avg_velocity != null && apiAnalytics.avg_velocity > 0
          ? String(Math.round(apiAnalytics.avg_velocity))
          : PLACEHOLDER,
      unit: 'pts/sprint',
      change:
        apiAnalytics?.velocity_trend === 'increasing'
          ? '+%'
          : apiAnalytics?.velocity_trend === 'decreasing'
            ? '-%'
            : undefined,
      changeLabel: apiAnalytics?.velocity_trend ? `trend: ${apiAnalytics.velocity_trend}` : undefined,
      icon: TrendingUp,
      accent: 'emerald' as const,
    },
    {
      label: 'Estimation Accuracy',
      value: apiAccuracy?.current_accuracy != null ? `${Math.round(apiAccuracy.current_accuracy)}%` : PLACEHOLDER,
      unit: '',
      secondValue: undefined,
      secondUnit: undefined,
      change:
        apiAccuracy?.previous_accuracy != null
          ? `${apiAccuracy.current_accuracy >= apiAccuracy.previous_accuracy ? '+' : ''}${Math.round(apiAccuracy.current_accuracy - apiAccuracy.previous_accuracy)}%`
          : undefined,
      changeLabel: apiAccuracy ? 'vs previous sprint' : undefined,
      icon: Target,
      accent: 'violet' as const,
    },
    {
      label: 'Sprint Completion',
      value: sprintCompletion != null ? String(sprintCompletion) : PLACEHOLDER,
      unit: '%',
      change: completionChange != null ? `${completionChange >= 0 ? '+' : ''}${completionChange}%` : undefined,
      changeLabel: completionChange != null ? 'vs last sprint' : undefined,
      icon: CheckCircle2,
      accent: 'amber' as const,
    },
    {
      label: 'Avg Cycle Time',
      value:
        apiAnalytics?.avg_cycle_time_days != null && apiAnalytics.avg_cycle_time_days > 0
          ? String(apiAnalytics.avg_cycle_time_days.toFixed(1))
          : PLACEHOLDER,
      unit: 'days',
      change: undefined,
      changeLabel: undefined,
      icon: Clock,
      accent: 'sky' as const,
    },
  ];

  const accentStyles: Record<string, { bg: string; border: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-500/12', border: 'border-emerald-500/25', icon: 'text-emerald-600 dark:text-emerald-400' },
    violet: { bg: 'bg-violet-500/12', border: 'border-violet-500/25', icon: 'text-violet-600 dark:text-violet-400' },
    amber: { bg: 'bg-amber-500/12', border: 'border-amber-500/25', icon: 'text-amber-600 dark:text-amber-400' },
    sky: { bg: 'bg-sky-500/12', border: 'border-sky-500/25', icon: 'text-sky-600 dark:text-sky-400' },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-muted/80 to-muted px-6 py-8 mx-6 mt-6">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                  Team Analytics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Performance insights, velocity trends, and estimation accuracy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{dateRangeLabel}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              <Button variant="primary" size="sm" className="shadow-sm">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorBanner onRetry={fetchData} />
      ) : (
        <div className="space-y-8 px-6 pt-6 pb-10">
          {/* Key metrics */}
          <Reveal delay={0.05}>
            <div>
              <SectionHeader icon={Sparkles} title="Key Metrics" className="mb-4" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 analytics-card-stagger">
                {kpiCards.map((kpi, i) => {
                  const style = accentStyles[kpi.accent];
                  return (
                    <div key={kpi.label} className={`winboard-card group space-y-3 relative overflow-hidden transition-all duration-300 hover:border-primary/10`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.bg} border ${style.border}`}>
                          <kpi.icon className={`w-4 h-4 ${style.icon}`} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5" style={{ animation: `analytics-counter 0.6s ease-out ${i * 0.1}s both` }}>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">{kpi.value}</span>
                        {kpi.value !== PLACEHOLDER && kpi.unit && (
                          <span className="text-xs text-muted-foreground font-medium">{kpi.unit}</span>
                        )}
                      </div>
                      {kpi.secondValue && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-medium text-muted-foreground">vs {kpi.secondValue}</span>
                          <span className="text-[10px] text-muted-foreground">{kpi.secondUnit}</span>
                        </div>
                      )}
                      {kpi.change && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="success" className="text-[10px]">{kpi.change}</Badge>
                          <span className="text-[10px] text-muted-foreground">{kpi.changeLabel}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <VelocityChart effectiveVelocityData={effectiveVelocityData} maxVelocity={maxVelocity} targetLine={targetLine} />

          <TeamPerformance
            teamMembers={effectiveTeamMembers}
            expandedMember={expandedMember}
            setExpandedMember={setExpandedMember}
          />
          <AccuracyMatrix
            apiAccuracyHistory={apiAccuracyHistory}
            apiModuleAccuracy={apiModuleAccuracy}
          />
          <HealthTrends healthMetrics={apiAnalytics?.health_metrics as HealthMetricItem[] | undefined} />
          <CollaborationSection
            reviewMatrix={apiAnalytics?.review_matrix as ReviewMatrixRow[] | undefined}
            pairProgramming={apiAnalytics?.pair_programming as PairProgrammingRow[] | undefined}
          />
          <AIRecommendations recommendations={apiAnalytics?.ai_recommendations as AIRecommendation[] | undefined} />

          {/* AI footer */}
          <Reveal delay={0.4}>
            <div className="winboard-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">Analytics powered by ATLAS AI</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Last updated: {lastUpdated}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" /> View Raw Data
                </Button>
                <Button variant="secondary" size="sm">
                  <BarChart3 className="w-4 h-4" /> Full Report
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}
