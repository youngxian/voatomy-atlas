"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { config } from "@/lib/config";
import { isLandingOnboardingPath } from "@/lib/onboarding-gate";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function onboardingApiOrigin(): string {
  return config.apiBase
    .trim()
    .replace(/\/v1(\/public)?\/?$/i, "")
    .replace(/\/public\/?$/i, "")
    .replace(/\/$/, "");
}

async function fetchOnboardingCompleted(sessionToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${onboardingApiOrigin()}/v1/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json.data ?? json;
    return data.onboarding_completed === true;
  } catch {
    return false;
  }
}

function AuthSessionInner() {
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const token = searchParams.get("token")?.trim();
      const next = searchParams.get("next")?.trim() || "/dashboard";

      if (!token) {
        setErrorMsg("No sign-in token was provided.");
        return;
      }

      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      document.cookie = `session=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`;

      const onboardingComplete = await fetchOnboardingCompleted(token);
      if (cancelled) return;

      if (!onboardingComplete && !isLandingOnboardingPath(safeNext)) {
        window.location.replace(
          `${config.landingUrl}/auth/session?token=${encodeURIComponent(token)}&next=${encodeURIComponent("/onboard")}`,
        );
        return;
      }

      window.location.replace(safeNext);
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-foreground">Sign-in failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
          <a
            href={`${config.landingUrl}/auth/login`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-5 text-sm font-medium text-primary-foreground"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}

export default function AuthSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      }
    >
      <AuthSessionInner />
    </Suspense>
  );
}
