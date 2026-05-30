import { config } from '@/lib/config';

const API_BASE = config.atlasApiBase;

export interface DataRetentionSettings {
  retention_days: number;
  min_retention_days: number;
  configured_at: string | null;
  needs_prompt: boolean;
  oldest_stale_date: string | null;
  stale_count: number;
}

export async function getDataRetention(orgId: string): Promise<DataRetentionSettings> {
  const res = await fetch(`${API_BASE}/v1/orgs/${orgId}/data-retention`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to fetch data retention settings: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function updateDataRetention(
  orgId: string,
  retentionDays: number,
): Promise<DataRetentionSettings> {
  const res = await fetch(`${API_BASE}/v1/orgs/${orgId}/data-retention`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ retention_days: retentionDays }),
  });
  if (!res.ok) throw new Error(`Failed to update data retention: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function dismissRetentionPrompt(orgId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/orgs/${orgId}/data-retention/dismiss`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to dismiss retention prompt: ${res.status}`);
}
