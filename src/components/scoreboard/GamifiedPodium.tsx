'use client';

import { Trophy, Medal, Award, Star } from 'lucide-react';
import type { PerformerStats } from './LeaderboardCard';

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

function getBadges(performer: PerformerStats): string[] {
  const badges: string[] = [];
  if (performer.accuracyPct >= 90) badges.push('Consistent Deliverer');
  if (performer.delivered >= 5 && performer.delivered === performer.totalTickets) badges.push('Perfect Sprint');
  if (performer.delivered >= 3) badges.push('Top Scorer');
  if (performer.avgVariance <= -0.5 && performer.accuracyPct >= 80) badges.push('Under-promiser');
  return badges;
}

interface GamifiedPodiumProps {
  performers: PerformerStats[];
}

export function GamifiedPodium({ performers }: GamifiedPodiumProps) {
  const top3 = performers.slice(0, 3);
  const [second, first, third] = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : [top3[1], top3[0], null].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-center gap-4 sm:gap-6 min-h-[200px]">
        {second && (
          <div className="flex flex-col items-center gap-2 order-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br ${AVATAR_GRADIENTS[second.colorIndex % AVATAR_GRADIENTS.length]} shadow-lg`}>
              {second.initials}
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center bg-slate-200/80 dark:bg-slate-600/40 border-2 border-slate-300 dark:border-slate-500">
              <Medal className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-foreground truncate max-w-[100px] text-center">{second.name}</p>
            <p className="text-xs text-muted-foreground">2nd</p>
          </div>
        )}
        {first && (
          <div className="flex flex-col items-center gap-2 order-2 -mb-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br ${AVATAR_GRADIENTS[first.colorIndex % AVATAR_GRADIENTS.length]} shadow-xl ring-2 ring-amber-400/50`}>
              {first.initials}
            </div>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-500 shadow-lg">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-sm font-bold text-foreground truncate max-w-[120px] text-center">{first.name}</p>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-500">1st</p>
          </div>
        )}
        {third && (
          <div className="flex flex-col items-center gap-2 order-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br ${AVATAR_GRADIENTS[third.colorIndex % AVATAR_GRADIENTS.length]} shadow-lg`}>
              {third.initials}
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center bg-amber-200/80 dark:bg-amber-800/40 border-2 border-amber-400 dark:border-amber-600">
              <Award className="w-8 h-8 text-amber-700 dark:text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground truncate max-w-[100px] text-center">{third.name}</p>
            <p className="text-xs text-muted-foreground">3rd</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {performers.slice(0, 6).map((p) => {
          const badges = getBadges(p);
          return (
            <div key={p.assigneeId} className="p-4 rounded-2xl bg-card border border-border/40 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${AVATAR_GRADIENTS[p.colorIndex % AVATAR_GRADIENTS.length]}`}>
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.accuracyPct}% accuracy · {p.delivered} delivered</p>
                </div>
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {badges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/15">
                      <Star className="w-2.5 h-2.5" />
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
