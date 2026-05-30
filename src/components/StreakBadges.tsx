'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Rocket,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export interface BadgeDef {
  id: string;
  icon: typeof Award;
  label: string;
  description: string;
  threshold: number;
  metric: string;
  color: string;
  bgColor: string;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-sprint', icon: Rocket, label: 'First Sprint', description: 'Planned your first sprint', threshold: 1, metric: 'sprints_planned', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { id: 'sprint-5', icon: CalendarCheck, label: 'Sprint Veteran', description: 'Planned 5 sprints', threshold: 5, metric: 'sprints_planned', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-500/10' },
  { id: 'sprint-10', icon: Trophy, label: 'Sprint Master', description: 'Planned 10 sprints', threshold: 10, metric: 'sprints_planned', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  { id: 'tickets-10', icon: CheckCircle2, label: 'Closer', description: 'Completed 10 tickets', threshold: 10, metric: 'tickets_completed', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' },
  { id: 'tickets-50', icon: Zap, label: 'Ticket Machine', description: 'Completed 50 tickets', threshold: 50, metric: 'tickets_completed', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
  { id: 'tickets-100', icon: Star, label: 'Centurion', description: 'Completed 100 tickets', threshold: 100, metric: 'tickets_completed', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { id: 'accuracy-80', icon: Target, label: 'Sharp Estimator', description: 'Reached 80% accuracy', threshold: 80, metric: 'accuracy_pct', color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'accuracy-95', icon: Target, label: 'Precision Pro', description: 'Reached 95% accuracy', threshold: 95, metric: 'accuracy_pct', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { id: 'streak-3', icon: Flame, label: 'On Fire', description: '3-day activity streak', threshold: 3, metric: 'streak_days', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 'streak-7', icon: Flame, label: 'Week Warrior', description: '7-day activity streak', threshold: 7, metric: 'streak_days', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  { id: 'velocity-up', icon: TrendingUp, label: 'Velocity Boost', description: 'Velocity improved 3 sprints in a row', threshold: 3, metric: 'velocity_up_streak', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
];

// ---------------------------------------------------------------------------
// localStorage state
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'atlas_streak_badges';

interface BadgeState {
  unlockedIds: string[];
  metrics: Record<string, number>;
  lastActiveDate?: string;
  newlyUnlocked?: string[];
}

function loadBadgeState(): BadgeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { unlockedIds: [], metrics: {} };
}

function saveBadgeState(state: BadgeState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStreakBadges(currentMetrics?: { sprints_planned?: number; tickets_completed?: number; accuracy_pct?: number }) {
  const [state, setState] = useState<BadgeState>(loadBadgeState);

  const sprintsPlanned = currentMetrics?.sprints_planned;
  const ticketsCompleted = currentMetrics?.tickets_completed;
  const accuracyPct = currentMetrics?.accuracy_pct;

  const recordActivity = useCallback(() => {
    setState(prev => {
      const today = new Date().toISOString().slice(0, 10);
      if (prev.lastActiveDate === today) return prev;

      let streak = prev.metrics.streak_days ?? 0;
      if (prev.lastActiveDate) {
        const lastDate = new Date(prev.lastActiveDate);
        const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / 86400000);
        streak = diff === 1 ? streak + 1 : 1;
      } else {
        streak = 1;
      }

      const next = { ...prev, lastActiveDate: today, metrics: { ...prev.metrics, streak_days: streak } };
      saveBadgeState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    recordActivity();
  }, [recordActivity]);

  useEffect(() => {
    if (sprintsPlanned === undefined && ticketsCompleted === undefined && accuracyPct === undefined) return;
    const incoming: Record<string, number | undefined> = {
      sprints_planned: sprintsPlanned,
      tickets_completed: ticketsCompleted,
      accuracy_pct: accuracyPct,
    };

    setState(prev => {
      const merged = { ...prev.metrics };
      let changed = false;
      for (const [k, v] of Object.entries(incoming)) {
        if (v !== undefined && v > (merged[k] ?? 0)) {
          merged[k] = v;
          changed = true;
        }
      }

      const newlyUnlocked: string[] = [];
      const unlockedSet = new Set(prev.unlockedIds);
      for (const badge of BADGE_DEFS) {
        if (unlockedSet.has(badge.id)) continue;
        const metricVal = merged[badge.metric] ?? 0;
        if (metricVal >= badge.threshold) {
          unlockedSet.add(badge.id);
          newlyUnlocked.push(badge.id);
          changed = true;
        }
      }

      if (!changed) return prev;

      const next: BadgeState = {
        ...prev,
        metrics: merged,
        unlockedIds: [...unlockedSet],
        newlyUnlocked: newlyUnlocked.length > 0 ? newlyUnlocked : undefined,
      };
      saveBadgeState(next);
      return next;
    });
  }, [sprintsPlanned, ticketsCompleted, accuracyPct]);

  const unlockedBadges = useMemo(() =>
    BADGE_DEFS.filter(b => state.unlockedIds.includes(b.id)),
    [state.unlockedIds],
  );

  const lockedBadges = useMemo(() =>
    BADGE_DEFS.filter(b => !state.unlockedIds.includes(b.id)),
    [state.unlockedIds],
  );

  const clearNewlyUnlocked = useCallback(() => {
    setState(prev => {
      const next = { ...prev, newlyUnlocked: undefined };
      saveBadgeState(next);
      return next;
    });
  }, []);

  return {
    unlockedBadges,
    lockedBadges,
    allBadges: BADGE_DEFS,
    metrics: state.metrics,
    newlyUnlocked: state.newlyUnlocked ?? [],
    clearNewlyUnlocked,
    streakDays: state.metrics.streak_days ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Display components
// ---------------------------------------------------------------------------

export function BadgeIcon({ badge, unlocked = true, size = 'md' }: { badge: BadgeDef; unlocked?: boolean; size?: 'sm' | 'md' }) {
  const Icon = badge.icon;
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={clsx(
      dim,
      'rounded-xl flex items-center justify-center shrink-0 transition-all',
      unlocked ? badge.bgColor : 'bg-muted/60',
    )}>
      <Icon className={clsx(iconSize, unlocked ? badge.color : 'text-muted-foreground/30')} strokeWidth={1.75} />
    </div>
  );
}

export function StreakBadgesCard({
  sprintsPlanned,
  ticketsCompleted,
  accuracyPct,
}: {
  sprintsPlanned?: number;
  ticketsCompleted?: number;
  accuracyPct?: number;
}) {
  const { unlockedBadges, lockedBadges, streakDays, newlyUnlocked, clearNewlyUnlocked } = useStreakBadges({
    sprints_planned: sprintsPlanned,
    tickets_completed: ticketsCompleted,
    accuracy_pct: accuracyPct,
  });

  const [showToast, setShowToast] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      const badge = BADGE_DEFS.find(b => b.id === newlyUnlocked[0]);
      if (badge) {
        setShowToast(badge);
        const timer = setTimeout(() => { setShowToast(null); clearNewlyUnlocked(); }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [newlyUnlocked, clearNewlyUnlocked]);

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-card shadow-xl shadow-primary/10"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <BadgeIcon badge={showToast} size="sm" />
            <div>
              <p className="text-xs font-bold text-foreground">Badge Unlocked!</p>
              <p className="text-[11px] text-muted-foreground">{showToast.label} — {showToast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-border/30 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">Milestones</h3>
              <p className="text-[10px] text-muted-foreground/50 font-medium">
                {unlockedBadges.length} unlocked · {streakDays}d streak
              </p>
            </div>
          </div>
          {streakDays >= 3 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/15">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 tabular-nums">{streakDays}d</span>
            </div>
          )}
        </div>

        {unlockedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {unlockedBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/30 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                title={badge.description}
              >
                <BadgeIcon badge={badge} size="sm" />
                <span className="text-[11px] font-semibold text-foreground">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        )}

        {lockedBadges.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-2">
              Next milestones
            </p>
            <div className="flex flex-wrap gap-2">
              {lockedBadges.slice(0, 4).map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-dashed border-border/30 opacity-50"
                  title={badge.description}
                >
                  <BadgeIcon badge={badge} unlocked={false} size="sm" />
                  <span className="text-[11px] font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
