'use client';

import { Flame, Calendar, Clock, Users } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { CompletionRing } from './CompletionRing';
import type { SprintTicket } from '@/lib/burndown-mock';

interface BurndownHeaderProps {
  sprintName: string;
  completionPct: number;
  activeCompletedPoints: number;
  activeTotalPoints: number;
  activeTodayIndex: number;
  sprintTotalDays: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
  activeTickets: SprintTicket[];
  blockedTickets: SprintTicket[];
  isDemo: boolean;
  formatDate: (iso?: string) => string;
}

export function BurndownHeader({
  sprintName,
  completionPct,
  activeCompletedPoints,
  activeTotalPoints,
  activeTodayIndex,
  sprintTotalDays,
  sprintStartDate,
  sprintEndDate,
  activeTickets,
  blockedTickets,
  formatDate,
}: BurndownHeaderProps) {
  return (
    <Reveal>
      <div className="relative rounded-2xl border border-primary/15 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, transparent 40%, rgba(22,163,74,0.04) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(34,197,94,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/20"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))', animation: 'bd-pulse-glow 3s ease-in-out infinite' }}>
              <Flame className="w-6 h-6 text-primary" style={{ animation: 'bd-float 3s ease-in-out infinite' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                {sprintName} Burndown
              </h1>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {sprintStartDate && sprintEndDate
                    ? `${formatDate(sprintStartDate)} – ${formatDate(sprintEndDate)}`
                    : 'No date range'}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Day {activeTodayIndex + 1} of {sprintTotalDays}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> {new Set(activeTickets.map(t => t.assignee)).size} engineers
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CompletionRing pct={completionPct} />
            <div className="flex flex-col gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                blockedTickets.length > 0
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : completionPct >= 50
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${blockedTickets.length > 0 ? 'bg-warning' : completionPct >= 50 ? 'bg-success' : 'bg-primary'}`} />
                {blockedTickets.length > 0 ? 'At Risk' : completionPct >= 50 ? 'On Track' : 'In Progress'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums">
                {activeCompletedPoints}/{activeTotalPoints} pts
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${sprintTotalDays > 0 ? ((activeTodayIndex + 1) / sprintTotalDays) * 100 : 0}%`,
              background: 'var(--primary)',
              animation: 'bd-bar-grow 1.2s ease-out both',
              boxShadow: '0 0 12px rgba(34,197,94,0.3)',
            }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">Sprint Start</span>
            <span className="text-[10px] text-primary font-semibold">Day {activeTodayIndex + 1} — {sprintTotalDays > 0 ? Math.round(((activeTodayIndex + 1) / sprintTotalDays) * 100) : 0}%</span>
            <span className="text-[10px] text-muted-foreground">Sprint End</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
