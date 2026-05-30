import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { GitProvider, OAuthTokens } from './types';

/**
 * Server-side encrypted cookie storage for OAuth tokens.
 * Tokens are AES-256-GCM encrypted so they're safe in HTTP-only cookies.
 * 
 * Requires env var: GIT_TOKEN_SECRET (32-char hex key, generate with `openssl rand -hex 16`)
 * If not set, falls back to a deterministic key derived from NODE_ENV (dev only).
 */

const ALGO = 'aes-256-gcm';
const COOKIE_PREFIX = 'git_token_';

function getEncryptionKey(): Buffer {
  const secret = process.env.GIT_TOKEN_SECRET;
  if (secret) return Buffer.from(secret, 'hex').subarray(0, 32);
  // Dev fallback — NOT safe for production
  return crypto.createHash('sha256').update('atlas-dev-git-token-key').digest();
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), encrypted.toString('hex'), tag.toString('hex')].join('.');
}

function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encHex, tagHex] = ciphertext.split('.');
  if (!ivHex || !encHex || !tagHex) throw new Error('Malformed token');
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(encHex, 'hex', 'utf8') + decipher.final('utf8');
}

function cookieName(provider: GitProvider): string {
  return `${COOKIE_PREFIX}${provider}`;
}

export async function storeTokens(provider: GitProvider, tokens: OAuthTokens): Promise<void> {
  const jar = await cookies();
  const payload = JSON.stringify({ ...tokens, stored_at: Date.now() });
  jar.set(cookieName(provider), encrypt(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getTokens(provider: GitProvider): Promise<(OAuthTokens & { stored_at: number }) | null> {
  const jar = await cookies();
  const raw = jar.get(cookieName(provider))?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decrypt(raw));
  } catch {
    return null;
  }
}

export async function clearTokens(provider: GitProvider): Promise<void> {
  const jar = await cookies();
  jar.delete(cookieName(provider));
}

export async function hasTokens(provider: GitProvider): Promise<boolean> {
  const tokens = await getTokens(provider);
  return !!tokens?.access_token;
}

/**
 * Refresh a Bitbucket or GitLab token if it has a refresh_token.
 * GitHub OAuth app tokens don't expire, so this is a no-op for GitHub.
 */
export async function refreshIfNeeded(
  provider: GitProvider,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const tokens = await getTokens(provider);
  if (!tokens) return null;

  // GitHub tokens don't expire
  if (provider === 'github') return tokens.access_token;

  // Check if token is expired (with 5-min buffer)
  if (tokens.expires_in && tokens.stored_at) {
    const expiresAt = tokens.stored_at + tokens.expires_in * 1000;
    if (Date.now() < expiresAt - 5 * 60 * 1000) {
      return tokens.access_token;
    }
  }

  // Try refresh
  if (!tokens.refresh_token) return tokens.access_token;

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });

    if (!res.ok) return tokens.access_token; // fall back to existing token

    const newTokens: OAuthTokens = await res.json();
    await storeTokens(provider, newTokens);
    return newTokens.access_token;
  } catch {
    return tokens.access_token;
  }
}
