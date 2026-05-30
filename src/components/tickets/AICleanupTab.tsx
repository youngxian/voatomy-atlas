'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  RefreshCw,
  Scissors,
  Split,
} from 'lucide-react';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Sub-tab selector type
// ---------------------------------------------------------------------------

type CleanupView = 'duplicates' | 'subtasks';

// ---------------------------------------------------------------------------
// Duplicates section
// ---------------------------------------------------------------------------

function DuplicatesSection() {
  const { activeProjectId } = useProject();
  const [duplicates, setDuplicates] = useState<api.DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false);
      setError('No active project selected');
      setDuplicates([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getDuplicates(activeProjectId)
      .then((groups) => {
        if (!cancelled) setDuplicates(Array.isArray(groups) ? groups : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof api.APIError ? err.message : 'Failed to load duplicates');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeProjectId, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Scanning for duplicates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (duplicates.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          No Duplicates Found
        </h3>
        <p className="text-sm text-muted-foreground">
          ATLAS analyzed all open tickets and found no likely duplicates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Copy className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Duplicate Detection</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ATLAS found <span className="font-bold text-foreground">{duplicates.length} potential duplicate group{duplicates.length !== 1 ? 's' : ''}</span> across
          your open tickets. Review and merge or dismiss as needed.
        </p>
      </div>

      {/* Duplicate groups */}
      <div className="space-y-3">
        {duplicates.map((group, idx) => {
          const confidenceColor =
              group.confidence >= 0.85
                ? 'text-destructive'
                : group.confidence >= 0.7
                  ? 'text-warning'
                  : 'text-secondary-foreground';
          const confidenceBg =
            group.confidence >= 0.85
              ? 'bg-destructive/10 border-destructive/20'
              : group.confidence >= 0.7
                ? 'bg-warning/10 border-warning/20'
                : 'bg-muted/10 border-border/20';

          return (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-md transition-all"
              style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.06}s both` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                    <Copy className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground">
                      {group.ticket_ids.length} Tickets
                    </span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${confidenceColor} ${confidenceBg}`}>
                      {Math.round(group.confidence * 100)}% match
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {group.titles.map((title, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary shrink-0">
                      {group.ticket_ids[tIdx] ? String(group.ticket_ids[tIdx]).slice(0, 8) : '???'}
                    </span>
                    <span className="text-sm text-foreground">{title}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-secondary border border-border/60 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-primary">Why these match</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{group.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subtasks section
// ---------------------------------------------------------------------------

function SubtasksSection() {
  const { activeProjectId } = useProject();
  const [suggestions, setSuggestions] = useState<api.SubtaskSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false);
      setError('No active project selected');
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getSubtaskSuggestions(activeProjectId)
      .then((data) => {
        if (!cancelled) setSuggestions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof api.APIError ? err.message : 'Failed to detect subtasks');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeProjectId, retryCount]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Analyzing tickets for subtask breakdown...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
          All Tickets Well-Scoped
        </h3>
        <p className="text-sm text-muted-foreground">
          No tickets need to be broken down into subtasks right now.
        </p>
      </div>
    );
  }

  const totalSubtasks = suggestions.reduce((s, g) => s + g.subtasks.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Split className="w-4 h-4 text-warning" />
          <span className="text-xs font-semibold text-warning">Subtask Detection</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ATLAS identified <span className="font-bold text-foreground">{suggestions.length} ticket{suggestions.length !== 1 ? 's' : ''}</span> that
          would benefit from being broken into <span className="font-bold text-foreground">{totalSubtasks} subtasks</span>.
          Smaller tasks improve review speed, reduce risk, and increase delivery predictability.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {suggestions.map((group, idx) => {
          const isExpanded = expandedIds.has(group.ticket_id);
          const totalPoints = group.subtasks.reduce((s, t) => s + t.points, 0);

          return (
            <div
              key={group.ticket_id}
              className="rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-md transition-all"
              style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.06}s both` }}
            >
              <button
                onClick={() => toggleExpand(group.ticket_id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground truncate">{group.ticket_title}</span>
                    <span className="text-[10px] font-bold text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded">
                      {group.subtasks.length} subtasks
                    </span>
                    <span className="text-[10px] text-muted-foreground">{totalPoints}pts total</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-secondary-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-secondary-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border/60">
                  <div className="px-4 py-3 bg-muted border-b border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-primary">Why split this ticket</span>
                    </div>
                    <p className="text-[11px] text-secondary-foreground leading-relaxed">{group.reason}</p>
                  </div>

                  <div className="divide-y divide-border/40">
                    {group.subtasks.map((sub, sIdx) => (
                      <div key={sIdx} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{sIdx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{sub.title}</span>
                            <span className="text-[10px] font-bold tabular-nums text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              {sub.points}pts
                            </span>
                          </div>
                          {sub.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{sub.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AICleanupTab (merged Duplicates + Subtasks)
// ---------------------------------------------------------------------------

export function AICleanupTab() {
  const [view, setView] = useState<CleanupView>('duplicates');

  return (
    <div className="space-y-5">
      {/* Sub-tab toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/40 border border-border/40 w-fit">
        <button
          onClick={() => setView('duplicates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            view === 'duplicates'
              ? 'text-primary bg-card shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicates
        </button>
        <button
          onClick={() => setView('subtasks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            view === 'subtasks'
              ? 'text-primary bg-card shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-secondary-foreground'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          Subtasks
        </button>
      </div>

      {view === 'duplicates' ? <DuplicatesSection /> : <SubtasksSection />}
    </div>
  );
}
