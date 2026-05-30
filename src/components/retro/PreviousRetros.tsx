'use client';

import { ChevronDown, ChevronUp, Layers, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { StarRating } from './RetroSection';
import { previousRetros } from '@/lib/retro-types';
import type { Sprint } from '@/lib/api';

interface PreviousRetrosProps {
  expanded: boolean;
  onToggle: () => void;
  completedSprints: Sprint[];
  activeSprintId?: string | null;
  onSelectSprint?: (sprintId: string) => void;
  isDemo: boolean;
}

export function PreviousRetros({ expanded, onToggle, completedSprints, activeSprintId, onSelectSprint, isDemo }: PreviousRetrosProps) {
  return (
    <div className="px-6 pb-6">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="section-previous"
        className="flex items-center justify-between w-full mb-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 border border-border">
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Previous Retrospectives</h2>
            <span className="text-xs text-muted-foreground">
              {completedSprints.length > 1
                ? `${completedSprints.length - 1} previous sprint${completedSprints.length - 1 !== 1 ? 's' : ''}`
                : isDemo ? '3 previous sprints' : 'No previous sprints'}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div id="section-previous" role="region" aria-label="Previous Retrospectives" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {completedSprints.length > 1 ? (
            completedSprints.slice(1).map((sprint) => (
              <Card key={sprint.id} className="bento-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{sprint.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="space-y-2">
                  {sprint.accuracy_pct != null && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{sprint.accuracy_pct}%</p>
                    </div>
                  )}
                  {sprint.actual_points != null && sprint.planned_points != null && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivered</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{sprint.actual_points}/{sprint.planned_points} pts</p>
                    </div>
                  )}
                  {sprint.goal && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Goal</span>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sprint.goal}</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => onSelectSprint?.(sprint.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    View full retro <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            ))
          ) : (
            previousRetros.map((retro) => (
              <Card key={retro.sprint} className="bento-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{retro.sprint}</span>
                  <span className="text-xs text-muted-foreground">{retro.date}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={retro.mood} />
                  <span className="text-xs font-bold text-foreground tabular-nums">{retro.mood}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Key Theme</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{retro.theme}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Action</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{retro.topAction}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    Demo retro
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
