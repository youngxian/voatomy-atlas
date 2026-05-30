'use client';

import React from 'react';
import { ExternalLink, Minus, Plus, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import type { SprintTicket, ExcludedTicket } from '@/lib/mock-data';
import {
  shimmerStyle,
  slideInStyle,
  barGrowStyle,
  assigneeColors,
  assigneeInitials,
  storyLabels,
  labelColors,
  riskBadge,
  statusIndicator,
  complexityDots,
} from '@/lib/sprint-review-config';

interface TicketGridProps {
  sprintTickets: SprintTicket[];
  recommendedTickets: SprintTicket[];
  excludedTickets: ExcludedTicket[];
  visibleRecommended: SprintTicket[];
  addedExcluded: ExcludedTicket[];
  hiddenCount: number;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  removeTicket: (id: string) => void;
  addedBackTickets: Set<string>;
  setAddedBackTickets: React.Dispatch<React.SetStateAction<Set<string>>>;
  apiLabelsByTicketId: React.MutableRefObject<Map<string, string[]>>;
  totalPlanned: number;
}

export function TicketGrid({
  sprintTickets,
  recommendedTickets,
  excludedTickets,
  visibleRecommended,
  addedExcluded,
  hiddenCount,
  showAll,
  setShowAll,
  removeTicket,
  setAddedBackTickets,
  apiLabelsByTicketId,
  totalPlanned,
}: TicketGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Recommended for Sprint ({totalPlanned} pts)
        </h2>
        <span className="text-xs text-muted-foreground">{recommendedTickets.length + addedExcluded.length} stories</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {sprintTickets.length === 0 && excludedTickets.length === 0 && (
          <p className="text-sm text-muted-foreground lg:col-span-2 text-center py-10">
            No tickets in this sprint plan yet.
          </p>
        )}
        {visibleRecommended.map((ticket, idx) => (
          <Card key={ticket.id} className="relative overflow-hidden p-0">
            {(ticket.risk === 'high' || ticket.risk === 'critical') && (
              <div className="absolute inset-0 pointer-events-none" style={shimmerStyle} />
            )}
            <div className="p-4 space-y-3" style={slideInStyle(idx * 0.05)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a href="#" target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    {ticket.id}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {statusIndicator(ticket.status)}
                </div>
                <button onClick={() => removeTicket(ticket.id)} className="w-6 h-6 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors" title="Remove from sprint">
                  <Minus className="w-3 h-3 text-destructive" />
                </button>
              </div>

              <p className="text-sm text-foreground font-medium leading-tight">{ticket.title}</p>

              <div className="flex flex-wrap gap-1.5">
                {(storyLabels[ticket.id] ?? apiLabelsByTicketId.current.get(ticket.id) ?? []).map(label => (
                  <span key={label} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${labelColors[label] || 'bg-muted text-muted-foreground border-border'}`}>
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: assigneeColors[ticket.assignee] || 'var(--muted-foreground)' }}>
                    {assigneeInitials[ticket.assignee] || '??'}
                  </span>
                  <span className="text-xs text-muted-foreground">{ticket.assignee}</span>
                </div>
                <div className="flex items-center gap-3">
                  {complexityDots(ticket.atlasPoints)}
                  <span className="text-sm font-bold text-foreground tabular-nums">{ticket.atlasPoints}<span className="text-[10px] text-muted-foreground ml-0.5">pts</span></span>
                  {riskBadge(ticket.risk)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Confidence</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ticket.confidence >= 80 ? 'bg-success' : ticket.confidence >= 60 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${ticket.confidence}%`, ...barGrowStyle(0.3 + idx * 0.05) }} />
                </div>
                <span className={`text-[10px] font-semibold tabular-nums ${ticket.confidence >= 80 ? 'text-success' : ticket.confidence >= 60 ? 'text-warning' : 'text-destructive'}`}>
                  {ticket.confidence}%
                </span>
              </div>
            </div>
          </Card>
        ))}

        {addedExcluded.map((ticket) => (
          <Card key={ticket.id} className="relative overflow-hidden p-0 border-success/30">
            <div className="p-4 space-y-3 bg-success/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a href="#" className="text-sm font-mono text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    {ticket.id}<ExternalLink className="w-3 h-3" />
                  </a>
                  <Badge variant="info">Added Back</Badge>
                </div>
                <button onClick={() => setAddedBackTickets((prev) => { const next = new Set(prev); next.delete(ticket.id); return next; })} className="w-6 h-6 rounded-md bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors">
                  <Minus className="w-3 h-3 text-destructive" />
                </button>
              </div>
              <p className="text-sm text-foreground font-medium">{ticket.title}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Previously excluded</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{ticket.atlasPoints}<span className="text-[10px] text-muted-foreground ml-0.5">pts</span></span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button onClick={() => setShowAll(true)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-primary hover:text-primary/80 bg-muted hover:bg-muted/80 border border-border transition-colors">
          <Plus className="w-4 h-4" />Show {hiddenCount} more stories<ChevronDown className="w-4 h-4" />
        </button>
      )}
      {showAll && hiddenCount > 0 && (
        <button onClick={() => setShowAll(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors">
          Show less<ChevronUp className="w-4 h-4" />
        </button>
      )}

      <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center">
        <Plus className="w-4 h-4" />Add ticket from backlog
      </button>
    </div>
  );
}
