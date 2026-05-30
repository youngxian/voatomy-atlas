'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Users,
  MessageSquare,
  TrendingUp,
  Bell,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Plus,
  X,
  RefreshCw,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { ActivityChartCard } from '@/components/ui/activity-chart-card';
import { Reveal } from '@/components/Reveal';
import { useProject } from '@/lib/project-context';
import * as atlas from '@/lib/api';

interface UserStatDisplay {
  user_id: string;
  name: string;
  color: string;
  stats: atlas.CommentActivityStats;
}

function buildUserStatsDisplay(
  members: atlas.TeamMember[],
  teamStats: atlas.CommentActivityStats[],
): UserStatDisplay[] {
  const statsMap = new Map<string, atlas.CommentActivityStats>();
  for (const s of teamStats) {
    statsMap.set(s.user_id, s);
  }
  return members
    .map((m) => {
      const userId = m.user_id ?? m.id;
      const stats = statsMap.get(userId);
      if (!stats) return null;
      return { user_id: userId, name: m.name, color: m.avatar_color, stats };
    })
    .filter((v): v is UserStatDisplay => v !== null);
}

function buildNameMap(members: atlas.TeamMember[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of members) {
    if (m.user_id) map.set(m.user_id, m.name);
    map.set(m.id, m.name);
  }
  return map;
}

function buildColorMap(members: atlas.TeamMember[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of members) {
    if (m.user_id) map.set(m.user_id, m.avatar_color);
    map.set(m.id, m.avatar_color);
  }
  return map;
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function severityColor(days: number): 'danger' | 'warning' | 'info' {
  if (days >= 5) return 'danger';
  if (days >= 3) return 'warning';
  return 'info';
}

type ChartRange = 'Weekly' | 'Monthly' | 'Yearly';

function buildStaleAgeChart(
  tickets: atlas.StaleTicket[],
  range: ChartRange = 'Weekly',
): { day: string; value: number }[] {
  if (tickets.length === 0) return [];

  const maxDays = Math.max(...tickets.map((t) => t.days_since_update), 0);
  let bucketSize: number;
  let formatLabel: (start: number) => string;

  switch (range) {
    case 'Monthly':
      bucketSize = 30;
      formatLabel = (s) => (s === 0 ? '<30d' : `${s}d`);
      break;
    case 'Yearly':
      bucketSize = 90;
      formatLabel = (s) => (s === 0 ? '<90d' : `${s}d`);
      break;
    default:
      bucketSize = 7;
      formatLabel = (s) => (s === 0 ? '<7d' : `${s}d`);
      break;
  }

  const bucketCount = Math.ceil((maxDays + 1) / bucketSize);
  const counts = new Array<number>(bucketCount).fill(0);

  for (const t of tickets) {
    const idx = Math.min(Math.floor(t.days_since_update / bucketSize), bucketCount - 1);
    counts[idx]++;
  }

  return counts.map((value, i) => ({
    day: formatLabel(i * bucketSize),
    value,
  }));
}

type Tab = 'overview' | 'stale' | 'reminders' | 'users';

export default function ActivityPage() {
  const { activeProjectId, activeSprint: ctxSprint, setActiveSprint } = useProject();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');

  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(undefined);
  const [chartRange, setChartRange] = useState<ChartRange>('Weekly');
  const [reminderFilter, setReminderFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [closingReminderId, setClosingReminderId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const sprintsQuery = useQuery({
    queryKey: ['sprints', activeProjectId],
    queryFn: async () => {
      const allSprints = await atlas.getSprints(activeProjectId!);
      return { sprints: allSprints ?? [], currentId: ctxSprint?.id };
    },
    enabled: !!activeProjectId,
    staleTime: 5 * 60 * 1000,
  });

  const sprints = sprintsQuery.data?.sprints ?? [];

  // Sync local sprint selection when context sprint changes (e.g. from nav bar)
  useEffect(() => {
    setSelectedSprintId(ctxSprint?.id);
  }, [ctxSprint?.id]);

  const handleSprintChange = useCallback(
    async (sprintId: string) => {
      if (sprintId) {
        setSelectedSprintId(sprintId);
        try {
          const detail = await atlas.getSprint(activeProjectId!, sprintId);
          setActiveSprint(detail);
        } catch {
          // keep local selection on API error
        }
      } else {
        setSelectedSprintId(undefined);
        // "All Sprints" - don't update global context
      }
    },
    [activeProjectId, setActiveSprint]
  );
  const resolvedSprintId = selectedSprintId ?? ctxSprint?.id ?? sprintsQuery.data?.currentId;

  const activityKey = ['activity', activeProjectId, resolvedSprintId] as const;

  const activityQuery = useQuery({
    queryKey: activityKey,
    queryFn: async () => {
      const [statsRes, staleRes, remindersRes, membersRes, teamStatsRes] = await Promise.all([
        atlas.getActivityStats(activeProjectId!, resolvedSprintId),
        atlas.getStaleTickets(activeProjectId!, resolvedSprintId),
        atlas.getReminders(activeProjectId!),
        atlas.getTeamMembers(activeProjectId!),
        atlas.getTeamActivityStats(activeProjectId!, resolvedSprintId),
      ]);

      const members = Array.isArray(membersRes) ? membersRes : [];
      const staleList = Array.isArray(staleRes) ? staleRes : [];
      const reminderList = Array.isArray(remindersRes) ? remindersRes : [];
      const teamStats = Array.isArray(teamStatsRes) ? teamStatsRes : [];

      const names = buildNameMap(members);
      const colors = buildColorMap(members);

      const mapped = staleList.map((r) =>
        atlas.mapStaleTicketResponse(r, names.get(r.ticket.assignee_id ?? '')),
      );

      return {
        stats: statsRes,
        staleTickets: mapped,
        reminders: reminderList,
        userStats: buildUserStatsDisplay(members, teamStats),
        nameMap: names,
        colorMap: colors,
      };
    },
    enabled: !!activeProjectId,
    staleTime: 2 * 60 * 1000,
  });

  const stats = activityQuery.data?.stats ?? null;
  const staleTickets = activityQuery.data?.staleTickets ?? [];
  const reminders = activityQuery.data?.reminders ?? [];
  const userStats = activityQuery.data?.userStats ?? [];
  const nameMap = activityQuery.data?.nameMap ?? new Map<string, string>();
  const colorMap = activityQuery.data?.colorMap ?? new Map<string, string>();
  const loading = activityQuery.isLoading;
  const error = activityQuery.error?.message ?? mutationError;
  const hasNoActiveTickets = stats !== null && stats.total_in_progress === 0;

  const handleRefresh = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: activityKey });
  }, [queryClient, activityKey]);

  const handleCloseReminder = useCallback(
    async (reminderId: string) => {
      if (!activeProjectId) return;
      setClosingReminderId(reminderId);
      setMutationError(null);
      try {
        await atlas.closeReminder(activeProjectId, reminderId);
        queryClient.invalidateQueries({ queryKey: activityKey });
      } catch {
        setMutationError('Failed to close reminder');
      } finally {
        setClosingReminderId(null);
      }
    },
    [activeProjectId, queryClient, activityKey],
  );

  const handleCreateReminder = useCallback(
    async (assigneeId: string, staleTicketIds: string[]) => {
      if (!activeProjectId) return;
      setCreatingReminder(true);
      setMutationError(null);
      try {
        await atlas.createReminder(activeProjectId, {
          assignee_id: assigneeId,
          stale_ticket_ids: staleTicketIds,
        });
        setShowReminderDialog(false);
        queryClient.invalidateQueries({ queryKey: activityKey });
      } catch {
        setMutationError('Failed to create reminder');
      } finally {
        setCreatingReminder(false);
      }
    },
    [activeProjectId, queryClient, activityKey],
  );

  const filteredReminders = useMemo(() => {
    if (reminderFilter === 'all') return reminders;
    return reminders.filter((r) => r.status === reminderFilter);
  }, [reminders, reminderFilter]);

  const usersWithStaleCount = stats?.users_with_stale?.length ?? 0;
  const avgFrequency = stats?.avg_comment_frequency_days ?? 0;

  const assigneesForReminder = useMemo(() => {
    const openReminderAssignees = new Set(
      reminders.filter((r) => r.status === 'open').map((r) => r.assignee_id),
    );
    const groups = new Map<string, string[]>();
    for (const t of staleTickets) {
      if (!t.assignee_id || openReminderAssignees.has(t.assignee_id)) continue;
      const ids = groups.get(t.assignee_id) ?? [];
      ids.push(t.ticket_id);
      groups.set(t.assignee_id, ids);
    }
    return Array.from(groups.entries()).map(([assigneeId, ticketIds]) => ({
      assigneeId,
      name: nameMap.get(assigneeId) ?? 'Unknown',
      color: colorMap.get(assigneeId) ?? 'var(--muted-foreground)',
      ticketIds,
    }));
  }, [staleTickets, reminders, nameMap, colorMap]);

  const chartData = useMemo(() => buildStaleAgeChart(staleTickets, chartRange), [staleTickets, chartRange]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'stale', label: 'Stale Tickets', icon: AlertTriangle },
    { key: 'reminders', label: 'Reminders', icon: Bell },
    { key: 'users', label: 'Team Activity', icon: Users },
  ];

  if (!activeProjectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a project to view activity.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading activity data...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive font-medium mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (hasNoActiveTickets && staleTickets.length === 0 && reminders.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
                <Activity className="w-6 h-6 text-primary" />
                Activity Tracker
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor comment activity, detect stale tickets, and manage reminders.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedSprintId ?? sprintsQuery.data?.currentId ?? ''}
                  onChange={(e) => handleSprintChange(e.target.value)}
                  disabled={sprintsQuery.isLoading}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 cursor-pointer"
                >
                  <option value="">All Sprints</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={activityQuery.isFetching}>
                <RefreshCw className={`w-3.5 h-3.5 ${activityQuery.isFetching ? 'animate-spin' : ''}`} />
                {activityQuery.isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <Card className="p-8 max-w-lg mx-auto mt-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">No active tickets to track</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Activity tracking monitors tickets in <span className="font-medium text-foreground">In Progress</span> or{' '}
                <span className="font-medium text-foreground">In Review</span> status.
                This project currently has no tickets in those statuses.
              </p>
              <p className="text-xs text-muted-foreground">
                Move tickets to &ldquo;In Progress&rdquo; on your board, then sync to see activity data here.
              </p>
            </div>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}>
              <Activity className="w-6 h-6 text-primary" />
              Activity Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor comment activity, detect stale tickets, and manage reminders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedSprintId ?? sprintsQuery.data?.currentId ?? ''}
                onChange={(e) => handleSprintChange(e.target.value)}
                disabled={sprintsQuery.isLoading}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 cursor-pointer"
              >
                <option value="">All Sprints</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={activityQuery.isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 ${activityQuery.isFetching ? 'animate-spin' : ''}`} />
              {activityQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowReminderDialog(true)}
              disabled={assigneesForReminder.length === 0}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Reminder
            </Button>
          </div>
        </div>
      </Reveal>

      {mutationError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {mutationError}
          <button onClick={() => setMutationError(null)} className="ml-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Create Reminder Dialog */}
      {showReminderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl border border-border shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Create Reminder</h3>
              <button onClick={() => setShowReminderDialog(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            {assigneesForReminder.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                All assignees with stale tickets already have open reminders.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Select a team member to remind about their stale tickets:
                </p>
                {assigneesForReminder.map((a) => (
                  <button
                    key={a.assigneeId}
                    onClick={() => handleCreateReminder(a.assigneeId, a.ticketIds)}
                    disabled={creatingReminder}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: a.color }}
                    >
                      {a.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.ticketIds.length} stale ticket(s)
                      </p>
                    </div>
                    {creatingReminder && (
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bento-card rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.total_in_progress ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-secondary-foreground mt-2">
              Active tickets being worked on
            </p>
          </Card>
          <Card className="bento-card rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Stale Tickets</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  {stats?.stale_count ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <p className="text-[10px] text-secondary-foreground mt-2">No comments in 2+ days</p>
          </Card>
          <Card className="bento-card rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Users Affected</p>
                <p className="text-2xl font-bold text-foreground mt-1">{usersWithStaleCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="text-[10px] text-secondary-foreground mt-2">
              Team members with stale tickets
            </p>
          </Card>
          <Card className="bento-card rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Frequency</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {avgFrequency.toFixed(1)}d
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-secondary-foreground mt-2">
              Average days between comments
            </p>
          </Card>
        </div>
      </Reveal>

      {/* Tab bar */}
      <Reveal delay={0.1}>
        <div
          className="flex gap-1 mb-6 bg-secondary/40 rounded-xl border border-border/40 p-1 w-fit"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Tab content */}
      {tab === 'overview' && (
        <Reveal delay={0.15}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Stale tickets summary */}
            <Card className="bento-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Stale Tickets by Severity
                </h3>
                <button
                  onClick={() => setTab('stale')}
                  className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {(() => {
                  const total = staleTickets.length || 1;
                  return [
                    {
                      label: 'Critical (5+ days)',
                      count: staleTickets.filter((t) => t.days_since_update >= 5).length,
                      color: 'var(--destructive)',
                    },
                    {
                      label: 'Warning (3-4 days)',
                      count: staleTickets.filter(
                        (t) => t.days_since_update >= 3 && t.days_since_update < 5,
                      ).length,
                      color: 'var(--warning)',
                    },
                    {
                      label: 'Info (2 days)',
                      count: staleTickets.filter((t) => t.days_since_update < 3).length,
                      color: 'var(--success)',
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-secondary-foreground font-medium">{row.label}</span>
                        <span className="font-bold" style={{ color: row.color }}>
                          {row.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round((row.count / total) * 100)}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Card>

            {/* Team activity heatmap */}
            <Card className="bento-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Team Activity
                </h3>
                <button
                  onClick={() => setTab('users')}
                  className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {userStats.map((u) => (
                  <div key={u.user_id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {u.stats.stale_ticket_count} stale
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: u.stats.owned_in_progress_count }).map((_, i) => (
                          <div
                            key={i}
                            className="h-2 rounded-sm flex-1 max-w-[20px]"
                            style={{
                              backgroundColor:
                                i <
                                u.stats.owned_in_progress_count - u.stats.stale_ticket_count
                                  ? 'var(--success)'
                                  : 'var(--destructive)',
                              opacity: 0.7 + i * 0.03,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {userStats.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No team activity data available.
                  </p>
                )}
              </div>
              {userStats.length > 0 && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/60">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Active
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Stale
                  </span>
                </div>
              )}
            </Card>

            {/* Activity Chart */}
            {chartData.length > 0 && (
              <ActivityChartCard
                title="Stale Ticket Age Distribution"
                totalValue={`${staleTickets.length}`}
                trendLabel={`${staleTickets.length} stale ticket(s)`}
                data={chartData}
                className="max-w-none"
                onRangeChange={(r) => setChartRange(r as ChartRange)}
              />
            )}

            {/* Recent reminders */}
            <Card className="bento-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-warning" />
                  Recent Reminders
                </h3>
                <button
                  onClick={() => setTab('reminders')}
                  className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-secondary-foreground text-left border-b border-border/60">
                      <th className="pb-2 font-medium">Assignee</th>
                      <th className="pb-2 font-medium">Stale Tickets</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {reminders.slice(0, 3).map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/50">
                        <td className="py-2.5 font-medium text-foreground">
                          {nameMap.get(r.assignee_id) ?? r.assignee_id}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {r.stale_ticket_ids.length} tickets
                        </td>
                        <td className="py-2.5">
                          <Badge variant={r.status === 'open' ? 'warning' : 'success'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatRelative(r.created_at)}
                        </td>
                      </tr>
                    ))}
                    {reminders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No reminders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Reveal>
      )}

      {tab === 'stale' && (
        <Reveal delay={0.15}>
          <Card className="bento-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Stale In-Progress Tickets ({staleTickets.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-secondary-foreground text-left border-b border-border/60">
                    <th className="pb-2 font-medium">Ticket</th>
                    <th className="pb-2 font-medium">Assignee</th>
                    <th className="pb-2 font-medium">Last Comment</th>
                    <th className="pb-2 font-medium">Days Stale</th>
                    <th className="pb-2 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {staleTickets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-secondary/50">
                      <td className="py-3">
                        <div>
                          <span className="font-medium text-foreground">{t.ticket_title}</span>
                          <div className="text-[10px] text-secondary-foreground mt-0.5">
                            {t.external_id}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-secondary-foreground font-medium">
                        {t.assignee_name ?? 'Unassigned'}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatRelative(t.last_comment_at)}
                      </td>
                      <td
                        className="py-3 font-bold"
                        style={{
                          color:
                            t.days_since_update >= 5
                              ? 'var(--destructive)'
                              : t.days_since_update >= 3
                                ? 'var(--warning)'
                                : 'var(--success)',
                        }}
                      >
                        {t.days_since_update}d
                      </td>
                      <td className="py-3">
                        <Badge variant={severityColor(t.days_since_update)}>
                          {t.days_since_update >= 5
                            ? 'Critical'
                            : t.days_since_update >= 3
                              ? 'Warning'
                              : 'Info'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {staleTickets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No stale tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}

      {tab === 'reminders' && (
        <Reveal delay={0.15}>
          <Card className="bento-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Reminder Tickets</h3>
              <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                {(['all', 'open', 'closed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setReminderFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      reminderFilter === f
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-secondary-foreground'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredReminders.map((r) => {
                const userName = nameMap.get(r.assignee_id);
                const userColor = colorMap.get(r.assignee_id);
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: userColor ?? 'var(--muted-foreground)' }}
                    >
                      {userName
                        ? userName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                        : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {userName ?? 'Unknown'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {r.stale_ticket_ids.length} stale ticket(s) to update
                      </p>
                    </div>
                    <Badge variant={r.status === 'open' ? 'warning' : 'success'}>
                      {r.status}
                    </Badge>
                    <span className="text-[10px] text-secondary-foreground shrink-0">
                      {formatRelative(r.created_at)}
                    </span>
                    {r.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloseReminder(r.id)}
                        disabled={closingReminderId === r.id}
                      >
                        {closingReminderId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Close
                      </Button>
                    )}
                  </div>
                );
              })}
              {filteredReminders.length === 0 && (
                <div className="text-center py-8 text-xs text-secondary-foreground">
                  No reminders found.
                </div>
              )}
            </div>
          </Card>
        </Reveal>
      )}

      {tab === 'users' && (
        <Reveal delay={0.15}>
          <div className="grid md:grid-cols-2 gap-4">
            {userStats.map((u) => (
              <Card key={u.user_id} className="bento-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Last comment: {formatRelative(u.stats.last_comment_at)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <p className="text-lg font-bold text-foreground">
                      {u.stats.owned_in_progress_count}
                    </p>
                    <p className="text-[10px] text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <p
                      className="text-lg font-bold"
                      style={{
                        color:
                          u.stats.stale_ticket_count > 0 ? 'var(--destructive)' : 'var(--success)',
                      }}
                    >
                      {u.stats.stale_ticket_count}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Stale</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <p className="text-lg font-bold text-foreground">
                      {u.stats.avg_days_between_comments}d
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg Freq</p>
                  </div>
                </div>
                {u.stats.stale_ticket_count > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {u.stats.stale_ticket_count} ticket(s) need attention
                    </p>
                  </div>
                )}
              </Card>
            ))}
            {userStats.length === 0 && (
              <div className="col-span-2 text-center py-12 text-sm text-muted-foreground">
                No team member activity data available.
              </div>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}
