'use client';

import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import {
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  CalendarRange,
  ArrowRight,
  SkipForward,
  Sparkles,
  Hash,
  Users,
  Plug,
} from 'lucide-react';
import type {
  Project,
  BoardStructure,
  ProjectHierarchy,
  HierarchyItem,
} from '@/lib/api';
import { getProjectHierarchy } from '@/lib/api';
import {
  getProviderLabel,
  getProviderColor,
  getProjectProviders,
  getProviderLabelByKey,
  getProviderColorByKey,
} from '@/lib/project-utils';
import {
  detectBoardStructure,
  getHierarchyTypeIcon,
  getHierarchyTypeLabel,
  findActiveItem,
  flattenHierarchy,
} from '@/lib/board-utils';

// ── Props ────────────────────────────────────────────────────────────────────

interface BoardExplorerModalProps {
  project: Project;
  onPlanSprint: (sprintId?: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SPRINT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/15 text-success border-success/25' },
  completed: { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' },
  planning: { label: 'Planning', className: 'bg-primary/10 text-primary border-primary/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
  future: { label: 'Future', className: 'bg-primary/10 text-primary border-primary/20' },
};

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function isContainerType(type: string): boolean {
  return type === 'folder' || type === 'project' || type === 'workspace';
}

// ── HierarchyTreeItem ────────────────────────────────────────────────────────

function HierarchyTreeItem({
  item,
  depth,
  selectedId,
  activeItemId,
  providerKey,
  onSelect,
}: {
  item: HierarchyItem;
  depth: number;
  selectedId: string | null;
  activeItemId: string;
  providerKey?: string;
  onSelect: (item: HierarchyItem) => void;
}) {
  const hasChildren = !!item.children?.length;
  const isContainer = isContainerType(item.type);
  const [expanded, setExpanded] = useState(
    isContainer || item.is_active || item.children?.some((c) => c.is_active) === true,
  );
  const isSelected = item.id === selectedId;
  const isActive = item.id === activeItemId;
  const Icon = getHierarchyTypeIcon(item.type);

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren && isContainer) setExpanded(!expanded);
          onSelect(item);
        }}
        className={clsx(
          'w-full flex items-center gap-2 py-2 pr-3 text-left transition-colors hover:bg-secondary/80',
          isSelected && 'bg-primary/5 border-r-2 border-primary',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && isContainer ? (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <Icon className={clsx('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />

        <span className={clsx('text-sm truncate', isActive ? 'font-semibold text-foreground' : 'text-secondary-foreground')}>
          {item.name}
        </span>

        {providerKey && depth === 0 && (
          <span className={clsx('text-[7px] font-bold text-white px-1 py-[0.5px] rounded shrink-0', getProviderColorByKey(providerKey))}>
            {getProviderLabelByKey(providerKey)}
          </span>
        )}

        {item.has_sprint && (
          <span className="text-[8px] font-bold px-1 py-[1px] rounded bg-success/15 text-success border border-success/25 shrink-0">
            Sprint
          </span>
        )}

        {isActive && <Check className="w-3 h-3 text-primary shrink-0 ml-auto" />}
      </button>

      {expanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <HierarchyTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedId={selectedId}
              activeItemId={activeItemId}
              providerKey={providerKey}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── BoardOverviewPanel ───────────────────────────────────────────────────────

function BoardOverviewPanel({
  hierarchy,
  boardStructure,
  selectedItem,
  selectedSprintId,
  onSelectSprint,
}: {
  hierarchy: ProjectHierarchy;
  boardStructure: BoardStructure | null;
  selectedItem: HierarchyItem | null;
  selectedSprintId: string | null;
  onSelectSprint: (id: string) => void;
}) {
  const displayItem = selectedItem ?? findActiveItem(hierarchy) ?? null;
  const sprints = boardStructure?.sprints ?? [];
  const activeSprint = boardStructure?.active_sprint;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Board name header */}
      {displayItem && (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active {getHierarchyTypeLabel(displayItem.type)}
            </span>
          </div>
          <p className="text-base font-semibold text-foreground mt-1">{displayItem.name}</p>
          {boardStructure && (
            <div className="flex items-center gap-3 mt-2 text-[11px] text-secondary-foreground">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {boardStructure.total_tickets} tickets
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {sprints.reduce((s, sp) => s + sp.ticket_count, 0)} pts
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {boardStructure.team_member_count} members
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sprints list */}
      {sprints.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Sprints
          </p>
          <div className="space-y-1">
            {sprints.map((sp) => {
              const isActive = sp.external_id === activeSprint?.external_id;
              const isChosen = sp.external_id === selectedSprintId;
              const badge = SPRINT_STATUS_BADGE[sp.status] ?? SPRINT_STATUS_BADGE.planning;
              const dates = formatDateRange(sp.start_date, sp.end_date);
              return (
                <button
                  key={sp.external_id}
                  onClick={() => onSelectSprint(sp.external_id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-secondary',
                    isChosen && 'bg-primary/5 ring-1 ring-primary/20',
                  )}
                >
                  <CalendarRange className={clsx('w-4 h-4 shrink-0', isActive ? 'text-success' : 'text-muted-foreground')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {isActive && <span className="text-success mr-1">●</span>}
                      {sp.name}
                    </p>
                    {dates && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{dates}</p>
                    )}
                  </div>
                  <span className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0', badge.className)}>
                    {badge.label}
                  </span>
                  {sp.ticket_count > 0 && (
                    <span className="text-[10px] text-secondary-foreground shrink-0">{sp.ticket_count} tix</span>
                  )}
                  {isChosen && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status workflow */}
      {boardStructure && boardStructure.status_workflow?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Status Workflow
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {boardStructure.status_workflow.map((sw, i) => (
              <span key={sw.name} className="flex items-center gap-1">
                <span className="text-xs font-medium text-secondary-foreground bg-secondary px-2 py-0.5 rounded border border-border/60">
                  {sw.name}
                  {sw.ticket_count > 0 && (
                    <span className="text-muted-foreground ml-1 text-[10px]">({sw.ticket_count})</span>
                  )}
                </span>
                {i < boardStructure.status_workflow.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-border" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no board structure */}
      {!boardStructure && !displayItem && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">Select an item from the hierarchy to see details.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

interface MergedHierarchy {
  hierarchies: { provider: string; hierarchy: ProjectHierarchy }[];
  merged: ProjectHierarchy;
  isMultiProvider: boolean;
}

function mergeHierarchies(
  entries: { provider: string; hierarchy: ProjectHierarchy }[],
): MergedHierarchy {
  if (entries.length <= 1) {
    const single = entries[0];
    return {
      hierarchies: entries,
      merged: single?.hierarchy ?? { provider: '', project_name: '', containers: [], active_item_id: '', active_item_name: '' },
      isMultiProvider: false,
    };
  }

  const containers: HierarchyItem[] = [];
  let activeItemId = '';
  let activeItemName = '';

  for (const { provider, hierarchy } of entries) {
    const label = getProviderLabelByKey(provider);
    const root: HierarchyItem = {
      id: `provider-root-${provider}`,
      name: label,
      type: 'workspace',
      has_sprint: false,
      is_active: false,
      children: [
        ...hierarchy.containers,
        ...(hierarchy.standalone_items ?? []),
      ],
    };
    containers.push(root);

    if (!activeItemId && hierarchy.active_item_id) {
      activeItemId = hierarchy.active_item_id;
      activeItemName = hierarchy.active_item_name;
    }
  }

  const merged: ProjectHierarchy = {
    provider: 'multi',
    project_name: entries[0]?.hierarchy.project_name ?? '',
    containers,
    active_item_id: activeItemId,
    active_item_name: activeItemName,
  };

  return { hierarchies: entries, merged, isMultiProvider: true };
}

export default function BoardExplorerModal({
  project,
  onPlanSprint,
  onSkip,
  onClose,
}: BoardExplorerModalProps) {
  const [mergedData, setMergedData] = useState<MergedHierarchy | null>(null);
  const [boardStructure, setBoardStructure] = useState<BoardStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  const providers = getProjectProviders(project);
  const providerLabel = getProviderLabel(project);
  const providerColor = getProviderColor(project);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [hResult, bsResult] = await Promise.allSettled([
          getProjectHierarchy(project.id),
          detectBoardStructure(project),
        ]);
        if (cancelled) return;

        if (hResult.status === 'fulfilled') {
          const primary = hResult.value;
          const entries = [{ provider: primary.provider, hierarchy: primary }];
          const merged = mergeHierarchies(entries);
          setMergedData(merged);
          setSelectedItemId(primary.active_item_id || null);
        }
        if (bsResult.status === 'fulfilled') {
          setBoardStructure(bsResult.value);
          if (bsResult.value?.active_sprint) {
            setSelectedSprintId(bsResult.value.active_sprint.external_id);
          }
        }

        if (hResult.status === 'rejected' && bsResult.status === 'rejected') {
          const msg = hResult.reason instanceof Error ? hResult.reason.message : 'Failed to load hierarchy';
          setError(msg);
        } else if (hResult.status === 'rejected') {
          setError(hResult.reason instanceof Error ? hResult.reason.message : 'Failed to load hierarchy');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load hierarchy');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [project]);

  const hierarchy = mergedData?.merged ?? null;

  const selectedItem = useMemo(() => {
    if (!hierarchy || !selectedItemId) return null;
    return flattenHierarchy(hierarchy).find((i) => i.id === selectedItemId) ?? null;
  }, [hierarchy, selectedItemId]);

  const activeSprintName = boardStructure?.active_sprint?.name;
  const hasContainers = (hierarchy?.containers.length ?? 0) > 0;
  const hasStandalone = (hierarchy?.standalone_items?.length ?? 0) > 0;

  function getProviderForItem(item: HierarchyItem): string | undefined {
    if (!mergedData?.isMultiProvider) return hierarchy?.provider;
    for (const entry of mergedData.hierarchies) {
      const all = flattenHierarchy(entry.hierarchy);
      if (all.some((i) => i.id === item.id)) return entry.provider;
    }
    return undefined;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Explore board"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <CalendarRange className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {providers.length > 1 ? (
                  <div className="flex items-center gap-1">
                    {providers.map((p) => (
                      <span
                        key={p}
                        className={clsx('text-[8px] font-bold text-white px-1 py-[0.5px] rounded', getProviderColorByKey(p))}
                      >
                        {getProviderLabelByKey(p)}
                      </span>
                    ))}
                  </div>
                ) : providerLabel !== 'No board' ? (
                  <span className={clsx('text-[9px] font-bold text-white px-1 py-[1px] rounded', providerColor)}>
                    {providerLabel}
                  </span>
                ) : null}
                <h2 className="text-base font-semibold text-foreground">{project.name}</h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {providers.length > 1
                  ? `Multi-provider board — ${providers.length} connections`
                  : 'Understand your board before planning'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading board hierarchy...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm font-medium text-destructive">Could not load hierarchy</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : hierarchy ? (
            <>
              {/* Left panel: hierarchy tree */}
              <div className="w-[260px] shrink-0 border-r border-border overflow-y-auto bg-secondary/30">
                <div className="px-3 py-2.5 border-b border-border/60 flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    Hierarchy
                  </p>
                  {mergedData?.isMultiProvider && (
                    <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground font-medium">
                      <Plug className="w-2.5 h-2.5" />
                      {mergedData.hierarchies.length} providers
                    </span>
                  )}
                </div>

                {hasContainers && (
                  <div className="py-1">
                    {hierarchy.containers.map((item) => {
                      const itemProvider = mergedData?.isMultiProvider
                        ? mergedData.hierarchies.find(
                            (e) => `provider-root-${e.provider}` === item.id,
                          )?.provider
                        : hierarchy.provider;
                      return (
                        <HierarchyTreeItem
                          key={item.id}
                          item={item}
                          depth={0}
                          selectedId={selectedItemId}
                          activeItemId={hierarchy.active_item_id}
                          providerKey={itemProvider}
                          onSelect={(i) => setSelectedItemId(i.id)}
                        />
                      );
                    })}
                  </div>
                )}

                {hasStandalone && (
                  <>
                    {hasContainers && (
                      <div className="mx-3 my-1 border-t border-border/40" />
                    )}
                    <div className="px-3 py-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        {hasContainers ? 'Folderless' : 'Items'}
                      </p>
                    </div>
                    <div className="py-1">
                      {hierarchy.standalone_items!.map((item) => (
                        <HierarchyTreeItem
                          key={item.id}
                          item={item}
                          depth={0}
                          selectedId={selectedItemId}
                          activeItemId={hierarchy.active_item_id}
                          providerKey={getProviderForItem(item)}
                          onSelect={(i) => setSelectedItemId(i.id)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {!hasContainers && !hasStandalone && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No hierarchy items found
                  </div>
                )}
              </div>

              {/* Right panel: board overview */}
              <BoardOverviewPanel
                hierarchy={hierarchy}
                boardStructure={boardStructure}
                selectedItem={selectedItem}
                selectedSprintId={selectedSprintId}
                onSelectSprint={setSelectedSprintId}
              />
            </>
          ) : null}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip to Plan
          </button>
          <button
            onClick={() => onPlanSprint(selectedSprintId ?? undefined)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {activeSprintName ? `Plan ${activeSprintName}` : 'Plan Sprint'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
