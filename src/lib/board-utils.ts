import type { Project, Sprint, BoardStructure, HierarchyItem, ProjectHierarchy } from './api';
import { getBoardStructure } from './api';
import { getProjectProvider, getExternalProjectId } from './project-utils';
import {
  Folder,
  List,
  LayoutGrid,
  Users,
  Columns,
  Layers,
  type LucideIcon,
} from 'lucide-react';

/**
 * Detects the board structure for any provider by fetching sprint, ticket, and
 * team metadata from the universal board-structure endpoint. Returns null when
 * the project has no configured provider or external project ID.
 */
export async function detectBoardStructure(
  project: Project,
): Promise<BoardStructure | null> {
  const provider = getProjectProvider(project);
  const extId = getExternalProjectId(project);
  if (!provider || !extId) return null;

  const extBoardId =
    project.connections?.find(c => c.sync_enabled)?.external_board_id ?? undefined;

  return getBoardStructure(provider, extId, project.org_id, extBoardId);
}

export function hasSprintSupport(
  structure: BoardStructure | null | undefined,
): boolean {
  return structure?.has_sprints === true;
}

/**
 * Deduplicates sprints by external_id or by name+date combination.
 * Keeps first occurrence when duplicates exist.
 */
export function deduplicateSprints(sprints: Sprint[]): Sprint[] {
  const seen = new Set<string>();
  const result: Sprint[] = [];
  for (const s of sprints) {
    const key = s.external_id ?? `${s.name}|${s.start_date ?? ''}|${s.end_date ?? ''}`;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push(s);
  }
  return result;
}

// ── Sprint Cycle Detection ──────────────────────────────────────────────────

export type CycleType = '1-week' | '2-week' | '3-week' | '4-week' | 'custom' | 'unknown';

export interface SprintCycleInfo {
  /** Detected cycle type based on median duration. */
  cycleType: CycleType;
  /** Friendly label, e.g. "2-week sprints". */
  label: string;
  /** Median sprint duration in calendar days across completed/active sprints. */
  medianDurationDays: number;
  /** Average gap in days between consecutive sprint end→start. */
  avgGapDays: number;
  /** True when >70% of sprints share the same duration (±2 days). */
  isConsistent: boolean;
  /** Configured duration from the project, if available. */
  configuredDays: number | null;
  /** Whether the detected cycle matches the project config (within ±2 days). */
  matchesConfig: boolean;
  /** Number of sprints analysed. */
  sprintCount: number;
  /** Individual durations (days) for each analysed sprint. */
  durations: number[];
}

const CYCLE_THRESHOLDS: { max: number; type: CycleType; label: string }[] = [
  { max: 9,  type: '1-week',  label: '1-week sprints' },
  { max: 16, type: '2-week',  label: '2-week sprints' },
  { max: 23, type: '3-week',  label: '3-week sprints' },
  { max: 30, type: '4-week',  label: '4-week sprints' },
];

function classifyCycle(medianDays: number): { type: CycleType; label: string } {
  for (const t of CYCLE_THRESHOLDS) {
    if (medianDays <= t.max) return { type: t.type, label: t.label };
  }
  return { type: 'custom', label: `~${Math.round(medianDays)}-day sprints` };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

/**
 * Analyses a list of sprints and detects the cadence / cycle pattern.
 * Only sprints with both start_date and end_date are considered.
 * Optionally pass the project to compare against `sprint_duration_days`.
 */
export function detectSprintCycle(
  sprints: Sprint[],
  project?: Pick<Project, 'sprint_duration_days'> | null,
): SprintCycleInfo {
  const datedSprints = sprints
    .filter((s) => s.start_date && s.end_date && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

  if (datedSprints.length === 0) {
    return {
      cycleType: 'unknown',
      label: 'No cycle detected',
      medianDurationDays: 0,
      avgGapDays: 0,
      isConsistent: false,
      configuredDays: project?.sprint_duration_days ?? null,
      matchesConfig: false,
      sprintCount: 0,
      durations: [],
    };
  }

  const durations = datedSprints.map((s) => daysBetween(s.start_date!, s.end_date!));
  const medianDays = median(durations);
  const { type: cycleType, label } = classifyCycle(medianDays);

  // Consistency: >70% of sprints within ±2 days of the median
  const withinTolerance = durations.filter((d) => Math.abs(d - medianDays) <= 2).length;
  const isConsistent = durations.length >= 2 && withinTolerance / durations.length > 0.7;

  // Average gap between consecutive sprints
  const gaps: number[] = [];
  for (let i = 1; i < datedSprints.length; i++) {
    const prevEnd = datedSprints[i - 1].end_date!;
    const nextStart = datedSprints[i].start_date!;
    gaps.push(daysBetween(prevEnd, nextStart));
  }
  const avgGapDays = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length
    : 0;

  const configuredDays = project?.sprint_duration_days ?? null;
  const matchesConfig = configuredDays != null && Math.abs(medianDays - configuredDays) <= 2;

  return {
    cycleType,
    label,
    medianDurationDays: Math.round(medianDays * 10) / 10,
    avgGapDays: Math.round(avgGapDays * 10) / 10,
    isConsistent,
    configuredDays,
    matchesConfig,
    sprintCount: datedSprints.length,
    durations: durations.map((d) => Math.round(d * 10) / 10),
  };
}

/**
 * Short human-readable badge text for the cycle, e.g. "2wk" or "~18d".
 */
export function cycleShortLabel(info: SprintCycleInfo): string {
  if (info.cycleType === 'unknown') return '';
  if (info.cycleType === '1-week') return '1wk';
  if (info.cycleType === '2-week') return '2wk';
  if (info.cycleType === '3-week') return '3wk';
  if (info.cycleType === '4-week') return '4wk';
  return `~${Math.round(info.medianDurationDays)}d`;
}

// ── Hierarchy Helpers (Board Explorer) ──────────────────────────────────────

const HIERARCHY_TYPE_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  list: List,
  board: LayoutGrid,
  team: Users,
  group: Columns,
  section: Layers,
};

const HIERARCHY_TYPE_LABELS: Record<string, string> = {
  folder: 'Folder',
  list: 'List',
  board: 'Board',
  team: 'Team',
  group: 'Group',
  section: 'Section',
};

export function getHierarchyTypeIcon(type: string): LucideIcon {
  return HIERARCHY_TYPE_ICONS[type] ?? List;
}

export function getHierarchyTypeLabel(type: string): string {
  return HIERARCHY_TYPE_LABELS[type] ?? type;
}

export function flattenHierarchy(hierarchy: ProjectHierarchy): HierarchyItem[] {
  const items: HierarchyItem[] = [];
  function walk(list: HierarchyItem[]) {
    for (const item of list) {
      items.push(item);
      if (item.children?.length) walk(item.children);
    }
  }
  walk(hierarchy.containers);
  if (hierarchy.standalone_items) walk(hierarchy.standalone_items);
  return items;
}

export function findActiveItem(hierarchy: ProjectHierarchy): HierarchyItem | undefined {
  return flattenHierarchy(hierarchy).find((i) => i.is_active);
}
