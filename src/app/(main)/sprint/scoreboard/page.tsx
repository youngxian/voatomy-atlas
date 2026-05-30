'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  LayoutList,
  LayoutGrid,
  Target,
  Users,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useProject } from '@/lib/project-context';
import { getTeamAccuracy, getTeamMembers, getSprintTicketsFull, type TeamMember, type Ticket } from '@/lib/api';
import { LeaderboardCard, type PerformerStats } from '@/components/scoreboard/LeaderboardCard';
import { GamifiedPodium } from '@/components/scoreboard/GamifiedPodium';
import { SprintLineUp, type LineUpMember } from '@/components/scoreboard/SprintLineUp';
import { ScoreboardOverview } from '@/components/scoreboard/ScoreboardOverview';

const AVATAR_GRADIENTS_LEN = 8;

function buildSprintMemberStats(tickets: Ticket[], members: TeamMember[]): Map<string, { ticketCount: number; totalPoints: number }> {
  const lookup = new Map<string, string>();
  for (const m of members) {
    lookup.set(m.id.toLowerCase(), m.id);
    lookup.set(m.id, m.id);
    if (m.user_id) {
      lookup.set(m.user_id.toLowerCase(), m.id);
      lookup.set(m.user_id, m.id);
    }
    if (m.email) lookup.set(m.email.toLowerCase().trim(), m.id);
  }
  const stats = new Map<string, { ticketCount: number; totalPoints: number }>();
  for (const t of tickets) {
    if (!t.assignee_id) continue;
    const normalized = t.assignee_id.toLowerCase().trim();
    const memberId = lookup.get(normalized) ?? lookup.get(t.assignee_id);
    if (!memberId) continue;
    const cur = stats.get(memberId) ?? { ticketCount: 0, totalPoints: 0 };
    cur.ticketCount++;
    cur.totalPoints += t.human_points ?? t.ai_points ?? 0;
    stats.set(memberId, cur);
  }
  return stats;
}

type TabId = 'overview' | 'leaderboard' | 'gamified' | 'lineup';

export default function ScoreboardPage() {
  const { activeProject, activeSprint } = useProject();
  const [tab, setTab] = useState<TabId>('overview');
  const [apiTeam, setApiTeam] = useState<{ members: { assignee_id: string; total_tickets: number; delivered: number; accuracy_pct: number; avg_variance: number }[] } | null>(null);
  const [apiMembers, setApiMembers] = useState<TeamMember[]>([]);
  const [sprintTickets, setSprintTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeProject?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const load = async () => {
      try {
        const [team, members, tickets] = await Promise.all([
          getTeamAccuracy(activeProject.id).catch(() => null),
          getTeamMembers(activeProject.id).catch(() => []),
          activeSprint ? getSprintTicketsFull(activeProject.id, activeSprint.id).catch(() => []) : Promise.resolve([]),
        ]);
        setApiTeam(team);
        setApiMembers(Array.isArray(members) ? members : []);
        setSprintTickets(Array.isArray(tickets) ? tickets : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeProject?.id, activeSprint?.id]);

  const memberLookup = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const t of apiMembers) {
      m.set(t.id.toLowerCase(), t);
      m.set(t.id, t);
      if (t.user_id) {
        m.set(t.user_id.toLowerCase(), t);
        m.set(t.user_id, t);
      }
    }
    return m;
  }, [apiMembers]);

  const performers: PerformerStats[] = useMemo(() => {
    const accMembers = apiTeam?.members ?? [];
    const merged: PerformerStats[] = [];
    let colorIdx = 0;
    for (const acc of accMembers) {
      const member = memberLookup.get(acc.assignee_id.toLowerCase()) ?? memberLookup.get(acc.assignee_id);
      const name = member?.name ?? acc.assignee_id.slice(0, 8);
      const initials = (member?.initials) ?? (name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?');
      merged.push({
        assigneeId: acc.assignee_id,
        name,
        initials,
        rank: 0,
        accuracyPct: Math.round(acc.accuracy_pct * 10) / 10,
        delivered: acc.delivered,
        totalTickets: acc.total_tickets,
        avgVariance: Math.round(acc.avg_variance * 10) / 10,
        baseVelocity: member?.base_velocity,
        colorIndex: colorIdx++ % AVATAR_GRADIENTS_LEN,
      });
    }
    const sorted = merged.sort((a, b) => {
      const scoreA = a.accuracyPct * a.delivered;
      const scoreB = b.accuracyPct * b.delivered;
      return scoreB - scoreA;
    });
    return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
  }, [apiTeam, memberLookup]);

  const sprintStats = useMemo(() => buildSprintMemberStats(sprintTickets, apiMembers), [sprintTickets, apiMembers]);

  const lineUpMembers: LineUpMember[] = useMemo(() => {
    const result: LineUpMember[] = [];
    let colorIdx = 0;
    for (const m of apiMembers) {
      const stats = sprintStats.get(m.id);
      const ticketCount = stats?.ticketCount ?? 0;
      const points = stats?.totalPoints ?? 0;
      const capacity = m.base_velocity > 0 ? m.base_velocity : 5;
      const load = points > 0 ? Math.min(100, Math.round((points / capacity) * 100)) : 0;
      result.push({
        id: m.id,
        name: m.name,
        initials: m.initials || m.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
        ticketCount,
        points,
        load,
        colorIndex: colorIdx++ % AVATAR_GRADIENTS_LEN,
      });
    }
    const withAssignments = result.filter((m) => m.ticketCount > 0 || m.points > 0);
    return withAssignments.length > 0 ? withAssignments : result;
  }, [apiMembers, sprintStats]);

  const tabs: { id: TabId; label: string; icon: typeof Trophy }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'leaderboard', label: 'Leaderboard', icon: LayoutList },
    { id: 'gamified', label: 'Gamified', icon: Trophy },
    { id: 'lineup', label: 'Line-Up', icon: Target },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading scoreboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-6">
        <p className="text-sm text-muted-foreground text-center">Failed to load scoreboard. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <Reveal>
      <div className="min-h-[calc(100vh-8rem)] bg-[#E8EDE8]/50 dark:bg-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                  Team Scoreboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeProject?.name ?? 'Project'} · {activeSprint?.name ?? 'Sprint'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-card border border-border/40 shadow-sm w-fit">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    tab === t.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'overview' && (
            <div className="rounded-2xl bg-card border border-border/40 p-6 shadow-sm">
              <ScoreboardOverview
                sprintName={activeSprint?.name}
                sprintStart={activeSprint?.start_date}
                sprintEnd={activeSprint?.end_date}
                totalTickets={sprintTickets.length}
                totalPoints={sprintTickets.reduce((s, t) => s + (t.human_points ?? t.ai_points ?? 0), 0)}
                performers={performers}
                lineUpMembers={lineUpMembers}
                onTabSelect={setTab}
              />
            </div>
          )}

          {tab === 'leaderboard' && (
            <div className="space-y-4">
              {performers.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border/40 p-12 text-center overflow-hidden">
                  <div className="inline-block mb-6" style={{ perspective: '600px' }}>
                    <div style={{ transform: 'rotateX(15deg) rotateY(-10deg)', transformStyle: 'preserve-3d' }}>
                      <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200/50 dark:border-amber-700/30 flex items-center justify-center shadow-lg">
                        <Trophy className="w-12 h-12 text-amber-500 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>
                  <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-2">No performance data yet.</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Complete sprints with assigned tickets to see the leaderboard.
                  </p>
                  <Link href="/sprint/plan" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Plan a sprint
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                performers.map((p) => (
                  <LeaderboardCard key={p.assigneeId} performer={p} />
                ))
              )}
            </div>
          )}

          {tab === 'gamified' && (
            <div className="rounded-2xl bg-card border border-border/40 p-6 shadow-sm">
              {performers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-block mb-6" style={{ perspective: '500px' }}>
                    <div style={{ transform: 'rotateX(12deg) rotateY(5deg)', transformStyle: 'preserve-3d' }}>
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-200/80 to-amber-300/60 dark:from-amber-800/40 dark:to-amber-700/30 border-2 border-amber-400/50 dark:border-amber-600/40 flex items-center justify-center shadow-xl">
                        <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-500" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">No performers to celebrate yet.</p>
                  <Link href="/sprint/plan" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Plan a sprint
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <GamifiedPodium performers={performers} />
              )}
            </div>
          )}

          {tab === 'lineup' && (
            <div className="rounded-2xl bg-card border border-border/40 p-6 shadow-sm">
              <SprintLineUp members={lineUpMembers} sprintName={activeSprint?.name} />
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
