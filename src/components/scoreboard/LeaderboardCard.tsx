'use client';

import { Trophy, Award, Medal } from 'lucide-react';

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

export interface PerformerStats {
  assigneeId: string;
  name: string;
  initials: string;
  rank: number;
  accuracyPct: number;
  delivered: number;
  totalTickets: number;
  avgVariance: number;
  baseVelocity?: number;
  colorIndex: number;
}

interface LeaderboardCardProps {
  performer: PerformerStats;
}

export function LeaderboardCard({ performer }: LeaderboardCardProps) {
  const { rank, name, initials, accuracyPct, delivered, totalTickets, avgVariance, colorIndex } = performer;
  const gradient = AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length];

  const RankIcon = rank === 1 ? Trophy : rank === 2 ? Medal : rank === 3 ? Award : null;
  const rankBg = rank === 1 ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' : rank === 2 ? 'bg-slate-300/20 text-slate-600 dark:text-slate-400' : rank === 3 ? 'bg-amber-700/20 text-amber-700 dark:text-amber-600' : 'bg-muted/60 text-muted-foreground';

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200">
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rankBg} font-bold text-base`}>
          {RankIcon ? <RankIcon className="w-5 h-5" /> : rank}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${gradient} shadow-sm`}>
          {initials}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate">{name}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-[12px] text-muted-foreground">
          <span><strong className="text-foreground tabular-nums">{accuracyPct}%</strong> accuracy</span>
          <span><strong className="text-foreground tabular-nums">{delivered}</strong>/{totalTickets} delivered</span>
          {avgVariance !== 0 && (
            <span className={avgVariance > 0 ? 'text-destructive' : 'text-success'}>
              avg {avgVariance > 0 ? '+' : ''}{avgVariance.toFixed(1)} pts
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
          {accuracyPct}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">score</p>
      </div>
    </div>
  );
}
