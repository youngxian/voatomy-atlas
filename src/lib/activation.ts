import { config } from './config';

export type ActivationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type ProductKey = 'atlas' | 'loop' | 'signal' | 'drift' | 'phantom' | 'nexus';

export interface ProductActivation {
  id: string;
  user_id: string;
  org_id: string;
  product_key: ProductKey;
  status: ActivationStatus;
  current_step: string;
  form_data: Record<string, unknown>;
  version: number;
}

function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )session=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function activationFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiBase}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getCookieToken() ? { Authorization: `Bearer ${getCookieToken()}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? res.statusText);
  }
  const json = await res.json();
  return json.data ?? json;
}

export function isActivationDone(status?: ActivationStatus): boolean {
  return status === 'completed' || status === 'skipped';
}

export function getActivation(product: ProductKey): Promise<ProductActivation> {
  return activationFetch<ProductActivation>(`/v1/activation/${product}`);
}

export function saveActivationStep(
  product: ProductKey,
  step: string,
  data: Record<string, unknown>,
  version: number,
): Promise<ProductActivation> {
  return activationFetch<ProductActivation>(`/v1/activation/${product}/steps/${step}`, {
    method: 'PUT',
    body: JSON.stringify({ data, version }),
  });
}

export function completeActivation(product: ProductKey, version?: number): Promise<ProductActivation> {
  return activationFetch<ProductActivation>(`/v1/activation/${product}/complete`, {
    method: 'POST',
    body: JSON.stringify({ version: version ?? 0 }),
  });
}

export function skipActivation(product: ProductKey, version?: number): Promise<ProductActivation> {
  return activationFetch<ProductActivation>(`/v1/activation/${product}/skip`, {
    method: 'POST',
    body: JSON.stringify({ version: version ?? 0 }),
  });
}

/** One-time migration from localStorage gate to backend activation. */
export async function migrateLegacySetupComplete(product: ProductKey): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('voatomy_setup_complete') !== 'true') return;
  try {
    await completeActivation(product);
    localStorage.removeItem('voatomy_setup_complete');
  } catch {
    /* best-effort */
  }
}

export function countCompletedActivations(
  activations: Record<string, ActivationStatus> | undefined,
): number {
  if (!activations) return 0;
  return Object.values(activations).filter((s) => s === 'completed').length;
}

export function shouldOfferNexusActivation(
  activations: Record<string, ActivationStatus> | undefined,
): boolean {
  if (!activations) return false;
  const nexusStatus = activations.nexus;
  if (isActivationDone(nexusStatus)) return false;
  const completed = countCompletedActivations(activations);
  return completed >= 2;
}
