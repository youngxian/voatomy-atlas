import type { Project, ProviderConnection } from './api';

export const PROVIDER_LABELS: Record<string, string> = {
  jira: 'Jira',
  linear: 'Linear',
  clickup: 'ClickUp',
  asana: 'Asana',
  monday: 'Monday',
  github_projects: 'GitHub Projects',
  azuredevops: 'Azure DevOps',
  shortcut: 'Shortcut',
};

export const PROVIDER_COLORS: Record<string, string> = {
  jira: 'bg-[#2684FF]',
  linear: 'bg-[#5E6AD2]',
  clickup: 'bg-[#7B68EE]',
  asana: 'bg-[#F06A6A]',
  monday: 'bg-[#FF3D57]',
  github_projects: 'bg-[#181717]',
  azuredevops: 'bg-[#0078D7]',
  shortcut: 'bg-[#58B1E4]',
};

/**
 * Returns the primary provider for a project.
 * Prefers the explicit `provider` field, then active connections, then legacy fields.
 */
export function getProjectProvider(p: Project | null | undefined): string | null {
  if (!p) return null;
  if (p.provider) return p.provider;
  const conn = p.connections?.find(c => c.sync_enabled);
  if (conn) return conn.provider;
  // Legacy field fallback
  if (p.jira_project_key) return 'jira';
  if (p.linear_team_id) return 'linear';
  if (p.clickup_list_id || p.clickup_space_id) return 'clickup';
  return null;
}

/** Returns all distinct providers across a project's active connections. */
export function getProjectProviders(p: Project | null | undefined): string[] {
  if (!p?.connections?.length) {
    const single = getProjectProvider(p);
    return single ? [single] : [];
  }
  const active = p.connections.filter(c => c.sync_enabled).map(c => c.provider);
  return [...new Set(active.length ? active : [getProjectProvider(p)].filter(Boolean) as string[])];
}

/** Returns all active connections for a project. */
export function getActiveConnections(p: Project | null | undefined): ProviderConnection[] {
  return p?.connections?.filter(c => c.sync_enabled) ?? [];
}

export function getProviderLabel(p: Project | null | undefined): string {
  const prov = getProjectProvider(p);
  return prov ? (PROVIDER_LABELS[prov] ?? prov) : 'No board';
}

export function getProviderColor(p: Project | null | undefined): string {
  const prov = getProjectProvider(p);
  return prov ? (PROVIDER_COLORS[prov] ?? 'bg-gray-500') : '';
}

export function getProviderLabelByKey(key: string): string {
  return PROVIDER_LABELS[key] ?? key;
}

export function getProviderColorByKey(key: string): string {
  return PROVIDER_COLORS[key] ?? 'bg-gray-500';
}

export function getExternalProjectId(p: Project): string | null {
  if (p.connections?.length) {
    const conn = p.connections.find(c => c.sync_enabled);
    if (conn) return conn.external_project_id;
  }
  return p.jira_project_key ?? p.linear_team_id ?? p.clickup_space_id ?? p.clickup_list_id ?? null;
}

/** @deprecated Use {@link getProjectProvider} with direct comparison instead. */
export function isClickUp(p: Project | null | undefined): boolean {
  return getProjectProvider(p) === 'clickup';
}

/** Provider-specific term for timeboxed work. */
const SPRINT_TERMS: Record<string, string> = {
  jira: 'Sprint',
  clickup: 'Sprint',
  asana: 'Sprint',
  monday: 'Sprint',
  linear: 'Cycle',
  azuredevops: 'Iteration',
  github_projects: 'Iteration',
  shortcut: 'Iteration',
};

/**
 * Returns the provider-appropriate term for a sprint/cycle/iteration.
 * Jira, ClickUp, Asana, Monday: "Sprint"
 * Linear: "Cycle"
 * Azure DevOps, GitHub Projects, Shortcut: "Iteration"
 */
export function getSprintTerm(p: Project | null | undefined): string {
  const prov = getProjectProvider(p);
  return prov ? (SPRINT_TERMS[prov] ?? 'Sprint') : 'Sprint';
}
