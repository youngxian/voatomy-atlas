'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  DollarSign,
  Gauge,
  GitMerge,
  Loader2,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { mapAPINextSprintToMock } from '@/lib/ticket-utils';

export function NextSprintTab({ apiNextSprint }: { apiNextSprint: api.NextSprintRecommendation | null }) {
  const { activeProjectId } = useProject();

  if (!activeProjectId) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active project selected</p>
      </div>
    );
  }

  if (apiNextSprint === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading next sprint recommendations...</span>
      </div>
    );
  }

  const sprintSuggestions = mapAPINextSprintToMock(apiNextSprint);
  const totalSuggestedPoints = sprintSuggestions.reduce((s, t) => s + t.suggestedPoints, 0);
  const totalRevenue = sprintSuggestions.reduce((s, t) => s + (t.revenueImpact || 0), 0);

  if (sprintSuggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          No next-sprint recommendations yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Sync your board or check back after ATLAS finishes analyzing backlog and velocity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Suggested Tickets</p>
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>{sprintSuggestions.length}</p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Points</p>
          <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>{totalSuggestedPoints}</p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Revenue Impact</p>
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>${(totalRevenue / 1000).toFixed(0)}K</p>
        </Card>
        <Card className="bento-card rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-success" style={{ fontFamily: 'var(--font-serif)' }}>
            {Math.round(sprintSuggestions.reduce((s, t) => s + t.confidence, 0) / (sprintSuggestions.length || 1))}%
          </p>
        </Card>
      </div>

      {/* AI header */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-warning/5 to-transparent p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Sprint 26 — AI Recommendations</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Based on current sprint velocity, backlog age, customer signals, and revenue pipeline analysis,
          ATLAS recommends the following {sprintSuggestions.length} tickets for Sprint 26.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {sprintSuggestions.map((suggestion, idx) => {
          const priorityColors: Record<string, { color: string; bg: string; border: string }> = {
            P0: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
            P1: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
            P2: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
            P3: { color: 'text-secondary-foreground', bg: 'bg-muted/10', border: 'border-border/20' },
          };
          const pCfg = priorityColors[suggestion.priority] || priorityColors.P2;

          return (
            <div
              key={suggestion.id}
              className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-md transition-all"
              style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.06}s both` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pCfg.color} ${pCfg.bg} border ${pCfg.border}`}>
                    {suggestion.priority}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{suggestion.module}</span>
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {suggestion.suggestedPoints} <span className="text-[10px] text-secondary-foreground">pts</span>
                </span>
              </div>

              <p className="text-sm font-medium text-foreground mb-2">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{suggestion.reason}</p>

              <div className="flex items-center gap-3 flex-wrap text-[10px]">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-secondary-foreground" />
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className={`font-bold ${suggestion.confidence >= 80 ? 'text-success' : suggestion.confidence >= 60 ? 'text-warning' : 'text-destructive'}`}>
                    {suggestion.confidence}%
                  </span>
                </div>

                {suggestion.revenueImpact && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-secondary-foreground" />
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-bold text-foreground">${(suggestion.revenueImpact / 1000).toFixed(0)}K</span>
                  </div>
                )}

                {suggestion.customerTickets > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-secondary-foreground" />
                    <span className="font-bold text-foreground">{suggestion.customerTickets} customer tickets</span>
                  </div>
                )}

                {suggestion.dependsOn.length > 0 && (
                  <div className="flex items-center gap-1">
                    <GitMerge className="w-3 h-3 text-secondary-foreground" />
                    <span className="text-muted-foreground">Depends on:</span>
                    {suggestion.dependsOn.map((d) => (
                      <span key={d} className="font-mono font-bold text-primary">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {suggestion.signalSources.map((src) => (
                  <span key={src} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/8 border border-primary/15 text-primary">
                    {src}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <Link href="/sprint/plan">
        <button className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-warning transition-all duration-300 hover:scale-[1.005] hover:opacity-90"
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Start Planning Sprint 26 with These Suggestions
          </span>
        </button>
      </Link>
    </div>
  );
}
