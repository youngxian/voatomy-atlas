import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Detects if a string looks like an email address. */
export function looksLikeEmail(s: string): boolean {
  return typeof s === 'string' && s.includes('@') && s.includes('.');
}

/** Derive a friendly display name from an email (e.g. "john.doe" from "john.doe@example.com"). */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim() || email;
}

/** Get the user's canonical email for matching (e.g. against board members). */
export function getCanonicalEmail(user: { full_name?: string; email?: string }): string {
  const fn = (user.full_name ?? '').trim();
  const em = (user.email ?? '').trim();
  if (looksLikeEmail(em)) return em.toLowerCase();
  if (looksLikeEmail(fn)) return fn.toLowerCase();
  return em.toLowerCase() || fn.toLowerCase();
}

/** Find a team member's name by matching email (case-insensitive). */
export function getNameFromBoardByEmail(
  userEmail: string,
  teamMembers: { email?: string; name: string }[]
): string | null {
  if (!userEmail) return null;
  const lower = userEmail.toLowerCase().trim();
  const member = teamMembers.find((m) => m.email?.toLowerCase().trim() === lower);
  return member?.name ?? null;
}

/** Normalize user display values — fixes backend/DB issues where full_name and email can be swapped or name field contains email. */
export function normalizeProfileDisplay(user: { full_name?: string; email?: string }) {
  let fn = (user.full_name ?? '').trim();
  let em = (user.email ?? '').trim();
  if (looksLikeEmail(fn) && !looksLikeEmail(em)) {
    [fn, em] = [em, fn];
  }
  const rawName = fn;
  const rawEmail = looksLikeEmail(em) ? em : looksLikeEmail(fn) ? fn : '';
  const displayName = looksLikeEmail(rawName)
    ? nameFromEmail(rawName)
    : rawName || (rawEmail ? nameFromEmail(rawEmail) : '');
  const displayEmail = rawEmail;
  return { full_name: displayName, email: displayEmail };
}
