import type { Sprint, SprintPlan } from './api';

/**
 * Returns the active sprint name from context or plan, with a fallback.
 */
export function getSprintName(
  activeSprint?: Sprint | null,
  planMeta?: SprintPlan | null,
): string {
  return activeSprint?.name ?? planMeta?.sprint?.name ?? 'Current Sprint';
}

/**
 * Formats a sprint start date for display (e.g. "Mon, Feb 24, 2025").
 */
export function formatSprintDate(sprint?: Sprint | null): string {
  const raw = sprint?.start_date;
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
}
