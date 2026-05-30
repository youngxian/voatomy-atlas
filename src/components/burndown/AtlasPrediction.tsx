'use client';

import { Brain, Sparkles, Zap } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import type { SprintTicket } from '@/lib/burndown-mock';

interface AtlasPredictionProps {
  activeTickets: SprintTicket[];
  forecastPts: number;
  activeTotalPoints: number;
  completionPct: number;
}

export function AtlasPrediction({
  activeTickets,
  forecastPts,
  activeTotalPoints,
  completionPct,
}: AtlasPredictionProps) {
  const blockedTickets = activeTickets.filter(t => t.status === 'blocked');
  const nonDoneTickets = activeTickets.filter(t => t.status !== 'done');
  const lowestConfidence = [...nonDoneTickets].sort((a, b) => a.confidence - b.confidence)[0];

  const tips: string[] = [];
  if (lowestConfidence && lowestConfidence.confidence < 80) {
    tips.push(`Prioritize **${lowestConfidence.id}** (${lowestConfidence.confidence}% confidence) to de-risk delivery.`);
  }
  if (blockedTickets[0]) {
    tips.push(`Unblock **${blockedTickets[0].id}** to keep the sprint on track.`);
  }
  if (tips.length === 0 && forecastPts >= activeTotalPoints) {
    tips.push('Sprint is on track. Maintain current velocity and focus on code review quality.');
  }
  if (tips.length === 0) {
    tips.push('Consider redistributing remaining work to improve completion probability.');
  }

  return (
    <Reveal delay={0.35}>
      <div className="rounded-2xl border border-primary/20 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="relative">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, transparent 40%, rgba(22,163,74,0.04) 100%)',
          }} />
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" style={{ background: 'rgba(34,197,94,0.04)' }} />

          <div className="h-0.5 mx-6 mt-0 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
            backgroundSize: '200% 100%',
            animation: 'bd-shimmer 3s ease-in-out infinite',
          }} />

          <div className="relative p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl border border-primary/20 flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.08))' }}>
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  ATLAS Prediction
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-3 h-3" /> AI-Powered
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  ATLAS predicts <span className={`font-bold ${forecastPts >= activeTotalPoints ? 'text-success' : 'text-warning'}`}>{forecastPts >= activeTotalPoints ? Math.min(99, Math.round(completionPct + (100 - completionPct) * 0.7)) : Math.max(20, Math.round(completionPct * 0.85))}% probability</span> of completing all committed tickets by sprint end.
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Confidence by Ticket</p>
              {nonDoneTickets.map((ticket, i) => (
                <div key={ticket.id} className="flex items-center gap-3" style={{ animation: `bd-fade-in-up 0.3s ease-out ${0.1 + i * 0.05}s both` }}>
                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticket.id}</span>
                  <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ticket.confidence}%`,
                        backgroundColor: ticket.confidence >= 80 ? 'var(--success)' : ticket.confidence >= 60 ? 'var(--warning)' : 'var(--destructive)',
                        animation: `bd-bar-grow 0.8s ease-out ${0.3 + i * 0.1}s both`,
                      }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold w-10 text-right ${
                    ticket.confidence >= 80 ? 'text-success' : ticket.confidence >= 60 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {ticket.confidence}%
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 border border-border/50 bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recommendation</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tips.map((tip, i) => (
                  <span key={i}>
                    {i > 0 && ' '}
                    {tip.split(/\*\*(.+?)\*\*/).map((part, j) =>
                      j % 2 === 1
                        ? <span key={j} className="text-primary font-semibold">{part}</span>
                        : part
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
