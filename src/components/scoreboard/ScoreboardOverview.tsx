'use client';

import { Trophy, Target, ClipboardList, ChevronRight } from 'lucide-react';
import type { PerformerStats } from './LeaderboardCard';
import type { LineUpMember } from './SprintLineUp';

const TILES = [
  { id: 'leaderboard', title: 'Top Performers', desc: 'Accuracy and delivery leaderboard', icon: Trophy, targetTab: 'leaderboard' as const, theme: 'amber' },
  { id: 'lineup', title: 'Sprint Formation', desc: 'Team capacity and ticket allocation', icon: Target, targetTab: 'lineup' as const, theme: 'emerald' },
  { id: 'strategy', title: 'Sprint Strategy', desc: 'Tactical lineup and load balance', icon: ClipboardList, targetTab: 'lineup' as const, theme: 'violet' },
  { id: 'gamified', title: 'Gamified Podium', desc: 'Celebrate top performers', icon: Trophy, targetTab: 'gamified' as const, theme: 'primary' },
];

const THEME_CLASSES: Record<string, string> = {
  amber: 'from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-700/30',
  emerald: 'from-emerald-100 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30',
  violet: 'from-violet-100 to-violet-50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200/50 dark:border-violet-700/30',
  primary: 'from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/30 dark:border-primary/50',
};

interface ScoreboardOverviewProps {
  sprintName?: string;
  sprintStart?: string;
  sprintEnd?: string;
  totalTickets: number;
  totalPoints: number;
  performers: PerformerStats[];
  lineUpMembers: LineUpMember[];
  onTabSelect?: (tab: 'leaderboard' | 'gamified' | 'lineup') => void;
}

export function ScoreboardOverview({
  sprintName,
  sprintStart,
  sprintEnd,
  totalTickets,
  totalPoints,
  performers,
  lineUpMembers,
  onTabSelect,
}: ScoreboardOverviewProps) {
  const topPerformers = performers.slice(0, 3);
  const avgLoad = lineUpMembers.length > 0
    ? Math.round(lineUpMembers.reduce((s, m) => s + m.load, 0) / lineUpMembers.length)
    : 0;
  const withAssignments = lineUpMembers.filter((m) => m.ticketCount > 0 || m.points > 0);

  const formatDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sprint summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sprint</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{sprintName || 'Current Sprint'}</p>
          {(sprintStart || sprintEnd) && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(sprintStart)} – {formatDate(sprintEnd)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tickets</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{totalTickets}</p>
          <p className="text-xs text-muted-foreground">in sprint</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Points</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">planned</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Load</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{avgLoad}%</p>
          <p className="text-xs text-muted-foreground">{withAssignments.length} members assigned</p>
        </div>
      </div>

      {/* Top performers preview */}
      {topPerformers.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Performers
          </h3>
          <div className="flex flex-wrap gap-3">
            {topPerformers.map((p, i) => (
              <div
                key={p.assigneeId}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40"
              >
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.accuracyPct}% accuracy · {p.delivered} delivered
                </span>
              </div>
            ))}
          </div>
          {onTabSelect && (
            <button
              onClick={() => onTabSelect('leaderboard')}
              className="mt-3 text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View full leaderboard
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Navigation tiles */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Explore</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            const themeClass = THEME_CLASSES[tile.theme] ?? THEME_CLASSES.primary;
            return (
              <button
                key={tile.id}
                onClick={() => onTabSelect?.(tile.targetTab)}
                className={`
                  flex flex-col rounded-2xl border p-4 min-h-[100px] text-left
                  bg-gradient-to-br ${themeClass}
                  hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer
                `}
              >
                <Icon className="w-8 h-8 text-foreground/70 mb-2" />
                <h4 className="font-semibold text-foreground text-sm">{tile.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{tile.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
