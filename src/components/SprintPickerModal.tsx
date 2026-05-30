'use client';

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  X,
  CalendarRange,
  LayoutGrid,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import type { Project, Sprint, BoardStructure } from '@/lib/api';
import { getProviderLabel, getProviderColor } from '@/lib/project-utils';
import { hasSprintSupport, detectSprintCycle, deduplicateSprints, type SprintCycleInfo } from '@/lib/board-utils';

interface SprintPickerModalProps {
  project: Project;
  sprints: Sprint[];
  boardStructure: BoardStructure | null;
  onSelect: (sprint: Sprint) => void;
  onClose: () => void;
  loading?: boolean;
  switching?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/15 text-success border-success/25' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' },
  planning: { label: 'Planning', className: 'bg-primary/10 text-primary border-primary/20' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function groupSprints(sprints: Sprint[]) {
  const active: Sprint[] = [];
  const planning: Sprint[] = [];
  const completed: Sprint[] = [];
  const other: Sprint[] = [];

  for (const s of sprints) {
    switch (s.status) {
      case 'active': active.push(s); break;
      case 'planning': planning.push(s); break;
      case 'completed': completed.push(s); break;
      default: other.push(s);
    }
  }

  return { active, planning, completed, other };
}

function SprintGroup({
  label,
  sprints,
  selectedId,
  defaultOpen,
  onSelect,
}: {
  label: string;
  sprints: Sprint[];
  selectedId: string | null;
  defaultOpen: boolean;
  onSelect: (s: Sprint) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (sprints.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {label}
        <span className="text-muted-foreground font-normal normal-case">({sprints.length})</span>
      </button>
      {open && (
        <div className="space-y-px">
          {sprints.map((s) => {
            const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.planning;
            const dates = formatDateRange(s.start_date, s.end_date);
            const isSelected = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary',
                  isSelected && 'bg-primary/5 border-l-2 border-primary',
                )}
              >
                <CalendarRange className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  {dates && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{dates}</p>
                  )}
                </div>
                <span className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0', badge.className)}>
                  {badge.label}
                </span>
                {s.planned_points != null && (
                  <span className="text-[10px] text-secondary-foreground shrink-0">{s.planned_points}pts</span>
                )}
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SprintPickerModal({
  project,
  sprints,
  boardStructure,
  onSelect,
  onClose,
  loading,
  switching,
}: SprintPickerModalProps) {
  const providerLabel = getProviderLabel(project);
  const providerColor = getProviderColor(project);
  const deduped = useMemo(() => deduplicateSprints(sprints), [sprints]);
  const groups = groupSprints(deduped);
  const hasSprints = deduped.length > 0;
  const isKanban = !hasSprints && boardStructure != null && !hasSprintSupport(boardStructure);
  const noBoard = !hasSprints && !isKanban;
  const defaultSelectedId = groups.active[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId);

  const cycleInfo = useMemo<SprintCycleInfo | null>(
    () => (hasSprints ? detectSprintCycle(sprints, project) : null),
    [hasSprints, sprints, project],
  );

  const handleSelect = (s: Sprint) => {
    setSelectedId(s.id);
  };

  const handleConfirm = () => {
    const chosen = deduped.find((s) => s.id === selectedId);
    if (chosen) onSelect(chosen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Select sprint"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <CalendarRange className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{project.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {providerLabel !== 'No board' && (
                  <span className={clsx('text-[9px] font-bold text-white px-1 py-[1px] rounded', providerColor)}>
                    {providerLabel}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {hasSprints
                    ? `${deduped.length} sprint${deduped.length !== 1 ? 's' : ''} found`
                    : 'Select sprint'}
                </span>
                {cycleInfo && cycleInfo.cycleType !== 'unknown' && (
                  <span className="text-[9px] font-semibold px-1.5 py-[1px] rounded bg-primary/10 text-primary border border-primary/20">
                    {cycleInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading sprints...</p>
            </div>
          ) : hasSprints ? (
            /* State A: Sprints found */
            <div className="py-2">
              {boardStructure && (
                <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-secondary/60 text-[11px] text-secondary-foreground flex items-center gap-3">
                  <span>{boardStructure.total_tickets} tickets</span>
                  <span className="w-px h-3 bg-border" />
                  <span>{boardStructure.backlog_count} backlog</span>
                  <span className="w-px h-3 bg-border" />
                  <span>{boardStructure.team_member_count} members</span>
                </div>
              )}

              {/* Sprint cycle detection banner */}
              {cycleInfo && cycleInfo.cycleType !== 'unknown' && (
                <div className="mx-3 mb-2 px-3 py-2 rounded-lg border border-border/60 bg-card">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground">{cycleInfo.label}</span>
                    {cycleInfo.isConsistent ? (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">Consistent</span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">Irregular</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>~{cycleInfo.medianDurationDays}d median</span>
                    <span className="w-px h-2.5 bg-border" />
                    <span>{cycleInfo.sprintCount} sprints analysed</span>
                    {cycleInfo.avgGapDays > 0 && (
                      <>
                        <span className="w-px h-2.5 bg-border" />
                        <span>{cycleInfo.avgGapDays}d avg gap</span>
                      </>
                    )}
                  </div>
                  {!cycleInfo.matchesConfig && cycleInfo.configuredDays != null && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-warning">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>
                        Configured as {cycleInfo.configuredDays}-day sprints but detected ~{cycleInfo.medianDurationDays} days
                      </span>
                    </div>
                  )}
                </div>
              )}

              <SprintGroup label="Active" sprints={groups.active} selectedId={selectedId} defaultOpen onSelect={handleSelect} />
              <SprintGroup label="Planning" sprints={groups.planning} selectedId={selectedId} defaultOpen onSelect={handleSelect} />
              <SprintGroup label="Completed" sprints={groups.completed} selectedId={selectedId} defaultOpen={false} onSelect={handleSelect} />
              {groups.other.length > 0 && (
                <SprintGroup label="Other" sprints={groups.other} selectedId={selectedId} defaultOpen={false} onSelect={handleSelect} />
              )}
            </div>
          ) : isKanban ? (
            /* State B: Kanban / no sprints */
            <div className="flex flex-col items-center text-center py-12 px-6 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Kanban Board Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This project uses Kanban — no sprints detected.
                </p>
              </div>
              {boardStructure && (
                <div className="flex flex-wrap justify-center gap-3 text-[11px] text-secondary-foreground">
                  <span>{boardStructure.total_tickets} tickets</span>
                  <span className="w-px h-3 bg-border self-center" />
                  <span>{boardStructure.backlog_count} in backlog</span>
                  <span className="w-px h-3 bg-border self-center" />
                  <span>{boardStructure.team_member_count} team members</span>
                  <span className="w-px h-3 bg-border self-center" />
                  <span>{boardStructure.status_workflow.length} workflow statuses</span>
                </div>
              )}
            </div>
          ) : (
            /* State C: No board structure */
            <div className="flex flex-col items-center text-center py-12 px-6 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No Sprints Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No sprints or board structure found for this project.
                </p>
              </div>
              {providerLabel !== 'No board' && (
                <span className={clsx('text-[10px] font-bold text-white px-2 py-0.5 rounded', providerColor)}>
                  {providerLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2 shrink-0">
          {hasSprints ? (
            <>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedId || switching}
                className={clsx(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2',
                  selectedId && !switching
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                {switching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Select Sprint'
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              {isKanban ? 'Continue without sprint' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
