'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Gauge,
  GripVertical,
  MoreVertical,
  Kanban,
  Layers,
  Lightbulb,
  Lock,
  Rocket,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  Filter,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AssigneeAvatarStack } from '@/components/AssigneeAvatarStack';
import { DashboardIllustration } from '@/components/EmptyIllustrations';
import { StreakBadgesCard } from '@/components/StreakBadges';
import TipBanner, { TIPS } from '@/components/TipBanner';
import { getSprintInsights } from '@/lib/smart-insights';
import { SmartTicketBadges } from '@/components/SmartTicketBadges';
import SprintInsightsPanel from '@/components/intelligence/SprintInsightsPanel';
import UsageBanner from '@/components/UsageBanner';
import TrialSetupChecklist from '@/components/TrialSetupChecklist';
import SectionGate from '@/components/SectionGate';
import { usePlan } from '@/lib/plan';
import { isRouteLocked } from '@/lib/plan-gates';
import { getTeamMembers, getSprintTicketsFull, getTickets, type Sprint, type Project as APIProject, type TeamMember, type Ticket } from '@/lib/api';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import { detectBoardStructure, hasSprintSupport } from '@/lib/board-utils';
import { getSprintTerm } from '@/lib/project-utils';
import { normalizeProfileDisplay, getCanonicalEmail, getNameFromBoardByEmail } from '@/lib/utils';
import { useTeamMembers } from '@/lib/queries';
import { useBoardColumnLabels } from '@/hooks/useBoardColumnLabels';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-primary to-emerald-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-500',
  'from-indigo-500 to-violet-600',
];

function computeSprintProgress(sprint: { start_date?: string; end_date?: string } | null): {
  currentDay: number;
  totalDays: number;
  progressPct: number;
  daysRemaining: number;
} {
  if (!sprint?.start_date || !sprint?.end_date) {
    return { currentDay: 0, totalDays: 0, progressPct: 0, daysRemaining: 0 };
  }
  const start = new Date(sprint.start_date);
  const end = new Date(sprint.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const nowMs = today.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return { currentDay: 0, totalDays: 0, progressPct: 0, daysRemaining: 0 };
  }
  const msPerDay = 86400000;
  const totalDays = Math.max(0, Math.round((endMs - startMs) / msPerDay) + 1);
  const daysElapsed = Math.floor((nowMs - startMs) / msPerDay);
  const currentDay = totalDays > 0 ? Math.max(1, Math.min(daysElapsed + 1, totalDays)) : 0;
  const daysRemaining = Math.max(0, totalDays - currentDay);
  const progressPct = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0;
  return { currentDay, totalDays, progressPct, daysRemaining };
}

interface SprintMemberStats {
  ticketCount: number;
  totalPoints: number;
}

function buildSprintMemberStats(sprintTickets: Ticket[], members: TeamMember[]): Map<string, SprintMemberStats> {
  const memberLookup = new Map<string, string>();
  for (const m of members) {
    memberLookup.set(m.id, m.id);
    if (m.user_id) memberLookup.set(m.user_id, m.id);
    if (m.email) memberLookup.set(m.email.toLowerCase(), m.id);
  }
  const nameLookup = new Map<string, string>();
  for (const m of members) {
    nameLookup.set(m.name.toLowerCase().trim(), m.id);
  }
  function resolveMember(assigneeId: string): string | undefined {
    return memberLookup.get(assigneeId) ?? nameLookup.get(assigneeId.toLowerCase().trim());
  }
  const stats = new Map<string, SprintMemberStats>();
  for (const t of sprintTickets) {
    if (!t.assignee_id) continue;
    const memberId = resolveMember(t.assignee_id);
    if (!memberId) continue;
    const existing = stats.get(memberId) ?? { ticketCount: 0, totalPoints: 0 };
    existing.ticketCount++;
    existing.totalPoints += t.human_points ?? t.ai_points ?? 0;
    stats.set(memberId, existing);
  }
  return stats;
}

function memberToDisplay(m: TeamMember, idx: number, sprintStats?: SprintMemberStats) {
  const stories = sprintStats?.ticketCount ?? 0;
  const assignedPoints = sprintStats?.totalPoints ?? 0;
  const capacity = m.base_velocity;
  let load: number;
  if (capacity > 0) {
    const numerator = assignedPoints > 0 ? assignedPoints : stories;
    load = numerator > 0 ? Math.min(100, Math.round((numerator / capacity) * 100)) : 0;
  } else if (stories > 0) {
    load = Math.min(100, Math.round((stories / 5) * 100));
  } else {
    load = 0;
  }
  return {
    initials: m.initials || m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    name: m.name,
    load,
    stories,
    points: assignedPoints,
    color: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
  };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatSprintDate(dateStr: string, includeYear?: boolean): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(includeYear && { year: 'numeric' }),
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// WinBoard Card Wrapper
// ---------------------------------------------------------------------------

function WCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`winboard-card ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Progress Ring (SVG)
// ---------------------------------------------------------------------------

function ProgressRing({
  pct,
  size = 80,
  stroke = 5,
  color = '#7d8c4e',
  label,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  const offset = circumference - (safePct / 100) * circumference;
  const gradientId = `ring-grad-${size}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground tabular-nums leading-none">{safePct}%</span>
        {label && <span className="text-[9px] text-muted-foreground/70 font-medium mt-0.5 uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Dashboard Banner
// ---------------------------------------------------------------------------

interface BannerStat {
  label: string;
  value: number;
  badge: string;
  badgeColor: string;
}

function DashboardBanner({
  activeSprint,
  activeProject,
  projects,
  teamMemberCount,
  sprintTickets,
  sprintTerm = 'Sprint',
}: {
  activeSprint: Sprint;
  activeProject: APIProject | null;
  projects: APIProject[];
  teamMemberCount: number;
  sprintTickets: Ticket[];
  sprintTerm?: string;
}) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const { data: teamMembers = [] } = useTeamMembers(activeProject?.id ?? null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const normalized = user ? normalizeProfileDisplay(user) : { full_name: '', email: '' };
  const canonicalEmail = user ? getCanonicalEmail(user) : '';
  const boardName = getNameFromBoardByEmail(canonicalEmail, teamMembers);
  const displayName = boardName ?? (normalized.full_name || '');
  const firstName = displayName.split(' ')[0] || '';
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ''}`;
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  const totalTickets = sprintTickets.length;
  const doneTickets = sprintTickets.filter(t => t.status === 'done').length;
  const blockedTickets = sprintTickets.filter(t => t.status === 'blocked').length;
  const inProgressCount = sprintTickets.filter(t => t.status === 'in_progress').length;
  const completionPct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  const stats: BannerStat[] = [
    {
      label: 'Active Projects',
      value: projects.length,
      badge: activeSprint.name ?? `Current ${sprintTerm.toLowerCase()}`,
      badgeColor: 'bg-[#b45837]/10 text-[#b45837] dark:bg-[#d97757]/15 dark:text-[#d97757]',
    },
    {
      label: 'Team Members',
      value: teamMemberCount,
      badge: `${completionPct}% completion`,
      badgeColor: 'bg-[#7d8c4e]/15 text-[#5e6a3a] dark:bg-[#9aa86a]/15 dark:text-[#b8c688]',
    },
    {
      label: `${sprintTerm} Tickets`,
      value: totalTickets,
      badge: `${inProgressCount} in progress`,
      badgeColor: 'bg-[#c8923c]/15 text-[#8a6420] dark:bg-[#d4a155]/15 dark:text-[#e6b975]',
    },
    {
      label: 'Open Blockers',
      value: blockedTickets,
      badge: blockedTickets === 0 ? 'All clear' : `${blockedTickets} need attention`,
      badgeColor: blockedTickets === 0
        ? 'bg-[#7d8c4e]/15 text-[#5e6a3a] dark:bg-[#9aa86a]/15 dark:text-[#b8c688]'
        : 'bg-[#a8443a]/15 text-[#a8443a] dark:bg-[#c25a4a]/15 dark:text-[#d97766]',
    },
  ];

  return (
    <motion.div
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-dashboard-border-soft bg-gradient-to-r from-dashboard-surface via-dashboard-surface-muted/85 to-dashboard-surface shadow-sm"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:gap-0 lg:px-7">
        {/* Left — Greeting */}
        <div className="shrink-0 lg:w-[240px] xl:w-[280px] lg:pr-7">
          <p className="mb-1 text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-muted-foreground">
            {dateStr}
          </p>
          <h1 className="text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[26px]">
            {greeting}
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            Here&apos;s what&apos;s happening across your projects today.
          </p>
        </div>

        {/* Right — Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 flex-1 lg:border-l lg:border-border/20 lg:pl-7">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className={`flex flex-col justify-center gap-1.5 py-1 ${
                idx > 0 ? 'pl-4 lg:pl-5 border-l border-border/12' : 'pr-4 lg:pr-5'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-muted-foreground">
                {stat.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[26px]">
                  {stat.value}
                </span>
                <span className={`inline-flex items-center px-2 py-[3px] rounded-full text-[9px] sm:text-[10px] font-semibold leading-none whitespace-nowrap ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section 1b: Plan New Sprint CTA
// ---------------------------------------------------------------------------

function PlanNewSprintCard() {
  const { tier } = usePlan();
  const locked = isRouteLocked('/sprint/plan', tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link href={locked ? '#' : '/sprint/plan'} onClick={locked ? (e: React.MouseEvent) => e.preventDefault() : undefined}>
        <div
          className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
            locked
              ? 'border-border/30 bg-muted/30 opacity-60 cursor-not-allowed'
              : 'border-primary/25 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent hover:border-primary/40 hover:shadow-lg hover:shadow-primary/[0.06] cursor-pointer'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 py-4">
            <div className={`flex items-center gap-3 shrink-0 ${locked ? 'opacity-70' : ''}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/15">
                <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Plan Your Next Sprint
                  {locked && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">Pro</span>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  AI-powered sprint planning — configure signals, capacity, and goals.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-[12px] transition-all ${
                  locked
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                }`}
              >
                {locked ? <Lock className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                {locked ? 'Upgrade to Plan' : 'Plan Sprint'}
              </span>
              {!locked && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section 2a: Sprint Progress Recap (Left Hero)
// ---------------------------------------------------------------------------

function SprintRecapCard({
  activeSprint,
  sprintTickets,
  progress,
  sprintTerm = 'Sprint',
  hasPointsTradition = true,
  getStatusLabel = (s: string) => s,
}: {
  activeSprint: Sprint;
  sprintTickets: Ticket[];
  progress: ReturnType<typeof computeSprintProgress>;
  sprintTerm?: string;
  hasPointsTradition?: boolean;
  getStatusLabel?: (atlasStatus: string) => string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const doneTickets = sprintTickets.filter(t => t.status === 'done');
  const inReviewTickets = sprintTickets.filter(t => t.status === 'in_review');
  const inProgressTickets = sprintTickets.filter(t => t.status === 'in_progress');
  const blockedTickets = sprintTickets.filter(t => t.status === 'blocked');
  const total = sprintTickets.length || 1;

  const donePoints = doneTickets.reduce((s, t) => s + (t.human_points ?? t.ai_points ?? 0), 0);
  const totalPoints = sprintTickets.reduce((s, t) => s + (t.human_points ?? t.ai_points ?? 0), 0);
  const pointsPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
  const completionPct = total > 0 ? Math.round((doneTickets.length / total) * 100) : 0;

  const segments = [
    { label: getStatusLabel('done'), count: doneTickets.length, pct: total > 0 ? (doneTickets.length / total) * 100 : 0, color: '#7d8c4e' },
    { label: getStatusLabel('in_review'), count: inReviewTickets.length, pct: total > 0 ? (inReviewTickets.length / total) * 100 : 0, color: '#8a6f50' },
    { label: getStatusLabel('in_progress'), count: inProgressTickets.length, pct: total > 0 ? (inProgressTickets.length / total) * 100 : 0, color: '#F59E0B' },
    { label: getStatusLabel('blocked'), count: blockedTickets.length, pct: total > 0 ? (blockedTickets.length / total) * 100 : 0, color: '#EF4444' },
  ];

  const hasBlocked = blockedTickets.length > 0;

  return (
    <WCard className="flex-1 min-w-0" delay={0.1}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{sprintTerm} Progress</p>
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                {activeSprint?.name ?? `Active ${sprintTerm.toLowerCase()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {progress.totalDays > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/30">
                <Clock className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-[11px] tabular-nums font-semibold text-foreground">
                  Day {progress.currentDay}/{progress.totalDays}
                </span>
              </div>
            )}
            <Link href="/sprint/burndown">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50 bg-background/50 opacity-70 hover:opacity-100 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </Link>
          </div>
        </div>

        {/* Stats row: ticket-count mode puts Tickets first, points secondary or hidden */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {hasPointsTradition ? (
            <>
              <div className="rounded-xl border border-border/30 bg-dashboard-surface-muted p-4">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em] mb-1">Points</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[30px]">
                    {donePoints}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">/ {totalPoints}</span>
                </div>
                <p className="text-[11px] font-semibold text-[#7d8c4e] mt-1">{pointsPct}% delivered</p>
              </div>
              <div className={clsx(
                'rounded-xl border p-4',
                hasBlocked ? 'bg-destructive/5 border-destructive/20' : 'bg-dashboard-surface-muted border-border/30',
              )}>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em] mb-1">Tickets</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[30px]">
                    {doneTickets.length}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">/ {total}</span>
                </div>
                <p className={clsx('text-[11px] font-semibold mt-1', hasBlocked ? 'text-destructive' : 'text-[#7d8c4e]')}>
                  {completionPct}% complete{hasBlocked ? ` · ${blockedTickets.length} blocked` : ''}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={clsx(
                'rounded-xl border p-4',
                hasBlocked ? 'bg-destructive/5 border-destructive/20' : 'bg-dashboard-surface-muted border-border/30',
              )}>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em] mb-1">Tickets</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[30px]">
                    {doneTickets.length}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">/ {total}</span>
                </div>
                <p className={clsx('text-[11px] font-semibold mt-1', hasBlocked ? 'text-destructive' : 'text-[#7d8c4e]')}>
                  {completionPct}% complete{hasBlocked ? ` · ${blockedTickets.length} blocked` : ''}
                </p>
              </div>
              <div className="rounded-xl border border-border/30 bg-dashboard-surface-muted p-4 opacity-80">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em] mb-1">Points</p>
                {totalPoints > 0 ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[30px]">
                        {donePoints}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">/ {totalPoints}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-[#7d8c4e] mt-1">{pointsPct}% delivered</p>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No estimates</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Segmented progress bar */}
        <div className="mb-5">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em] mb-2">Status</p>
          <div className="h-3 rounded-full overflow-hidden flex">
            {segments.map((seg, i) => (
              <div
                key={seg.label}
                className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                style={{
                  width: mounted ? `${Math.max(seg.pct, seg.count > 0 ? 2 : 0)}%` : '0%',
                  backgroundColor: seg.color,
                }}
                title={`${seg.label}: ${seg.count}`}
              />
            ))}
            {segments.every(s => s.count === 0) && (
              <div className="flex-1 rounded-full bg-muted/40" />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {segments.filter(s => s.count > 0).map((seg) => (
              <div key={seg.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[10px] font-medium text-muted-foreground">{seg.label}</span>
                <span className="text-[10px] font-bold tabular-nums text-foreground">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/sprint/burndown" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">
          View burndown
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 2b: AI Sprint Intelligence (Right Hero)
// ---------------------------------------------------------------------------

function AIIntelligenceCard({
  progressPct,
  capacityPct,
  accuracyDelta,
  apiAnalytics,
  teamMembers,
  sprintTickets,
}: {
  progressPct: number;
  capacityPct: number;
  accuracyDelta: number;
  apiAnalytics: atlas.AnalyticsOverview | null;
  teamMembers: ReturnType<typeof memberToDisplay>[];
  sprintTickets: Ticket[];
}) {
  const completedTickets = sprintTickets.filter(t => t.status === 'done').length;
  const blockedCount = sprintTickets.filter(t => t.status === 'blocked').length;
  const totalTickets = sprintTickets.length;
  const ticketCompletionPct = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  const velocityTrend = apiAnalytics?.velocity_trend ?? '';
  const velocityChange = apiAnalytics
    ? String(Math.abs((apiAnalytics.avg_velocity ?? 0) - (apiAnalytics.velocity_data?.[apiAnalytics.velocity_data.length - 2]?.actual ?? apiAnalytics.avg_velocity ?? 0)) || 0)
    : '0';

  const projectedCompletion = useMemo(() => {
    if (progressPct <= 0 || totalTickets === 0) return ticketCompletionPct;
    const pace = ticketCompletionPct / Math.max(progressPct, 1);
    return Math.min(100, Math.round(pace * 100));
  }, [progressPct, ticketCompletionPct, totalTickets]);

  const predictionLevel = projectedCompletion >= 85 ? 'good' : projectedCompletion >= 60 ? 'warn' : 'risk';
  const overloaded = teamMembers.filter(m => m.load > 90);

  // Priority-ordered insights
  type Insight = { text: string; icon: 'alert' | 'success' | 'info'; urgent?: boolean };
  const insights: Insight[] = [];

  if (blockedCount > 0) {
    insights.push({ text: `${blockedCount} blocked ticket${blockedCount !== 1 ? 's' : ''} need attention. Unblock to keep sprint on track.`, icon: 'alert', urgent: true });
  }
  if (overloaded.length > 0) {
    const names = overloaded.map(m => m.name.split(' ')[0]).join(', ');
    insights.push({ text: `${names} ${overloaded.length === 1 ? 'is' : 'are'} over 90% load. Consider rebalancing.`, icon: 'alert', urgent: true });
  }
  if (progressPct > 50 && capacityPct > 85) {
    insights.push({ text: `${capacityPct}% capacity used. Consider deferring low-priority items to reduce risk.`, icon: 'info' });
  } else if (progressPct > 40 && ticketCompletionPct > progressPct + 10) {
    insights.push({ text: `Ahead of schedule: ${ticketCompletionPct}% done at ${progressPct}% through sprint.`, icon: 'success' });
  } else if (velocityTrend === 'up' && insights.length < 2) {
    insights.push({ text: `Velocity up ${velocityChange} pts vs average. Capacity at ${capacityPct}%.`, icon: 'success' });
  } else if (accuracyDelta > 5 && insights.length < 2) {
    insights.push({ text: `Estimation accuracy +${accuracyDelta}%. Consider increasing capacity next sprint.`, icon: 'success' });
  } else if (accuracyDelta < -5 && insights.length < 2) {
    insights.push({ text: `Accuracy dropped ${Math.abs(accuracyDelta)}%. Review calibration with the team.`, icon: 'alert' });
  }
  if (insights.length === 0) {
    insights.push({ text: `${progressPct}% through sprint. ${completedTickets}/${totalTickets} tickets completed.`, icon: 'info' });
  }

  const topInsight = insights[0];

  return (
    <WCard className="flex-1 min-w-0 ai-card relative overflow-hidden" delay={0.15}>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-[0.08em]">AI Intelligence</p>
          </div>
          <div className={`prediction-badge prediction-badge-${predictionLevel}`}>
            {predictionLevel === 'good' ? <Shield className="w-3 h-3" /> : predictionLevel === 'warn' ? <AlertTriangle className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
            {projectedCompletion}% projected
          </div>
        </div>

        <h3 className="mb-4 text-[20px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
          Sprint Health
        </h3>

        {/* Top insight callout */}
        <div className={clsx(
          'rounded-xl border p-4 mb-5',
          topInsight.urgent
            ? 'bg-destructive/5 border-destructive/15'
            : topInsight.icon === 'success'
            ? 'bg-[#7d8c4e]/5 border-[#7d8c4e]/15'
            : 'bg-dashboard-surface-muted border-border/30',
        )}>
          <div className="flex gap-3">
            {topInsight.icon === 'alert' && <AlertTriangle className={clsx('w-4 h-4 shrink-0 mt-0.5', topInsight.urgent ? 'text-destructive' : 'text-warning')} />}
            {topInsight.icon === 'success' && <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#7d8c4e]" />}
            {topInsight.icon === 'info' && <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />}
            <p className="text-[13px] font-medium leading-snug text-foreground">
              {topInsight.text}
            </p>
          </div>
        </div>

        {/* Compact stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { value: ticketCompletionPct, label: 'Completed', suffix: '%', color: 'text-foreground' },
            { value: capacityPct, label: 'Capacity', suffix: '%', color: capacityPct > 95 ? 'text-destructive' : capacityPct > 85 ? 'text-warning' : 'text-foreground' },
            { value: accuracyDelta, label: 'Accuracy Δ', suffix: '%', showSign: true, color: accuracyDelta >= 0 ? 'text-[#5e6a3a]' : 'text-destructive' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border/25 bg-dashboard-surface-muted px-3 py-2.5">
              <p className={`text-[18px] font-bold leading-none tracking-tight tabular-nums ${stat.color}`}>
                {stat.showSign && stat.value >= 0 ? '+' : ''}{stat.value}<span className="text-[10px] font-bold text-muted-foreground/50">{stat.suffix}</span>
              </p>
              <p className="text-[9px] text-muted-foreground font-semibold mt-1 uppercase tracking-[0.06em]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link href="/sprint/plan">
            <button className="rounded-lg bg-foreground px-4 py-2 text-[11px] font-semibold text-background transition-opacity hover:opacity-90">
              Sprint Plan
            </button>
          </Link>
          <Link href="/sprint/burndown">
            <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-transparent px-4 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-dashboard-surface-muted">
              Burndown
            </span>
          </Link>
          <Link href="/accuracy">
            <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-transparent px-4 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-dashboard-surface-muted">
              Accuracy
            </span>
          </Link>
        </div>
      </div>
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Metric Cards (REVENUE OVERVIEW / PROJECT HEALTH style)
// ---------------------------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  trendUp,
  trendValue,
  trendLabel,
  footerWarning,
  footerLinkText,
  delay = 0,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  trendUp?: boolean | null;
  trendValue?: string;
  trendLabel: string;
  footerWarning?: string;
  footerLinkText?: string;
  delay?: number;
}) {
  const href = label.includes('Velocity') ? '/analytics' : label.includes('Accuracy') ? '/accuracy' : label.includes('Capacity') ? '/capacity' : '/team';
  return (
    <WCard delay={delay} className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-dashboard-border-soft bg-dashboard-surface shadow-sm">
      <div className="relative p-4">
        {/* Header: light icon, all-caps title, menu */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted/60">
            <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <span className="flex-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
            {label}
          </span>
          <Link href={href} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors shrink-0" aria-label="View details">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
        {/* Primary metric: large bold value */}
        <span className="block text-[24px] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-[28px]">
          {value}
        </span>
        {/* Trend/subtext: e.g. +5% · vs previous sprint */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {trendValue != null && trendUp !== null && trendUp !== undefined && (
              <span className={clsx(
              'inline-flex items-center gap-0.5 text-[13px] font-semibold',
              trendUp ? 'text-[#7d8c4e]' : 'text-destructive',
            )}>
              {trendValue}
              {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </span>
          )}
          {trendLabel && (
            <>
              {trendValue != null && <span className="text-muted-foreground">·</span>}
              <span className="text-[13px] font-medium text-muted-foreground">{trendLabel}</span>
            </>
          )}
        </div>
        {/* Footer: divider, warning, view link */}
        {(footerWarning || footerLinkText) && (
          <div className={clsx(
            'border-t border-border/50 mt-3 pt-3 flex items-center gap-3',
            footerWarning && footerLinkText ? 'justify-between' : 'justify-end',
          )}>
            {footerWarning && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 flex-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="truncate">{footerWarning}</span>
              </span>
            )}
            {footerLinkText && (
              <Link href={href} className="text-xs font-medium text-primary hover:underline shrink-0">
                View {footerLinkText}
              </Link>
            )}
          </div>
        )}
      </div>
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 4a: Recent Ticket Activity
// ---------------------------------------------------------------------------

const INITIAL_ACTIVITY_COUNT = 8;
const LOAD_MORE_COUNT = 8;
const RECENT_ACTIVITY_DAYS = 7;

function getActivitySnippet(ticket: Ticket): string {
  const statusSnippets: Record<string, string> = {
    done: 'Completed',
    in_progress: 'In progress',
    in_review: 'In review',
    blocked: 'Blocked',
    open: 'Open',
    todo: 'To do',
    cancelled: 'Cancelled',
  };
  const statusText = statusSnippets[ticket.status] ?? 'Updated';
  const desc = (ticket.description ?? '').trim();
  if (desc) {
    const snippet = desc.slice(0, 50).replace(/\s+/g, ' ');
    return `${statusText} — ${snippet}${desc.length > 50 ? '…' : ''}`;
  }
  return statusText;
}

function TicketActivityList({
  sprintTickets,
  teamMembers,
  getStatusLabel = (s: string) => s,
}: {
  sprintTickets: Ticket[];
  teamMembers: TeamMember[];
  getStatusLabel?: (atlasStatus: string) => string;
}) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_ACTIVITY_COUNT);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setVisibleCount(INITIAL_ACTIVITY_COUNT); }, [searchQuery, statusFilter]);

  const memberLookup = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const t of teamMembers) {
      const key = t.id.toLowerCase();
      m.set(key, t);
      m.set(t.id, t);
      if (t.user_id) {
        m.set(t.user_id.toLowerCase(), t);
        m.set(t.user_id, t);
      }
      if (t.email) {
        m.set(t.email.toLowerCase().trim(), t);
      }
    }
    return m;
  }, [teamMembers]);

  function resolveAssignee(assigneeId: string | undefined): TeamMember | null {
    if (!assigneeId) return null;
    const normalized = assigneeId.toLowerCase().trim();
    return memberLookup.get(normalized) ?? memberLookup.get(assigneeId) ?? null;
  }

  function formatActivityTime(iso: string): string {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: typeof Shield }> = {
    done: { color: 'bg-success', bg: 'bg-success/10 text-success', label: getStatusLabel('done'), icon: Shield },
    in_progress: { color: 'bg-warning', bg: 'bg-warning/10 text-warning', label: getStatusLabel('in_progress'), icon: Zap },
    in_review: { color: 'bg-[#8a6f50]', bg: 'bg-[#8a6f50]/10 text-[#8a6f50]', label: getStatusLabel('in_review'), icon: FileText },
    blocked: { color: 'bg-destructive', bg: 'bg-destructive/10 text-destructive', label: getStatusLabel('blocked'), icon: AlertTriangle },
    open: { color: 'bg-muted-foreground', bg: 'bg-muted/60 text-muted-foreground', label: getStatusLabel('todo'), icon: Zap },
    todo: { color: 'bg-muted-foreground', bg: 'bg-muted/60 text-muted-foreground', label: getStatusLabel('todo'), icon: Zap },
    backlog: { color: 'bg-muted-foreground', bg: 'bg-muted/60 text-muted-foreground', label: getStatusLabel('backlog'), icon: Zap },
    cancelled: { color: 'bg-muted-foreground', bg: 'bg-muted/60 text-muted-foreground', label: getStatusLabel('cancelled'), icon: Zap },
  };

  const now = Date.now();
  const recentCutoff = now - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000;
  let recentlyUpdated = sprintTickets.filter((t) => new Date(t.updated_at).getTime() >= recentCutoff);
  let filtered = recentlyUpdated.length > 0
    ? [...recentlyUpdated].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    : [...sprintTickets].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  if (statusFilter) {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.external_id ?? '').toLowerCase().includes(q));
  }
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <WCard className="flex-1 min-w-0" delay={0.3}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">Recent Activity</h3>
            <p className="text-[10px] text-muted-foreground/50 font-medium">
              {recentlyUpdated.length > 0
                ? `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''} with activity in last ${RECENT_ACTIVITY_DAYS} days`
                : `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''} in sprint (no updates in ${RECENT_ACTIVITY_DAYS}d)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground/60'}`}
            title="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter ? null : 'in_progress')}
            className={`p-1.5 rounded-lg transition-colors ${statusFilter ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground/60'}`}
            title="Filter by status"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showSearch && (
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 text-xs rounded-xl border border-border/40 bg-secondary/60 mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 placeholder:text-muted-foreground/40 transition-all"
        />
      )}

      {statusFilter && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all duration-200 ${
                statusFilter === key ? cfg.bg + ' shadow-sm' : 'bg-muted/60 text-muted-foreground/70 hover:bg-secondary'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2.5">
            <Zap className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/60 font-medium">No tickets to show</p>
        </div>
      ) : (
        <>
          <div className="space-y-0 overflow-y-auto pr-1 scrollbar-thin max-h-[380px]">
            {displayed.map((ticket, idx) => {
              const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
              const StatusIcon = cfg.icon;
              const points = ticket.human_points ?? ticket.ai_points ?? 0;

              return (
                <Link key={ticket.id} href={ticket.external_url || `/backlog?ticket=${ticket.id}`} target={ticket.external_url ? '_blank' : undefined} rel={ticket.external_url ? 'noopener noreferrer' : undefined}>
                  <motion.div
                    className="group grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 items-center py-3 px-3 border-b border-border/20 last:border-b-0 hover:bg-secondary/40 rounded-xl transition-all duration-200"
                    initial={mounted ? { opacity: 0, y: 4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.02 * idx }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <StatusIcon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {getActivitySnippet(ticket)}
                      </p>
                      {(ticket.external_id || points > 0) && (
                        <p className="text-[10px] text-muted-foreground/40 truncate font-mono mt-0.5">
                          {ticket.external_id || ticket.id.slice(0, 8)}
                          {points > 0 && <span className="ml-1.5 tabular-nums text-primary/80">{points} pts</span>}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${cfg.bg}`}>
                      {ticket.status === 'done' && <Shield className="w-3 h-3" />}
                      {ticket.status === 'blocked' && <AlertTriangle className="w-3 h-3" />}
                      {cfg.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <AssigneeAvatarStack
                        assignee_id={ticket.assignee_id}
                        assignee_ids={ticket.assignee_ids}
                        teamMembers={teamMembers}
                        maxVisible={2}
                        size="sm"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-medium shrink-0 tabular-nums">
                      {formatActivityTime(ticket.updated_at)}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
              className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] text-[12px] font-semibold text-primary flex items-center justify-center gap-1.5 transition-all"
            >
              Load more
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 4b: Sprint Velocity Chart (Money Flow State style)
// ---------------------------------------------------------------------------

const RANGE_OPTIONS = [
  { key: 'last3' as const, label: '3 sprints' },
  { key: 'last6' as const, label: '6 sprints' },
  { key: 'all' as const, label: 'All' },
];

function VelocityChart({
  apiAnalytics,
}: {
  apiAnalytics: atlas.AnalyticsOverview | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<'last3' | 'last6' | 'all'>('last6');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const allData = apiAnalytics?.velocity_data ?? [];
  const sliced = range === 'last3' ? allData.slice(-3) : range === 'last6' ? allData.slice(-6) : allData;
  const avgVelocity = apiAnalytics?.avg_velocity ?? 0;

  const velocityData = sliced.map((v, i, arr) => {
    const actual = v.actual ?? 0;
    const planned = v.planned ?? 0;
    const prevActual = arr[i - 1]?.actual ?? 0;
    return {
      label: (v.sprint_name ?? 'Sprint').replace(/^Sprint\s*/i, 'S'),
      actual,
      planned,
      current: i === arr.length - 1,
      delta: actual - planned,
      pctChange: prevActual > 0 ? Math.round(((actual - prevActual) / prevActual) * 100) : 0,
    };
  });

  const baseline = avgVelocity || (velocityData.length > 0
    ? Math.round(velocityData.reduce((s, d) => s + d.planned, 0) / velocityData.length)
    : 0);
  const maxDelta = Math.max(
    ...velocityData.map(d => Math.max(
      (d.actual ?? 0) - baseline,
      baseline - (d.actual ?? 0)
    )),
    1
  );
  const rangeLabel = RANGE_OPTIONS.find(r => r.key === range)?.label ?? range;

  return (
    <WCard className="flex-1 min-w-0" delay={0.3}>
      {/* Header: title left, dropdown right */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">Sprint Velocity</h3>
            <p className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">{baseline.toFixed(0)} pts baseline</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setRangeOpen(!rangeOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card text-[11px] font-medium text-foreground hover:bg-secondary/60"
          >
            {rangeLabel}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {rangeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 py-1 rounded-xl bg-card border border-border shadow-lg shadow-black/10 min-w-[100px]">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setRange(opt.key); setRangeOpen(false); }}
                    className={`w-full px-3 py-2 text-left text-[11px] font-medium transition-colors ${
                      range === opt.key ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {velocityData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2.5">
            <BarChart3 className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/60 font-medium">No velocity data yet</p>
        </div>
      ) : (
        <>
          {/* Chart: Y-axis left, center-out bars, baseline */}
          <div className="flex gap-2 h-44">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between py-2 text-[10px] font-medium text-muted-foreground tabular-nums shrink-0">
              <span>{Math.ceil(baseline + maxDelta)}</span>
              <span>{baseline}</span>
              <span>{Math.floor(Math.max(0, baseline - maxDelta))}</span>
            </div>
            {/* Chart area */}
            <div className="flex-1 flex gap-1 sm:gap-2 min-w-0">
              {velocityData.map((entry, idx) => {
                const isHovered = hoveredBar === idx;
                const delta = entry.actual - baseline;
                const upPct = delta > 0 ? (delta / maxDelta) * 50 : 0;
                const downPct = delta < 0 ? (Math.abs(delta) / maxDelta) * 50 : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center relative"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-28 rounded-lg bg-card border border-border shadow-lg shadow-black/10 p-2.5">
                        <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Completed</p>
                        <p className="text-base font-bold text-foreground tabular-nums">{entry.actual} pts</p>
                        {entry.pctChange !== 0 && (
                          <span className={`text-[10px] font-semibold ${entry.pctChange > 0 ? 'text-[#7d8c4e]' : 'text-destructive'}`}>
                            {entry.pctChange > 0 ? '+' : ''}{entry.pctChange}%
                          </span>
                        )}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-card border-r border-b border-border" />
                      </div>
                    )}
                    {/* Column with light gray track + center-out bars */}
                    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[120px] relative bg-muted/30 rounded-xl">
                      {/* Baseline (horizontal dashed) */}
                      <div
                        className="absolute left-0 right-0 h-px border-t border-dashed border-muted-foreground/40 z-10"
                        style={{ top: '50%' }}
                      />
                      {/* Center-out bars */}
                      <div className="absolute inset-0 flex flex-col justify-center px-1">
                        <div className="relative w-full h-full flex justify-center items-center">
                          {/* Upward bar (above baseline) */}
                          {delta > 0 && (
                            <div
                              className="absolute w-[65%] min-w-[10px] rounded-full transition-all duration-700 ease-out"
                              style={{
                                height: mounted ? `${upPct}%` : '0%',
                                bottom: '50%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: entry.current || isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.7)',
                                transitionDelay: `${idx * 0.08}s`,
                              }}
                            />
                          )}
                          {/* Downward bar (below baseline) */}
                          {delta < 0 && (
                            <div
                              className="absolute w-[65%] min-w-[10px] rounded-full transition-all duration-700 ease-out"
                              style={{
                                height: mounted ? `${downPct}%` : '0%',
                                top: '50%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'hsl(var(--muted-foreground) / 0.35)',
                                transitionDelay: `${idx * 0.08}s`,
                              }}
                            />
                          )}
                          {/* Hover: dashed vertical line + dot */}
                          {isHovered && (
                            <>
                              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px border-l border-dashed border-foreground/40" />
                              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-card border-2 border-foreground flex items-center justify-center z-10">
                                <div className="w-1 h-1 rounded-full bg-foreground" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* X-axis label */}
                    <div className="text-center mt-2">
                      <span className={`text-[10px] tabular-nums font-medium ${entry.current ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}`}>
                        {entry.label}
                      </span>
                      {entry.current && <span className="block text-[8px] text-primary font-bold uppercase tracking-wider">now</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span className="w-3 h-2 rounded-sm bg-foreground/80 inline-block" /> Above plan
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span className="w-3 h-2 rounded-sm bg-muted-foreground/40 inline-block" /> Below plan
            </span>
            <span className="text-[11px] font-semibold text-[#7d8c4e] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {avgVelocity.toFixed(1)} avg
            </span>
          </div>
        </>
      )}
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Team Workload
// ---------------------------------------------------------------------------

function TeamWorkloadCard({
  teamMembers,
}: {
  teamMembers: ReturnType<typeof memberToDisplay>[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (teamMembers.length === 0) return null;

  // Prioritize members with tickets, then sort by load
  const sorted = [...teamMembers].sort((a, b) => {
    const aHas = a.stories > 0 ? 1 : 0;
    const bHas = b.stories > 0 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    return b.load - a.load;
  });
  const displayMembers = sorted.slice(0, 4);
  const avgLoad = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s, m) => s + m.load, 0) / teamMembers.length)
    : 0;
  const healthy = teamMembers.filter(m => m.load <= 70).length;
  const atRisk = teamMembers.filter(m => m.load > 70 && m.load <= 90).length;
  const overloaded = teamMembers.filter(m => m.load > 90).length;

  function loadColor(load: number): string {
    if (load > 90) return '#EF4444';
    if (load > 70) return '#F59E0B';
    return '#7d8c4e';
  }

  function loadStatus(load: number): 'healthy' | 'at-risk' | 'overloaded' {
    if (load > 90) return 'overloaded';
    if (load > 70) return 'at-risk';
    return 'healthy';
  }

  return (
    <WCard delay={0.35}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">Team Workload</h3>
            <p className="text-[11px] text-muted-foreground font-medium">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} • avg {avgLoad}%</p>
          </div>
        </div>
        <Link href="/team">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer">
            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-primary">Team</span>
          </div>
        </Link>
      </div>

      {/* Distribution summary */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#7d8c4e]/10 border border-[#7d8c4e]/15">
          <span className="w-2 h-2 rounded-full bg-[#7d8c4e] shrink-0" />
          <span className="text-[11px] font-semibold text-[#5e6a3a]">{healthy} healthy</span>
        </div>
        {atRisk > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/15">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
            <span className="text-[11px] font-semibold text-[#D97706]">{atRisk} at risk</span>
          </div>
        )}
        {overloaded > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/15">
            <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
            <span className="text-[11px] font-semibold text-destructive">{overloaded} overloaded</span>
          </div>
        )}
      </div>

      {/* Average bar */}
      <div className="flex items-center gap-3 mb-6 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] shrink-0 w-8">Avg</span>
        <div className="flex-1 h-2 rounded-full bg-muted/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: mounted ? `${Math.min(avgLoad, 100)}%` : '0%',
              backgroundColor: loadColor(avgLoad),
            }}
          />
        </div>
        <span className="text-[13px] font-bold tabular-nums shrink-0 w-10 text-right" style={{ color: loadColor(avgLoad) }}>
          {avgLoad}%
        </span>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {displayMembers.map((member, idx) => {
          const status = loadStatus(member.load);
          return (
            <motion.div
              key={member.name}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/40 transition-all duration-200 border border-transparent hover:border-border/30"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.35 + idx * 0.03 }}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[12px] font-semibold text-foreground truncate">{member.name}</span>
                  <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: loadColor(member.load) }}>
                    {member.load}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: mounted ? `${Math.min(member.load, 100)}%` : '0%',
                      backgroundColor: loadColor(member.load),
                      transitionDelay: `${idx * 0.04}s`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                    {member.stories} ticket{member.stories !== 1 ? 's' : ''}
                    {typeof member.points === 'number' && member.points > 0 && (
                      <span className="ml-1">· {member.points} pts</span>
                    )}
                  </span>
                  {status !== 'healthy' && (
                    <span className={clsx(
                      'text-[9px] font-bold uppercase px-1.5 py-[1px] rounded',
                      status === 'overloaded' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning',
                    )}>
                      {status === 'overloaded' ? 'Over' : 'At risk'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        {teamMembers.length > 4 && (
          <Link href="/team" className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-semibold text-primary">
              View all {teamMembers.length} members
            </span>
          </Link>
        )}
        <Link href="/sprint/scoreboard" className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-primary">
            Scoreboard
          </span>
        </Link>
      </div>
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Suggested For You
// ---------------------------------------------------------------------------

interface Suggestion {
  id: string;
  icon: typeof Sparkles;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

function SuggestedForYouCard({
  sprintTickets,
  teamMembers,
  accuracyDelta,
  capacityPct,
  progressPct,
  activeSprint,
  projectId,
  unallocatedCount = 0,
  hasPointsTradition = true,
}: {
  sprintTickets: Ticket[];
  teamMembers: ReturnType<typeof memberToDisplay>[];
  accuracyDelta: number;
  capacityPct: number;
  progressPct: number;
  activeSprint: Sprint | null;
  projectId: string | null;
  unallocatedCount?: number;
  hasPointsTradition?: boolean;
}) {
  const insights = useMemo(
    () => getSprintInsights(sprintTickets, activeSprint, { completionPct: progressPct, capacityPct }),
    [sprintTickets, activeSprint, progressPct, capacityPct],
  );

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];

    const blockedCount = sprintTickets.filter(t => t.status === 'blocked').length;
    if (blockedCount > 0) {
      items.push({
        id: 'unblock',
        icon: AlertTriangle,
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        title: `Unblock ${blockedCount} ticket${blockedCount !== 1 ? 's' : ''}`,
        description: 'Blocked tickets are stalling sprint progress. Review and resolve blockers.',
        href: '/tickets?status=blocked',
        ctaLabel: 'View blocked',
      });
    }

    const unassigned = sprintTickets.filter(t => !t.assignee_id && t.status !== 'done' && t.status !== 'cancelled').length;
    if (unassigned > 0) {
      items.push({
        id: 'assign',
        icon: UserCheck,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        title: `Assign ${unassigned} unassigned ticket${unassigned !== 1 ? 's' : ''}`,
        description: 'Unassigned work may slip through the cracks. Distribute to team members.',
        href: '/tickets',
        ctaLabel: 'Assign tickets',
      });
    }

    if (unallocatedCount > 0 && hasPointsTradition) {
      items.push({
        id: 'suggest-points',
        icon: Sparkles,
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-600 dark:text-violet-400',
        title: `Suggest points for ${unallocatedCount} ticket${unallocatedCount !== 1 ? 's' : ''}`,
        description: 'ATLAS can estimate based on title, description, and complexity. Improves planning accuracy.',
        href: '/tickets?suggest=estimate',
        ctaLabel: 'Suggest points',
      });
    }

    if (accuracyDelta < -5) {
      items.push({
        id: 'calibrate',
        icon: Target,
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-400',
        title: 'Review estimation accuracy',
        description: `Accuracy dropped ${Math.abs(accuracyDelta)}% this sprint. Calibrate with your team.`,
        href: '/accuracy',
        ctaLabel: 'Check accuracy',
      });
    }

    const overloaded = teamMembers.filter(m => m.load > 90);
    if (overloaded.length > 0) {
      items.push({
        id: 'rebalance',
        icon: Users,
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-600 dark:text-orange-400',
        title: 'Rebalance team workload',
        description: `${overloaded.map(m => m.name.split(' ')[0]).join(', ')} ${overloaded.length === 1 ? 'is' : 'are'} over 90% capacity.`,
        href: '/team',
        ctaLabel: 'View team',
      });
    }

    if (progressPct > 50 && capacityPct < 60) {
      items.push({
        id: 'backlog',
        icon: Layers,
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-600 dark:text-sky-400',
        title: 'Review your backlog',
        description: 'Sprint is past halfway with low capacity usage. Pull in more work or groom backlog.',
        href: '/backlog',
        ctaLabel: 'Open backlog',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'plan',
        icon: Sparkles,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        title: 'Plan your next sprint',
        description: 'Sprint is on track. Start preparing scope for the next cycle.',
        href: '/sprint/plan',
        ctaLabel: 'Plan sprint',
      });
    }

    return items.slice(0, 3);
  }, [sprintTickets, teamMembers, accuracyDelta, capacityPct, progressPct]);

  const hasInsights = insights.blockedCount > 0 || insights.staleCount > 0 || insights.scopeCreepAlert || insights.outcomePrediction.label !== 'On track';

  return (
    <WCard delay={0.12}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-tight">Suggested for you</h3>
          <p className="text-[10px] text-muted-foreground/50 font-medium">
            {insights.outcomePrediction.label} · ~{insights.outcomePrediction.expectedPct}% expected delivery
          </p>
        </div>
      </div>

      {/* Sprint insights: blocked, stale, scope creep */}
      {hasInsights && (
        <div className="space-y-3 mb-4 pb-4 border-b border-border/30">
          {insights.blockedCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-foreground">Blocked tickets</span>
                <Link
                  href={projectId ? '/tickets?status=blocked' : '#'}
                  className="text-[11px] font-medium text-primary hover:underline ml-auto"
                >
                  View {insights.blockedCount} ticket{insights.blockedCount !== 1 ? 's' : ''}
                </Link>
              </div>
              <div className="flex flex-wrap gap-1">
                {insights.blockedTickets.slice(0, 4).map((t) => (
                  <Link
                    key={t.id}
                    href={t.external_url ?? (projectId ? '/tickets?status=blocked' : '#')}
                    target={t.external_url ? '_blank' : undefined}
                    rel={t.external_url ? 'noopener noreferrer' : undefined}
                    className="text-[11px] text-muted-foreground hover:text-primary truncate max-w-[140px]"
                  >
                    {t.external_id ?? t.id}
                  </Link>
                ))}
                {insights.blockedCount > 4 && (
                  <span className="text-[11px] text-muted-foreground">+{insights.blockedCount - 4} more</span>
                )}
              </div>
            </div>
          )}
          {insights.staleCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {insights.staleCount} stale ticket{insights.staleCount !== 1 ? 's' : ''} (no update 7+ days)
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {insights.staleTickets.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    href={t.external_url ?? '#'}
                    target={t.external_url ? '_blank' : undefined}
                    rel={t.external_url ? 'noopener noreferrer' : undefined}
                    className="text-[11px] text-muted-foreground hover:text-primary truncate max-w-[120px]"
                  >
                    {t.external_id ?? t.id}
                  </Link>
                ))}
                {insights.staleCount > 3 && (
                  <span className="text-[11px] text-muted-foreground">+{insights.staleCount - 3} more</span>
                )}
              </div>
            </div>
          )}
          {insights.scopeCreepAlert && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs font-semibold text-foreground">Scope creep</span>
              <span className="text-[11px] text-muted-foreground">— points added during sprint; consider reviewing scope.</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 + idx * 0.05 }}
            >
              <Link href={s.href}>
                <div className="group flex items-start gap-3 p-3 rounded-xl border border-border/20 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <Icon className={`w-4 h-4 ${s.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.description}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    {s.ctaLabel}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </WCard>
  );
}

// ---------------------------------------------------------------------------
// Section 7: Quick Actions Strip
// ---------------------------------------------------------------------------

function QuickActionsStrip() {
  const { tier } = usePlan();
  const actions = [
    { label: 'Plan Sprint', desc: 'AI-powered sprint planning', icon: Sparkles, href: '/sprint/plan', iconColor: 'text-[#b45837] dark:text-[#d97757]', iconBg: 'bg-[#b45837]/12 dark:bg-[#d97757]/12' },
    { label: 'View Backlog', desc: 'Prioritize & groom tickets', icon: Layers, href: '/backlog', iconColor: 'text-[#8a6420] dark:text-[#d4a155]', iconBg: 'bg-[#c8923c]/12 dark:bg-[#d4a155]/12' },
    { label: 'Check Accuracy', desc: 'Estimation precision', icon: Target, href: '/accuracy', iconColor: 'text-[#5e6a3a] dark:text-[#b8c688]', iconBg: 'bg-[#7d8c4e]/12 dark:bg-[#9aa86a]/12' },
    { label: 'Integrations', desc: 'Connect your boards', icon: Kanban, href: '/integrations', iconColor: 'text-[#704a30] dark:text-[#b88864]', iconBg: 'bg-[#a07050]/12 dark:bg-[#b88864]/12' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        const locked = isRouteLocked(action.href, tier);

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
          >
            <Link href={locked ? '#' : action.href} onClick={locked ? (e: React.MouseEvent) => e.preventDefault() : undefined}>
              <div
                className={`group winboard-card flex items-center gap-3 transition-all duration-300 ${
                  locked
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-primary/15 cursor-pointer'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${locked ? 'bg-muted' : action.iconBg}`}>
                  {locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Icon className={`w-4 h-4 ${action.iconColor}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[13px] font-medium block leading-tight ${locked ? 'text-muted-foreground' : 'text-foreground/90'}`}>
                    {action.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 hidden sm:block font-medium">{action.desc}</span>
                </div>
                {locked && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/8 text-primary ml-auto shrink-0">Pro</span>
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="dashboard-scope space-y-5 sm:space-y-6 pb-10">
      {/* Banner skeleton */}
      <div className="rounded-2xl bg-secondary/50 border border-border/30 px-7 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0">
          <div className="space-y-2.5 shrink-0 lg:w-[260px] xl:w-[300px] lg:pr-8">
            <div className="w-28 h-2.5 rounded skeleton" />
            <div className="w-52 h-7 rounded-lg skeleton" />
            <div className="w-64 h-3.5 rounded skeleton" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 flex-1 lg:border-l lg:border-border/20 lg:pl-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`space-y-2 py-1 ${i > 0 ? 'pl-5 lg:pl-6 border-l border-border/12' : 'pr-5 lg:pr-6'}`}>
                <div className="w-20 h-2.5 rounded skeleton" />
                <div className="flex items-center gap-2">
                  <div className="w-9 h-7 rounded skeleton" />
                  <div className="w-20 h-5 rounded-full skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="lg:col-span-3 winboard-card space-y-4">
          <div className="w-28 h-3 rounded skeleton" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-20 h-2.5 rounded skeleton" />
              <div className="w-24 h-8 rounded skeleton" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-2.5 rounded skeleton" />
              <div className="w-20 h-8 rounded skeleton" />
            </div>
          </div>
          <div className="w-full h-3 rounded-full skeleton" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full h-[5px] rounded-full skeleton" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 winboard-card space-y-4">
          <div className="w-24 h-3 rounded skeleton" />
          <div className="w-44 h-6 rounded-lg skeleton" />
          <div className="w-full h-12 rounded skeleton" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
          <div className="w-32 h-9 rounded-xl skeleton" />
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="winboard-card space-y-3">
            <div className="flex justify-between">
              <div className="w-24 h-3 rounded skeleton" />
              <div className="w-7 h-7 rounded-lg skeleton" />
            </div>
            <div className="flex items-end justify-between mt-2">
              <div className="space-y-2">
                <div className="w-14 h-2.5 rounded skeleton" />
                <div className="w-20 h-9 rounded skeleton" />
                <div className="w-16 h-3 rounded skeleton" />
              </div>
              <div className="w-[60px] h-[34px] rounded skeleton" />
            </div>
            <div className="w-36 h-3 rounded skeleton mt-1" />
          </div>
        ))}
      </div>

      {/* Bottom section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="winboard-card space-y-3">
          <div className="w-40 h-4 rounded skeleton" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-full h-10 rounded skeleton" />
          ))}
        </div>
        <div className="winboard-card space-y-3">
          <div className="w-32 h-4 rounded skeleton" />
          <div className="w-full h-44 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const STEP_3D_ASSETS = [
  { src: 'https://img.icons8.com/3d-fluency/256/link.png', alt: 'Connect' },
  { src: 'https://img.icons8.com/3d-fluency/256/brain.png', alt: 'AI' },
  { src: 'https://img.icons8.com/3d-fluency/256/combo-chart.png', alt: 'Track' },
];

const PREVIEW_3D_ASSETS = [
  { src: 'https://img.icons8.com/3d-fluency/128/goal.png', alt: 'Accuracy' },
  { src: 'https://img.icons8.com/3d-fluency/128/positive-dynamic.png', alt: 'Velocity' },
  { src: 'https://img.icons8.com/3d-fluency/128/bot.png', alt: 'AI' },
  { src: 'https://img.icons8.com/3d-fluency/128/conference-call.png', alt: 'Team' },
];

type EmptyReason = 'no_project' | 'no_sprint' | 'loading_failed';

function EmptyDashboard({ reason, sprintTerm = 'Sprint' }: { reason: EmptyReason; sprintTerm?: string }) {
  const content: Record<EmptyReason, { heading: string; body: string; cta: string; ctaHref: string; secondaryCta?: string; secondaryHref?: string }> = {
    no_project: {
      heading: 'Welcome to ATLAS',
      body: 'Connect a project board to unlock AI-powered sprint intelligence. ATLAS will analyze your backlog, estimate tickets, and help you plan with confidence.',
      cta: 'Connect Your First Project',
      ctaHref: '/integrations',
      secondaryCta: 'Create Project Manually',
      secondaryHref: '/projects',
    },
    no_sprint: {
      heading: `No Active ${sprintTerm}`,
      body: `Your project is connected but there's no active ${sprintTerm.toLowerCase()} yet. Generate an AI-powered plan or sync your board to pull in the latest cycle.`,
      cta: `Plan Your First ${sprintTerm}`,
      ctaHref: '/sprint/plan',
      secondaryCta: 'View Backlog',
      secondaryHref: '/backlog',
    },
    loading_failed: {
      heading: 'Couldn\u2019t Load Dashboard',
      body: 'We ran into a hiccup fetching your sprint data. This usually resolves quickly \u2014 try refreshing, or check your integration status.',
      cta: 'Refresh Page',
      ctaHref: '#',
      secondaryCta: 'Check Integrations',
      secondaryHref: '/integrations',
    },
  };

  const c = content[reason];

  return (
    <div className="dashboard-scope space-y-8 pb-10">
      <div className="relative rounded-2xl overflow-hidden bg-accent/50">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,17,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,17,44,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.06), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 5s ease-in-out infinite',
          }}
        />

        <motion.div
          className="relative flex flex-col items-center text-center px-4 sm:px-8 py-10 sm:py-16 lg:py-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <DashboardIllustration className="w-[260px] h-[200px] mb-2" />

          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mt-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              {c.heading}
            </span>
          </motion.h1>

          <motion.p
            className="text-sm md:text-base text-muted-foreground mt-3 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
          >
            {c.body}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          >
            <Link href={c.ctaHref} onClick={c.ctaHref === '#' ? () => window.location.reload() : undefined}>
              <button
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.25)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                {c.cta}
              </button>
            </Link>
            {c.secondaryCta && c.secondaryHref && (
              <Link href={c.secondaryHref}>
                <button className="px-6 py-3 rounded-xl font-medium text-sm text-primary border border-primary/20 hover:bg-primary/5 transition-colors flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {c.secondaryCta}
                </button>
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Getting started steps */}
      <div>
        <motion.h3
          className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <Rocket className="w-4 h-4 text-primary" />
          Get Started in 3 Steps
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { step: 1, title: 'Connect a Board', desc: 'Link your Jira, Linear, ClickUp, Asana, Monday, or other board so ATLAS can sync your backlog and sprint data.', href: '/integrations' },
            { step: 2, title: 'Generate AI Plan', desc: 'ATLAS analyzes velocity, signals, and capacity to compose a data-driven sprint plan.', href: '/sprint/plan' },
            { step: 3, title: 'Track & Improve', desc: 'Monitor accuracy, burndown, and team load in real time. Each sprint gets smarter.', href: '/accuracy' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + idx * 0.12, ease: 'easeOut' }}
            >
              <Link href={item.href}>
                <div className="group relative bg-muted/50 backdrop-blur-sm rounded-3xl p-6 min-h-[220px] overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 border border-border/40 hover:border-primary/20 cursor-pointer h-full">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.12] group-hover:opacity-[0.2] transition-opacity duration-500">
                    <img
                      src={STEP_3D_ASSETS[idx].src}
                      alt={STEP_3D_ASSETS[idx].alt}
                      width={140}
                      height={140}
                      className="group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-background/80 backdrop-blur-sm border border-border/60 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <img src={STEP_3D_ASSETS[idx].src} alt={STEP_3D_ASSETS[idx].alt} width={32} height={32} className="select-none pointer-events-none" draggable={false} />
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">Step {item.step}</span>
                    </div>
                    <h4 className="text-base font-semibold text-foreground mb-1.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-14 h-14 bg-background/90 backdrop-blur-sm rounded-tl-2xl flex items-center justify-center border-l border-t border-border/40">
                    <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 shadow-sm">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Preview cards */}
      <div>
        <motion.h3
          className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Gauge className="w-4 h-4 text-primary" />
          What Your Dashboard Will Look Like
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Sprint Accuracy', preview: '-- %', hint: 'Tracks estimation precision' },
            { label: 'Velocity Trend', preview: '-- pts', hint: 'Points per sprint over time' },
            { label: 'AI Confidence', preview: '-- %', hint: 'Model certainty in predictions' },
            { label: 'Team Capacity', preview: '-- / --', hint: 'Allocated vs total points' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="group rounded-2xl border border-dashed border-border bg-secondary p-5 flex flex-col items-center text-center gap-3 hover:border-primary/20 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.95 + idx * 0.08, ease: 'easeOut' }}
            >
              <div className="w-14 h-14 flex items-center justify-center">
                <img
                  src={PREVIEW_3D_ASSETS[idx].src}
                  alt={PREVIEW_3D_ASSETS[idx].alt}
                  width={48}
                  height={48}
                  className="group-hover:scale-110 transition-transform duration-300 select-none pointer-events-none opacity-80 group-hover:opacity-100"
                  draggable={false}
                />
              </div>
              <div>
                <p className="text-lg font-bold text-border tabular-nums">{item.preview}</p>
                <p className="text-xs font-medium text-secondary-foreground mt-0.5">{item.label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.hint}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Section Order (localStorage persistence)
// ---------------------------------------------------------------------------

const SECTION_ORDER_KEY = 'atlas_dashboard_section_order';
const HIDDEN_SECTIONS_KEY = 'atlas_dashboard_hidden_sections';
const DEFAULT_SECTION_ORDER = ['sprint-hero', 'metric-cards', 'activity-velocity', 'suggested-for-you', 'sprint-insights', 'milestones', 'plan-sprint', 'team-workload', 'quick-actions'];

const SECTION_LABELS: Record<string, string> = {
  'plan-sprint': 'Plan Sprint',
  'suggested-for-you': 'Suggested for You',
  'sprint-hero': 'Sprint Progress',
  'metric-cards': 'Metrics',
  'activity-velocity': 'Activity & Velocity',
  'team-workload': 'Team Workload',
  'sprint-insights': 'Sprint Insights',
  'milestones': 'Milestones',
  'quick-actions': 'Quick Actions',
};

function useDashboardSectionOrder() {
  const [order, setOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SECTION_ORDER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const missing = DEFAULT_SECTION_ORDER.filter(id => !parsed.includes(id));
        const extra = parsed.filter(id => !DEFAULT_SECTION_ORDER.includes(id));
        if (missing.length === 0 && extra.length === 0) {
          setOrder(parsed);
        } else if (extra.length === 0 && missing.length > 0) {
          setOrder([...parsed, ...missing]);
        }
      }
    } catch { /* use default */ }
  }, []);

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    try { localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(newOrder)); } catch { /* ignore */ }
  }, []);

  return { order, updateOrder };
}

const DEFAULT_HIDDEN_SECTIONS = ['team-workload'];

function useDashboardHiddenSections() {
  const [hidden, setHidden] = useState<Set<string>>(new Set(DEFAULT_HIDDEN_SECTIONS));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIDDEN_SECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setHidden(new Set(parsed));
      }
    } catch { /* use default */ }
  }, []);

  const toggle = useCallback((sectionId: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      try { localStorage.setItem(HIDDEN_SECTIONS_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isHidden = useCallback((sectionId: string) => hidden.has(sectionId), [hidden]);

  return { hidden, toggle, isHidden };
}

// ---------------------------------------------------------------------------
// Sortable Dashboard Section Wrapper
// ---------------------------------------------------------------------------

function SortableDashboardSection({
  id,
  children,
  onToggleVisibility,
}: {
  id: string;
  children: React.ReactNode;
  onToggleVisibility?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/section relative">
      <div
        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/section:opacity-40 transition-opacity cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {onToggleVisibility && (
        <button
          onClick={() => onToggleVisibility(id)}
          className="absolute -left-6 top-1 opacity-0 group-hover/section:opacity-40 hover:!opacity-100 transition-opacity p-0.5 rounded-md hover:bg-secondary"
          title={`Hide ${SECTION_LABELS[id] ?? id}`}
        >
          <EyeOff className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [apiAccuracy, setApiAccuracy] = useState<atlas.AccuracyOverview | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<atlas.AnalyticsOverview | null>(null);
  const [apiTeamMembers, setApiTeamMembers] = useState<TeamMember[]>([]);
  const [sprintTickets, setSprintTickets] = useState<Ticket[]>([]);
  const [boardStructure, setBoardStructure] = useState<atlas.BoardStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const { projects, activeProject, loading: ctxLoading, activeSprint, sprintLoading } = useProject();
  const sprintTerm = getSprintTerm(activeProject);
  const isKanbanMode = !activeSprint && boardStructure != null && !hasSprintSupport(boardStructure);
  const { isDemo } = useAuth();

  const { order: sectionOrder, updateOrder: setSectionOrder } = useDashboardSectionOrder();
  const { getStatusLabel } = useBoardColumnLabels(activeProject?.id);
  const { hidden: hiddenSections, toggle: toggleSection, isHidden } = useDashboardHiddenSections();
  const [showSectionSettings, setShowSectionSettings] = useState(false);
  const dashSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionOrder.indexOf(active.id as string);
    const newIndex = sectionOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setSectionOrder(arrayMove(sectionOrder, oldIndex, newIndex));
  }, [sectionOrder, setSectionOrder]);

  useEffect(() => {
    if (!ctxLoading && !sprintLoading) return;
    const id = setTimeout(() => { setLoading(false); }, 20_000);
    return () => clearTimeout(id);
  }, [ctxLoading, sprintLoading]);

  useEffect(() => {
    if (ctxLoading || sprintLoading) return;
    if (!activeProject) {
      setLoading(false);
      setBoardStructure(null);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      setApiAccuracy(null);
      setApiAnalytics(null);
      setApiTeamMembers([]);
      setSprintTickets([]);

      try {
        try {
          const [acc, analytics] = await Promise.all([
            atlas.getAccuracyOverview(activeProject!.id),
            atlas.getAnalyticsOverview(activeProject!.id),
          ]);
          if (!cancelled) {
            setApiAccuracy(acc);
            setApiAnalytics(analytics);
          }
        } catch {
          // non-critical
        }

        try {
          const members = await getTeamMembers(activeProject!.id);
          if (!cancelled && Array.isArray(members)) setApiTeamMembers(members);
        } catch {
          // non-critical
        }

        if (activeSprint) {
          setBoardStructure(null);
          try {
            let tickets = await getSprintTicketsFull(activeProject!.id, activeSprint.id);
            if (!Array.isArray(tickets)) tickets = [];

            if (tickets.length === 0) {
              try {
                const allTickets = await getTickets(activeProject!.id);
                if (Array.isArray(allTickets)) {
                  tickets = allTickets.filter(
                    (t) => t.status !== 'done' && t.status !== 'cancelled',
                  );
                }
              } catch {
                // best-effort fallback
              }
            }

            if (!cancelled) setSprintTickets(tickets);
          } catch {
            try {
              const allTickets = await getTickets(activeProject!.id);
              if (!cancelled && Array.isArray(allTickets)) {
                setSprintTickets(
                  allTickets.filter(
                    (t) => t.status !== 'done' && t.status !== 'cancelled',
                  ),
                );
              }
            } catch {
              // truly non-critical
            }
          }
        } else {
          const structure = await detectBoardStructure(activeProject!).catch(() => null);
          if (cancelled) return;
          setBoardStructure(structure);
          if (structure && !hasSprintSupport(structure)) {
            try {
              const allTickets = await getTickets(activeProject!.id);
              if (!cancelled && Array.isArray(allTickets)) {
                setSprintTickets(
                  allTickets.filter(
                    (t) => t.status !== 'done' && t.status !== 'cancelled',
                  ),
                );
              }
            } catch {
              // best-effort
            }
          }
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [activeProject?.id, ctxLoading, activeSprint?.id, sprintLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <DashboardSkeleton />;
  if (loadError) return <EmptyDashboard reason="loading_failed" />;
  if (projects.length === 0) return <EmptyDashboard reason="no_project" />;
  if (!isKanbanMode && (!activeSprint || activeSprint.status === 'planning')) {
    return <EmptyDashboard reason="no_sprint" sprintTerm={sprintTerm} />;
  }

  const displaySprint = activeSprint ?? { id: '', name: 'Board', project_id: activeProject?.id ?? '', status: 'active' as const, created_at: '', updated_at: '' };
  const sprintMemberStats = buildSprintMemberStats(sprintTickets, apiTeamMembers);
  const teamMembers = apiTeamMembers.map((m, i) => memberToDisplay(m, i, sprintMemberStats.get(m.id)));

  const accuracyPct = apiAccuracy?.current_accuracy ?? 0;
  const accuracyDelta = apiAccuracy ? apiAccuracy.current_accuracy - apiAccuracy.previous_accuracy : 0;
  const progress = computeSprintProgress(displaySprint);
  const progressPct = progress.totalDays > 0 ? progress.progressPct : 0;

  const avgVelocity = apiAnalytics?.avg_velocity ?? 0;
  const velocityTrend = apiAnalytics?.velocity_trend ?? '';
  const velocityTrendUp = velocityTrend === 'up' ? true : velocityTrend === 'down' ? false : null;
  const vData = apiAnalytics?.velocity_data ?? [];
  const lastVel = vData[vData.length - 1]?.actual ?? 0;
  const prevVel = vData[vData.length - 2]?.actual ?? lastVel;
  const velocityPctChange = prevVel > 0 ? Math.round(((lastVel - prevVel) / prevVel) * 100) : 0;

  const totalAssigned = sprintTickets.reduce((sum, t) => sum + (t.human_points ?? t.ai_points ?? 0), 0);
  const totalCapacity = displaySprint?.planned_points ?? 0;
  const capacityPct = totalCapacity > 0 ? Math.min(100, Math.round((totalAssigned / totalCapacity) * 100)) : 0;
  const capacityHealth = capacityPct > 95 ? 'Over-allocated' : capacityPct > 80 ? 'High' : 'Healthy';
  const unallocatedCount = sprintTickets.filter(t => {
    const pts = t.human_points ?? t.ai_points;
    return pts == null || pts === 0;
  }).length;

  const ticketsWithPoints = sprintTickets.filter(t => {
    const pts = t.human_points ?? t.ai_points;
    return pts != null && pts > 0;
  }).length;
  const hasPointsTradition = sprintTickets.length === 0 || ticketsWithPoints >= Math.ceil(sprintTickets.length * 0.2);

  const sectionContent: Record<string, React.ReactNode> = {
    'plan-sprint': <PlanNewSprintCard />,
    'suggested-for-you': (
      <SuggestedForYouCard
        sprintTickets={sprintTickets}
        teamMembers={teamMembers}
        accuracyDelta={accuracyDelta}
        capacityPct={capacityPct}
        progressPct={progressPct}
        activeSprint={displaySprint}
        projectId={activeProject?.id ?? null}
        unallocatedCount={unallocatedCount}
        hasPointsTradition={hasPointsTradition}
      />
    ),
    'sprint-hero': (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="lg:col-span-3">
          <SprintRecapCard
            activeSprint={displaySprint}
            sprintTickets={sprintTickets}
            progress={progress}
            sprintTerm={isKanbanMode ? 'Board' : sprintTerm}
            hasPointsTradition={hasPointsTradition}
            getStatusLabel={getStatusLabel}
          />
        </div>
        <div className="lg:col-span-2">
          <AIIntelligenceCard
            progressPct={progressPct}
            capacityPct={capacityPct}
            accuracyDelta={accuracyDelta}
            apiAnalytics={apiAnalytics}
            teamMembers={teamMembers}
            sprintTickets={sprintTickets}
          />
        </div>
      </div>
    ),
    'metric-cards': (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          icon={TrendingUp}
          label={hasPointsTradition ? `${sprintTerm} Velocity` : `${sprintTerm} Throughput`}
          value={hasPointsTradition
            ? `${(Number.isFinite(avgVelocity) ? avgVelocity : 0).toFixed(0)} pts`
            : `${(Number.isFinite(apiAnalytics?.avg_throughput) ? Number(apiAnalytics?.avg_throughput) : 0).toFixed(0)} tickets`}
          trendUp={hasPointsTradition ? (velocityPctChange !== 0 ? velocityPctChange > 0 : velocityTrendUp) : null}
          trendValue={hasPointsTradition
            ? (velocityPctChange !== 0 ? `${velocityPctChange > 0 ? '+' : ''}${velocityPctChange}%` : (velocityTrend === 'up' ? 'Up' : velocityTrend === 'down' ? 'Down' : undefined))
            : undefined}
          trendLabel={hasPointsTradition ? 'Average across sprints' : 'Tickets delivered per sprint'}
          footerLinkText="Report"
          delay={0.2}
        />
        <MetricCard
          icon={Target}
          label={`${sprintTerm} Accuracy`}
          value={`${accuracyPct}%`}
          trendUp={accuracyDelta >= 0}
          trendValue={`${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta}%`}
          trendLabel="vs previous sprint"
          footerLinkText="Accuracy"
          delay={0.25}
        />
        <MetricCard
          icon={Users}
          label="Team Capacity"
          value={hasPointsTradition || totalCapacity > 0 ? `${capacityPct}%` : '—'}
          trendUp={capacityPct <= 95}
          trendValue={capacityHealth}
          trendLabel={
            hasPointsTradition && totalCapacity > 0
              ? `${totalAssigned} / ${totalCapacity} pts allocated`
              : totalAssigned > 0
                ? `${totalAssigned} pts allocated`
                : 'Ticket-based load'
          }
          footerWarning={
            hasPointsTradition && unallocatedCount > 0
              ? `${unallocatedCount} ticket${unallocatedCount !== 1 ? 's' : ''} have 0 pts allocated`
              : undefined
          }
          footerLinkText="Team"
          delay={0.3}
        />
      </div>
    ),
    'sprint-insights': activeProject?.id ? (
      <SprintInsightsPanel projectId={activeProject.id} />
    ) : null,
    'activity-velocity': (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <TicketActivityList sprintTickets={sprintTickets} teamMembers={apiTeamMembers} getStatusLabel={getStatusLabel} />
        <VelocityChart apiAnalytics={apiAnalytics} />
      </div>
    ),
    'team-workload': teamMembers.length > 0 ? <TeamWorkloadCard teamMembers={teamMembers} /> : null,
    'milestones': (
      <StreakBadgesCard
        sprintsPlanned={apiAnalytics?.velocity_data?.length}
        ticketsCompleted={sprintTickets.filter(t => t.status === 'done').length}
        accuracyPct={apiAccuracy?.current_accuracy}
      />
    ),
    'quick-actions': <QuickActionsStrip />,
  };

  return (
    <div className="dashboard-scope pb-12 space-y-4 sm:space-y-5">
      <UsageBanner />

      <TrialSetupChecklist />

      <TipBanner {...TIPS.dashboardReorder} />
      <TipBanner {...TIPS.dashboardCustomize} />

      <DashboardBanner
        activeSprint={displaySprint}
        activeProject={activeProject}
        projects={projects}
        teamMemberCount={apiTeamMembers.length}
        sprintTickets={sprintTickets}
        sprintTerm={isKanbanMode ? 'Board' : sprintTerm}
      />

      {/* Section visibility settings — compact inline row */}
      <div className="flex items-center justify-between gap-3 -mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em] pl-6">
          {sectionOrder.filter(id => !isHidden(id) && sectionContent[id] != null).length} section{sectionOrder.filter(id => !isHidden(id) && sectionContent[id] != null).length !== 1 ? 's' : ''}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowSectionSettings(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-border bg-background/50 hover:bg-secondary/50 transition-all"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Customize
            {hiddenSections.size > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold">
                {hiddenSections.size} hidden
              </span>
            )}
          </button>

          {showSectionSettings && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSectionSettings(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-xl bg-card border border-border shadow-lg shadow-black/10 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  Show / Hide Sections
                </p>
                {DEFAULT_SECTION_ORDER.map(sectionId => (
                  <button
                    key={sectionId}
                    onClick={() => toggleSection(sectionId)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-xs hover:bg-secondary/60 transition-colors"
                  >
                    {isHidden(sectionId) ? (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                    <span className={isHidden(sectionId) ? 'text-muted-foreground/50 line-through' : 'text-foreground'}>
                      {SECTION_LABELS[sectionId] ?? sectionId}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <DndContext sensors={dashSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 sm:space-y-5 pl-6">
            {sectionOrder.map(id => {
              if (isHidden(id)) return null;
              const content = sectionContent[id];
              if (content === null || content === undefined) return null;
              return (
                <SortableDashboardSection key={id} id={id} onToggleVisibility={toggleSection}>
                  {content}
                </SortableDashboardSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
