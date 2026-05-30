/** Strip accidental `/v1` suffix so callers can use `/v1/me` paths without doubling. */
function normalizeApiHost(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:8081").trim().replace(/\/+$/, "");
  return base.replace(/\/v1$/i, "");
}

const API_URL = normalizeApiHost(process.env.NEXT_PUBLIC_API_URL);

const getAtlasUrl = () =>
  (typeof window !== "undefined" ? window.location.origin : null) ?? process.env.NEXT_PUBLIC_ATLAS_APP_URL ?? "http://localhost:3000";

/** Env is often set to "" in CI/dashboards — `??` does not fall back for empty string. */
function envProductBase(raw: string | undefined, fallback: string): string {
  const t = (raw ?? "").trim();
  if (!t || t === "#") return fallback;
  return t.replace(/\/+$/, "");
}

export const config = {
  apiBase: API_URL,
  publicApi: API_URL.replace("/v1", "") + "/public",
  atlasApiBase: process.env.NEXT_PUBLIC_ATLAS_SERVICE_URL ?? "http://localhost:8082",
  signalApiBase: process.env.NEXT_PUBLIC_SIGNAL_SERVICE_URL ?? "http://localhost:8080",
  /** Auth / marketing site — not the LOOP app (use NEXT_PUBLIC_LOOP_APP_URL for LOOP). */
  landingUrl:
    process.env.NEXT_PUBLIC_LANDING_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://voatomy.com"),
  /** Product dashboard URLs for the product switcher (Atlas ↔ LOOP ↔ Signal). */
  productUrls: {
    atlas: getAtlasUrl(),
    loop: envProductBase(process.env.NEXT_PUBLIC_LOOP_APP_URL, "http://localhost:3001"),
    signal: envProductBase(process.env.NEXT_PUBLIC_SIGNAL_APP_URL, "http://localhost:3002"),
    phantom: envProductBase(process.env.NEXT_PUBLIC_PHANTOM_APP_URL, "#"),
    nexus: envProductBase(process.env.NEXT_PUBLIC_NEXUS_APP_URL, "#"),
  },
} as const;

/** Absolute URL to another Voatomy app’s dashboard (no double slashes). */
export function productDashboardUrl(base: string): string {
  const b = base.trim().replace(/\/+$/, "");
  if (!b || b === "#") return "#";
  return `${b}/dashboard`;
}
