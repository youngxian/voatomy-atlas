'use client';

import { Target, CheckCircle2, Circle, Loader2, Ban } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { statusConfig } from '@/lib/burndown-mock';
import type { SprintTicket } from '@/lib/burndown-mock';

interface SprintScopeSectionProps {
  activeTickets: SprintTicket[];
  activeCompletedPoints: number;
  activeTotalPoints: number;
  completionPct: number;
  doneTickets: SprintTicket[];
  ipTickets: SprintTicket[];
  todoTickets: SprintTicket[];
  blockedTickets: SprintTicket[];
}

export function SprintScopeSection({
  activeTickets,
  activeCompletedPoints,
  activeTotalPoints,
  completionPct,
  doneTickets,
  ipTickets,
  todoTickets,
  blockedTickets,
}: SprintScopeSectionProps) {
  return (
    <Reveal delay={0.2}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              Sprint Scope
            </h2>
            <div className="flex items-center gap-4 text-xs">
              {[
                { label: `${doneTickets.length} Done`, color: 'var(--success)', Icon: CheckCircle2 },
                { label: `${ipTickets.length} In Progress`, color: 'var(--primary)', Icon: Loader2 },
                { label: `${todoTickets.length} To Do`, color: 'var(--muted-foreground)', Icon: Circle },
                { label: `${blockedTickets.length} Blocked`, color: 'var(--destructive)', Icon: Ban },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-1" style={{ color: s.color }}>
                  <s.Icon className="w-3.5 h-3.5" /> {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Sprint Progress</span>
              <span className="font-mono font-bold text-foreground">{completionPct}%</span>
            </div>
            <div className="h-2.5 bg-border/30 rounded-full overflow-hidden flex">
              <div className="h-full bg-success rounded-l-full transition-all duration-1000" style={{ width: `${activeTotalPoints > 0 ? (activeCompletedPoints / activeTotalPoints) * 100 : 0}%` }} />
              <div className="h-full bg-primary" style={{ width: `${activeTotalPoints > 0 ? ((ipTickets.reduce((s, t) => s + t.points, 0)) / activeTotalPoints) * 100 : 0}%` }} />
              <div className="h-full bg-destructive" style={{ width: `${activeTotalPoints > 0 ? ((blockedTickets.reduce((s, t) => s + t.points, 0)) / activeTotalPoints) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              {[
                { label: 'Done', color: 'var(--success)', pts: activeCompletedPoints },
                { label: 'In Progress', color: 'var(--primary)', pts: ipTickets.reduce((s, t) => s + t.points, 0) },
                { label: 'Blocked', color: 'var(--destructive)', pts: blockedTickets.reduce((s, t) => s + t.points, 0) },
                { label: 'To Do', color: 'var(--muted-foreground)', pts: todoTickets.reduce((s, t) => s + t.points, 0) },
              ].map(seg => (
                <span key={seg.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                  {seg.pts} pts
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {activeTickets.map((ticket, i) => {
              const config = statusConfig(ticket.status);
              const StatusIcon = config.icon;
              const isDone = ticket.status === 'done';
              return (
                <div
                  key={ticket.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isDone
                      ? 'bg-secondary/50 border-border/30'
                      : ticket.status === 'blocked'
                      ? 'bg-destructive/[0.03] border-destructive/15'
                      : 'bg-card border-border/50 hover:border-border/80'
                  }`}
                  style={{ animation: `bd-fade-in-up 0.35s ease-out ${i * 0.04}s both` }}
                >
                  <StatusIcon
                    className={`w-4 h-4 shrink-0 ${ticket.status === 'in_progress' ? 'animate-spin' : ''}`}
                    style={{ color: config.color, ...(ticket.status === 'in_progress' ? { animationDuration: '3s' } : {}) }}
                  />
                  <span className={`font-mono text-xs font-bold shrink-0 w-20 ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {ticket.id}
                  </span>
                  <span className={`flex-1 text-sm ${isDone ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                    {ticket.title}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md shrink-0 border border-border/30">{ticket.module}</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-border/20 text-muted-foreground rounded-md shrink-0">
                    {ticket.points}p
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${ticket.avatarColor}, ${ticket.avatarColor}88)` }}
                  >
                    {ticket.assigneeInitials}
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border shrink-0 ${config.bg} ${config.border}`} style={{ color: config.color }}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
