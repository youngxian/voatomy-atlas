import { config } from "./config";

/** Redirect to the landing auth flow, preserving the current app path for post-login return. */
export function redirectToLogin(returnTo?: string): void {
  if (typeof window === "undefined") return;

  const path =
    returnTo ?? `${window.location.pathname}${window.location.search}`;
  window.location.href = `${config.landingUrl}/auth/login?redirect=${encodeURIComponent(path)}`;
}
