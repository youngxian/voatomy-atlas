import { config } from './config';

const LANDING_ONBOARDING_PREFIXES = ['/onboard', '/onboarding'];

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )session=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isLandingOnboardingPath(path: string): boolean {
  return LANDING_ONBOARDING_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Redirect authenticated users who have not finished /onboard back to the landing onboarding flow. */
export function redirectToOnboarding(): void {
  const token = getSessionToken();
  const next = encodeURIComponent('/onboard');
  if (token) {
    window.location.href = `${config.landingUrl}/auth/session?token=${encodeURIComponent(token)}&next=${next}`;
    return;
  }
  window.location.href = `${config.landingUrl}/auth/login?redirect=${next}`;
}

export function isOnboardingComplete(user: { onboarding_completed?: boolean } | null): boolean {
  return user?.onboarding_completed === true;
}
