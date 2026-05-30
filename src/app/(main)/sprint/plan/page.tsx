'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Sparkles,
  Pencil,
  FileEdit,
  ExternalLink,
  Users,
  CalendarDays,
  Code2,
  HeadphonesIcon,
  Bug,
  Paintbrush,
  Briefcase,
  CheckSquare,
  Square,
  CalendarOff,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react';
import { Card, Badge, StatusDot, Button, EmptyState, SectionHeader } from '@/components/ui';
import { SprintPlanIllustration } from '@/components/EmptyIllustrations';
import { Reveal } from '@/components/Reveal';
import { usePlan } from '@/lib/plan';
import { useProjectRole } from '@/hooks/useProjectRole';
import LimitWall from '@/components/LimitWall';
import { Lock } from 'lucide-react';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { getProviderLabel, getProjectProvider } from '@/lib/project-utils';
import { formatSprintDate } from '@/lib/sprint-format';
import { detectBoardStructure, hasSprintSupport } from '@/lib/board-utils';
import BoardExplorerModal from '@/components/BoardExplorerModal';
import type { TeamAvailability } from '@/lib/api';

const SPRINT_PLAN_WRITEBACK_KEY = 'sprint-plan-writeback';

// ---------------------------------------------------------------------------
// Inline data
// ---------------------------------------------------------------------------

type DurationOption = '1wk' | '2wk' | '3wk' | '4wk' | 'custom';

const durationOptions: { value: DurationOption; label: string }[] = [
  { value: '1wk', label: '1 wk' },
  { value: '2wk', label: '2 wk' },
  { value: '3wk', label: '3 wk' },
  { value: '4wk', label: '4 wk' },
  { value: 'custom', label: 'Custom' },
];

const signalIconMap: Record<string, React.ElementType> = {
  code: Code2,
  capacity: Users,
  customer: HeadphonesIcon,
  debt: Bug,
  design: Paintbrush,
  business: Briefcase,
};

const SIGNAL_STALE_MS = 72 * 3600 * 1000;

function signalConfigIconKey(provider: string): string {
  const p = provider.toLowerCase();
  if (/github|gitlab|bitbucket|gitea/.test(p)) return 'code';
  if (/calendar|cal\.com|google|outlook/.test(p)) return 'capacity';
  if (/zendesk|intercom|freshdesk|support/.test(p)) return 'customer';
  if (/figma|sketch/.test(p)) return 'design';
  if (/phantom|debt|sonar/.test(p)) return 'debt';
  return 'business';
}

function signalConfigStatus(cfg: atlas.SignalConfig): 'live' | 'stale' | 'disconnected' {
  if (!cfg.enabled) return 'disconnected';
  if (!cfg.last_sync_at) return 'stale';
  const age = Date.now() - new Date(cfg.last_sync_at).getTime();
  return age > SIGNAL_STALE_MS ? 'stale' : 'live';
}

/** Mirrors free mock signals (code + capacity): git + calendar-style providers stay on Free. */
function isFreeTierSignalProvider(provider: string): boolean {
  const p = provider.toLowerCase();
  return /github|gitlab|bitbucket|gitea/.test(p) || /calendar|cal\.com|google|outlook/.test(p);
}

const SPRINT_PLAN_COPY = {
  hero: {
    title: 'Plan your next sprint with AI',
    subtitle: 'A few quick choices and ATLAS will suggest the right tickets, capacity, and goal.',
    confidence: "We've pulled in your board, sprint, and team — you're almost ready.",
  },
  sections: {
    sprintDetails: "What we're planning",
    sprintGoal: 'Suggested focus',
    signals: 'What ATLAS considers',
    writeBack: (provider: string) => `What we'll change in ${provider}`,
  },
  duration: {
    label: 'Sprint length',
    hint: 'Most teams use 2-week sprints.',
  },
  advanced: {
    summary: 'Advanced planning options',
    autoPlan: 'Plan automatically when a new sprint starts',
    autoPlanDesc: 'ATLAS will generate a sprint plan when a new sprint is started (via webhook)',
    autoPush: (provider: string) => `Also push plan to ${provider}`,
    autoPushDesc: 'Automatically push the generated plan to your board — no manual review step',
    calendar: 'Use calendar for capacity',
    calendarDesc: 'Adjust capacity based on team PTO and availability from linked calendars',
  },
  goal: {
    intro: "Based on your backlog and recent work, here's a suggested focus.",
    use: 'Use this goal',
    edit: 'Edit suggestion',
    scratch: 'Start from scratch',
    empty: "We'll suggest a focus after you generate — or add your own below.",
  },
  cta: {
    headline: 'Ready to generate?',
    button: "Generate my sprint plan",
    reassurance: 'You can adjust everything before pushing to your board.',
  },
};

const WRITEBACK_BENEFITS: Record<string, string> = {
  wb_points: 'Keeps your board consistent with estimates',
  wb_labels: 'Makes risk visible at a glance',
  wb_sprint: 'Adds recommended tickets to the sprint',
  wb_comments: 'Documents estimation rationale on tickets',
  wb_excluded: 'Explains why tickets stayed in backlog',
};

const SIGNAL_BENEFITS: Record<string, string> = {
  code: 'Uses commit history to estimate complexity',
  capacity: 'Factors in team availability and PTO',
  customer: 'Weighs support and feedback signals',
  debt: 'Considers technical debt and blockers',
  design: 'Includes design readiness status',
  business: 'Accounts for business priority signals',
};

function getWriteBackOptions(sprintName: string) {
  return [
    { id: 'wb_points', label: 'Write ATLAS story points to tickets', defaultOn: true },
    { id: 'wb_labels', label: 'Add risk labels (HIGH / MED / LOW)', defaultOn: true },
    { id: 'wb_sprint', label: `Move recommended tickets into ${sprintName}`, defaultOn: true },
    { id: 'wb_comments', label: 'Add estimation breakdown as ticket comments', defaultOn: false },
    { id: 'wb_excluded', label: 'Tag excluded tickets with reason in backlog', defaultOn: false },
  ];
}

// ---------------------------------------------------------------------------
// Sprint Plan Configure Page
// ---------------------------------------------------------------------------

const FREE_WRITEBACK_IDS = new Set(['wb_points']);

export default function SprintPlanConfigurePage() {
  const router = useRouter();
  const { isFreeTier, usage, limits } = usePlan();
  const { activeProjectId, activeProject, activeSprint, setActiveSprint, refreshSprint } = useProject();
  const { canManage: roleCanManage } = useProjectRole(activeProjectId);
  const sprintName = activeSprint?.name ?? 'Current Sprint';
  const providerLabel = getProviderLabel(activeProject);
  const projectName = activeProject?.name ?? 'Project';
  const writeBackOptions = getWriteBackOptions(sprintName);
  const [generateState, setGenerateState] = useState<'idle' | 'saving' | 'navigating'>('idle');
  const [duration, setDuration] = useState<DurationOption>('2wk');
  const [apiConfig, setApiConfig] = useState<atlas.PlanningConfig | null>(null);
  const [sprintGateState, setSprintGateState] = useState<'loading' | 'has_sprint' | 'no_sprint' | 'skip'>('loading');
  const [showExplorer, setShowExplorer] = useState(true);
  const [enabledSignals, setEnabledSignals] = useState<Record<string, boolean>>({});
  const [signalLoadState, setSignalLoadState] = useState<'idle' | 'loading' | 'ready'>(() =>
    activeProjectId ? 'loading' : 'idle'
  );
  const [signalConfigs, setSignalConfigs] = useState<atlas.SignalConfig[]>([]);
  const [writeBack, setWriteBack] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    writeBackOptions.forEach((o) => {
      map[o.id] = o.defaultOn;
    });
    return map;
  });
  const [autoPlanOnSprintStart, setAutoPlanOnSprintStart] = useState(false);
  const [autoPushOnSprintStart, setAutoPushOnSprintStart] = useState(false);
  const [useCalendarForCapacity, setUseCalendarForCapacity] = useState(false);
  const [teamAvailability, setTeamAvailability] = useState<TeamAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // When we have a sprint-supporting project but no active sprint in context, try to fetch it
  useEffect(() => {
    if (activeProjectId && sprintGateState === 'has_sprint' && !activeSprint && refreshSprint) {
      refreshSprint().catch((err) => console.error('Failed to refresh sprint', err));
    }
  }, [activeProjectId, sprintGateState, activeSprint, refreshSprint]);

  useEffect(() => {
    if (!activeProjectId || !activeProject) {
      setSprintGateState('skip');
      setShowExplorer(false);
      return;
    }
    const provider = getProjectProvider(activeProject);
    if (!provider) {
      setSprintGateState('skip');
      setShowExplorer(false);
      return;
    }
    detectBoardStructure(activeProject)
      .then((structure) => {
        setSprintGateState(hasSprintSupport(structure) ? 'has_sprint' : 'no_sprint');
      })
      .catch(() => setSprintGateState('skip'));
  }, [activeProjectId, activeProject]);

  useEffect(() => {
    if (!activeProjectId) {
      setSignalConfigs([]);
      setEnabledSignals({});
      setSignalLoadState('idle');
      return;
    }
    let cancelled = false;
    setSignalLoadState('loading');
    Promise.all([
      atlas.getPlanningConfig(activeProjectId).then((c) => {
        setApiConfig(c);
        if (c?.auto_plan_on_sprint_start != null) setAutoPlanOnSprintStart(c.auto_plan_on_sprint_start);
        if (c?.auto_push_on_sprint_start != null) setAutoPushOnSprintStart(c.auto_push_on_sprint_start);
        if (c?.use_calendar_for_capacity != null) setUseCalendarForCapacity(c.use_calendar_for_capacity);
      }).catch((err) => console.error('Failed to load planning config', err)),
      atlas
        .getSignalConfigs(activeProjectId)
        .then((list) => {
          if (cancelled) return;
          const arr = Array.isArray(list) ? list : [];
          setSignalConfigs(arr);
          const map: Record<string, boolean> = {};
          arr.forEach((c) => {
            map[c.id] = c.enabled;
          });
          setEnabledSignals(map);
        })
        .catch((err) => {
          console.error('Failed to load signal configs', err);
          if (!cancelled) {
            setSignalConfigs([]);
            setEnabledSignals({});
          }
        }),
    ]).finally(() => {
      if (!cancelled) setSignalLoadState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId || !useCalendarForCapacity) {
      setTeamAvailability(null);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    atlas.getTeamAvailability(activeProjectId)
      .then((data) => {
        if (!cancelled) setTeamAvailability(data);
      })
      .catch((err) => {
        console.error('Failed to load team availability', err);
        if (!cancelled) setTeamAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeProjectId, useCalendarForCapacity]);

  const toggleSignal = (id: string) =>
    setEnabledSignals((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleWriteBack = (id: string) =>
    setWriteBack((prev) => ({ ...prev, [id]: !prev[id] }));

  const handlePlanSprintFromExplorer = useCallback(
    async (sprintExternalId?: string) => {
      if (sprintExternalId && activeProjectId && setActiveSprint) {
        try {
          const allSprints = await atlas.getSprints(activeProjectId);
          const match = (allSprints ?? []).find(
            (s) =>
              s.external_id === sprintExternalId ||
              s.jira_sprint_id === sprintExternalId ||
              s.linear_cycle_id === sprintExternalId ||
              s.clickup_list_id === sprintExternalId
          );
          if (match) {
            const detail = await atlas.getSprint(activeProjectId, match.id);
            setActiveSprint(detail);
          }
        } catch {
          // Keep current sprint on lookup failure
        }
      }
      setShowExplorer(false);
    },
    [activeProjectId, setActiveSprint]
  );

  const handleGenerate = async () => {
    if (!activeProjectId || generateState !== 'idle') return;
    setGenerateState('saving');
    try {
      await atlas.updatePlanningConfig(activeProjectId, {
        capacity_buffer_pct: apiConfig?.capacity_buffer_pct ?? 15,
        velocity_window: apiConfig?.velocity_window ?? 4,
        auto_estimate: apiConfig?.auto_estimate ?? true,
        auto_plan_on_sprint_start: autoPlanOnSprintStart,
        auto_push_on_sprint_start: autoPushOnSprintStart,
        use_calendar_for_capacity: useCalendarForCapacity,
      });
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SPRINT_PLAN_WRITEBACK_KEY, JSON.stringify(writeBack));
        const activeSignalIds = Object.entries(enabledSignals)
          .filter(([, v]) => v)
          .map(([k]) => k);
        sessionStorage.setItem('sprint-plan-signals', JSON.stringify(activeSignalIds));
      }
      setGenerateState('navigating');
      router.push('/sprint/plan/processing');
    } catch {
      setGenerateState('idle');
    }
  };

  if (sprintGateState === 'no_sprint') {
    return (
      <Reveal>
        <EmptyState
          icon={CalendarOff}
          illustration={<SprintPlanIllustration className="w-[220px] h-[176px]" />}
          title="No sprint detected"
          description="We couldn't find an active sprint for this project. Connect a board with sprint-enabled lists to start AI-powered sprint planning."
          actionLabel="Switch Project"
          onAction={() => window.location.href = '/projects'}
        />
      </Reveal>
    );
  }

  const teamCount = teamAvailability?.members.length ?? 8;
  const suggestedGoal: string | null = 'Ship payment flow + auth improvements. 3 revenue-critical tickets ($276K pipeline).';
  const isBoardChecking = sprintGateState === 'loading';

  return (
    <>
      {showExplorer && activeProject && sprintGateState === 'has_sprint' && (
        <BoardExplorerModal
          project={activeProject}
          onPlanSprint={handlePlanSprintFromExplorer}
          onSkip={() => setShowExplorer(false)}
          onClose={() => setShowExplorer(false)}
        />
      )}
    <Reveal>
      <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted via-muted/80 to-muted p-8">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
              {SPRINT_PLAN_COPY.hero.title}
            </h1>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              {SPRINT_PLAN_COPY.hero.subtitle}
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2">
              {SPRINT_PLAN_COPY.hero.confidence}
            </p>
            {isBoardChecking && (
              <p className="text-xs text-primary/90 mt-2 inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Checking your board…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sprint Details */}
      <Card className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow" role="region" aria-label="Sprint details">
        <SectionHeader icon={CalendarDays} title={SPRINT_PLAN_COPY.sections.sprintDetails} />

        {/* Quick scan summary strip */}
        <div className="flex flex-wrap items-center gap-2 py-4">
          {isBoardChecking ? (
            <>
              <div className="h-8 w-28 rounded-full bg-muted animate-pulse" />
              <span className="text-muted-foreground">·</span>
              <div className="h-8 w-36 rounded-full bg-muted animate-pulse" />
              <span className="text-muted-foreground">·</span>
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
              <span className="text-muted-foreground">·</span>
              <div className="h-8 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-20 rounded bg-muted animate-pulse ml-1" />
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-foreground">
                {sprintName}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-sm font-medium text-foreground">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                {formatSprintDate(activeSprint)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-sm font-medium text-foreground">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {teamCount} members
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-sm font-medium text-foreground">
                {duration === '1wk' ? '1 wk' : duration === '2wk' ? '2 wk' : duration === '3wk' ? '3 wk' : duration === '4wk' ? '4 wk' : 'Custom'}
              </span>
              <Badge variant="info" className="ml-1">auto-detected</Badge>
            </>
          )}
        </div>

        {/* Team avatars when available */}
        {teamAvailability && teamAvailability.members.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex -space-x-1">
              {teamAvailability.members.slice(0, 6).map((m) => (
                <span
                  key={m.member_id}
                  className="w-8 h-8 rounded-full bg-primary/8 border-2 border-card flex items-center justify-center text-[10px] font-bold text-foreground shrink-0"
                  title={m.name}
                >
                  {m.initials}
                </span>
              ))}
              {teamAvailability.members.length > 6 && (
                <span className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                  +{teamAvailability.members.length - 6}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{teamAvailability.members.length} team members</span>
          </div>
        )}

        {/* Duration */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">{SPRINT_PLAN_COPY.duration.label}</label>
            <span className="text-[10px] text-muted-foreground" title={SPRINT_PLAN_COPY.duration.hint}>
              {SPRINT_PLAN_COPY.duration.hint}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  duration === opt.value
                    ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {opt.label}
                {duration === opt.value && ' \u2713'}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced planning options (collapsible) */}
        <div className="pt-4 border-t border-border mt-6">
          <button
            type="button"
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {SPRINT_PLAN_COPY.advanced.summary}
            {advancedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {advancedExpanded && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{SPRINT_PLAN_COPY.advanced.autoPlan}</p>
                  <p className="text-xs text-muted-foreground">{SPRINT_PLAN_COPY.advanced.autoPlanDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPlanOnSprintStart((v) => !v)}
                  role="switch"
                  aria-checked={autoPlanOnSprintStart}
                  aria-label="Toggle auto-plan when sprint starts"
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    autoPlanOnSprintStart ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      autoPlanOnSprintStart ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              {autoPlanOnSprintStart && (
                <div className="flex items-center justify-between gap-4 pl-6 border-l-2 border-primary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{SPRINT_PLAN_COPY.advanced.autoPush(providerLabel)}</p>
                    <p className="text-xs text-muted-foreground">{SPRINT_PLAN_COPY.advanced.autoPushDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPushOnSprintStart((v) => !v)}
                    role="switch"
                    aria-checked={autoPushOnSprintStart}
                    aria-label="Toggle auto-push on sprint start"
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      autoPushOnSprintStart ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        autoPushOnSprintStart ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{SPRINT_PLAN_COPY.advanced.calendar}</p>
                  <p className="text-xs text-muted-foreground">{SPRINT_PLAN_COPY.advanced.calendarDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseCalendarForCapacity((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    useCalendarForCapacity ? 'bg-primary' : 'bg-muted'
                  }`}
                  aria-label="Toggle calendar-based capacity"
                  role="switch"
                  aria-checked={useCalendarForCapacity}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      useCalendarForCapacity ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Team Availability Section */}
        {useCalendarForCapacity && (
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Team Availability</h3>
              </div>
              {teamAvailability && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {teamAvailability.adjusted_capacity_pts} / {teamAvailability.total_capacity_pts} pts effective
                </span>
              )}
            </div>
            {availabilityLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : teamAvailability && teamAvailability.members.length > 0 ? (
              <div className="space-y-2">
                {teamAvailability.members.map((member) => {
                  const isReduced = member.availability_pct < 100;
                  return (
                    <div
                      key={member.member_id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/30"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/8 border border-primary/12 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {member.initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                          <span className={`text-xs font-semibold tabular-nums ${isReduced ? 'text-warning' : 'text-success'}`}>
                            {member.availability_pct}%
                          </span>
                        </div>
                        {member.adjustments.length > 0 && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {member.adjustments.map((a) => a.label).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${isReduced ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${member.availability_pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4">
                No team capacity data available. Add team members and calendar adjustments in Team settings.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Sprint Goal - AI Suggestion */}
      <Card className="p-6 rounded-2xl shadow-sm border-l-4 border-l-primary/40" role="region" aria-label="Sprint goal">
        <SectionHeader icon={Sparkles} title={SPRINT_PLAN_COPY.sections.sprintGoal} />
        <p className="text-xs text-muted-foreground mb-4">{SPRINT_PLAN_COPY.goal.intro}</p>
        {suggestedGoal ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">AI-Suggested Goal</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{suggestedGoal}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                {SPRINT_PLAN_COPY.goal.use}
              </Button>
              <Button variant="secondary" size="sm">
                <Pencil className="w-3.5 h-3.5" />
                {SPRINT_PLAN_COPY.goal.edit}
              </Button>
              <Button variant="ghost" size="sm">
                <FileEdit className="w-3.5 h-3.5" />
                {SPRINT_PLAN_COPY.goal.scratch}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-muted/30 p-5">
            {SPRINT_PLAN_COPY.goal.empty}
          </p>
        )}
      </Card>

      {/* Signal Configuration */}
      <Card className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4" role="region" aria-label="Signal configuration">
        <SectionHeader
          icon={Brain}
          title={SPRINT_PLAN_COPY.sections.signals}
          subtitle={signalConfigs.length > 0 ? `${Object.values(enabledSignals).filter(Boolean).length} of ${signalConfigs.length} signals enabled` : undefined}
        />
        {signalLoadState === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border/60 bg-muted/30 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : signalConfigs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No signals configured for this project yet. Connect integrations under Signals to enable planning inputs.
          </p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {signalConfigs.map((cfg) => {
            const iconKey = signalConfigIconKey(cfg.provider);
            const Icon = signalIconMap[iconKey] || Briefcase;
            const status = signalConfigStatus(cfg);
            const isEnabled = enabledSignals[cfg.id];
            const isDisconnected = status === 'disconnected';
            const isGatedByPlan = isFreeTier && !isFreeTierSignalProvider(cfg.provider);
            const isDisabled = isDisconnected || isGatedByPlan;

            const iconBoxColor = iconKey === 'code' ? 'bg-primary/8 border-primary/12'
              : iconKey === 'capacity' ? 'bg-success/8 border-success/12'
              : iconKey === 'customer' ? 'bg-info/8 border-info/12'
              : iconKey === 'debt' ? 'bg-destructive/8 border-destructive/12'
              : iconKey === 'design' ? 'bg-warning/8 border-warning/12'
              : 'bg-primary/8 border-primary/12';

            return (
              <button
                key={cfg.id}
                onClick={() => !isDisabled && toggleSignal(cfg.id)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border transition-all text-left ${
                  isDisabled
                    ? 'bg-muted/30 border-border/40 opacity-50 cursor-not-allowed'
                    : isEnabled
                    ? 'bg-primary/5 border-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-muted/50 border-border/60 hover:border-border hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconBoxColor}`}>
                  <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{cfg.name}</span>
                    {isGatedByPlan && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">Pro</span>
                    )}
                  </div>
                  {iconKey in SIGNAL_BENEFITS && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{SIGNAL_BENEFITS[iconKey]}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isEnabled && !isDisabled ? (
                      <CheckSquare className="w-3 h-3 text-primary shrink-0" />
                    ) : isGatedByPlan ? (
                      <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                    ) : (
                      <Square className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    {!isGatedByPlan && (
                      <StatusDot
                        status={
                          status === 'live'
                            ? 'live'
                            : status === 'stale'
                            ? 'stale'
                            : 'disconnected'
                        }
                        showLabel
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </Card>

      {/* Write-back */}
      <Card className="p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4" role="region" aria-label="Write-back options">
        <SectionHeader
          icon={ExternalLink}
          title={SPRINT_PLAN_COPY.sections.writeBack(providerLabel)}
        />
        <div className="space-y-3">
          {writeBackOptions.map((opt) => {
            const isChecked = writeBack[opt.id];
            const isGated = isFreeTier && !FREE_WRITEBACK_IDS.has(opt.id);
            const benefit = WRITEBACK_BENEFITS[opt.id];
            return (
              <button
                key={opt.id}
                onClick={() => !isGated && toggleWriteBack(opt.id)}
                className={`flex items-start gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left ${
                  isGated
                    ? 'bg-muted/30 border-border/40 opacity-50 cursor-not-allowed'
                    : isChecked
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-muted/50 border-border/60 hover:border-border hover:shadow-sm'
                }`}
              >
                {isGated ? (
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                ) : isChecked ? (
                  <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium flex-1 ${isGated ? 'text-muted-foreground' : 'text-foreground'}`}>{opt.label}</span>
                    {isGated && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary shrink-0">Pro</span>
                    )}
                  </div>
                  {benefit && <p className="text-xs text-muted-foreground mt-0.5">{benefit}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Generate CTA */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{SPRINT_PLAN_COPY.cta.headline}</h3>
        {!roleCanManage ? (
          <div className="py-4 px-4 rounded-xl border border-border bg-muted/30 flex items-center gap-3">
            <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">Sprint planning requires a Manager or Admin role. Ask your project admin to upgrade your access.</p>
          </div>
        ) : (
          <LimitWall used={usage.aiPlansUsed} max={limits.aiPlansPerMonth} noun="AI sprint plans">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generateState !== 'idle'}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:scale-[1.01] hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.25)',
                }}
              >
                {generateState === 'saving' || generateState === 'navigating' ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {generateState === 'saving' ? 'Saving config…' : 'Starting…'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {SPRINT_PLAN_COPY.cta.button}
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center">{SPRINT_PLAN_COPY.cta.reassurance}</p>
            </div>
          </LimitWall>
        )}
      </div>
      </div>
    </Reveal>
    </>
  );
}
