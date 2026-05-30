import type { OAuthConfig } from './types';

/**
 * Server-side credential resolution for OAuth client credentials.
 * All credentials are read exclusively from environment variables —
 * no user-provided values are accepted from the frontend.
 */

export interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Resolve client credentials for a provider from environment variables.
 * Returns null if the env vars are not set.
 */
export function getClientCredentials(
  _provider: string,
  cfg: OAuthConfig,
): ClientCredentials | null {
  const envId = process.env[cfg.clientIdEnv];
  const envSecret = process.env[cfg.clientSecretEnv];
  if (envId && envSecret) return { clientId: envId, clientSecret: envSecret };
  return null;
}
