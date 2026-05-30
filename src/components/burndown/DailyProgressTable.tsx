'use client';

import { Clock, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import type { DayData } from '@/lib/burndown-mock';

interface DailyProgressTableProps {
  activeBurndownData: DayData[];
}

export function DailyProgressTable({ activeBurndownData }: DailyProgressTableProps) {
  return (
    <Reveal delay={0.15}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,17,44,0.04), 0 4px 16px rgba(0,17,44,0.03)' }}>
        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-warning/8 border border-warning/12 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-warning" />
          </div>
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>Daily Progress</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/40">
                <th className="text-left py-3 px-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Day</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="text-right py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining</th>
                <th className="text-right py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Burned</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tickets</th>
                <th className="text-left py-3 px-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeBurndownData.map((d, i) => {
                const isToday = d.isToday;
                const isFuture = !d.isPast && !d.isToday;
                return (
                  <tr
                    key={d.day}
                    className={`border-b border-border/30 transition-all duration-200 ${
                      isToday ? 'bg-primary/[0.04]' : 'hover:bg-secondary/50'
                    }`}
                    style={{ animation: `bd-fade-in-up 0.4s ease-out ${i * 0.04}s both` }}
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        <span className={`font-mono font-bold text-sm ${isToday ? 'text-primary' : isFuture ? 'text-muted-foreground/40' : 'text-foreground'}`}>
                          {d.day}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-sm ${isToday ? 'text-primary font-semibold' : isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                      {d.date}
                      {isToday && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-semibold">today</span>}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono text-sm ${isToday ? 'text-primary font-bold' : isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                      {d.remaining}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono text-sm ${isFuture ? 'text-muted-foreground/40' : d.completed > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}`}>
                      {d.completed > 0 ? `+${d.completed}` : '–'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {d.ticketsCompleted.length > 0 ? d.ticketsCompleted.map(tid => (
                          <span key={tid} className="px-1.5 py-0.5 text-[10px] bg-success/10 text-success rounded-md font-mono border border-success/15 font-semibold">
                            {tid}
                          </span>
                        )) : (
                          <span className={`text-xs ${isFuture ? 'text-muted-foreground/30 italic' : 'text-muted-foreground/50'}`}>
                            {isFuture ? 'projected' : i === 0 ? 'sprint start' : '–'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      {isToday ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/15">
                          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Active
                        </span>
                      ) : d.isPast ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/15">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-border/20 text-muted-foreground/50 border border-border/30">
                          Projected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Reveal>
  );
}
