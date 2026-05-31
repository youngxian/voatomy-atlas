'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { getMe, updateMe, type MeResponse } from './api';
import { config } from './config';

type AuthError = { kind: 'unauthorized' } | { kind: 'transient'; message: string };

const DEMO_DURATION_MS = 2 * 60 * 1000;
const DEMO_COOKIE_MAX_AGE = DEMO_DURATION_MS / 1000;

function setDemoCookie(): void {
  document.cookie = `atlas_demo=1; path=/; max-age=${DEMO_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearDemoCookie(): void {
  document.cookie = 'atlas_demo=; path=/; max-age=0';
}

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  error: AuthError | null;
  isDemo: boolean;
  demoSecondsLeft: number | null;
  refreshUser: () => Promise<void>;
  updateProfile: (input: { full_name?: string; timezone?: string; org_name?: string }) => Promise<MeResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

const DEMO_USER: MeResponse = {
  id: 'demo-user',
  org_id: 'demo-org',
  email: 'demo@atlas.dev',
  full_name: 'Demo User',
  role: 'admin',
  org_name: 'ATLAS Demo',
  onboarding_completed: true,
};

function isDemoSession(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === 'true') {
    sessionStorage.setItem('atlas_demo', 'true');
    setDemoCookie();
    return true;
  }
  return sessionStorage.getItem('atlas_demo') === 'true';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoSecondsLeft, setDemoSecondsLeft] = useState<number | null>(null);
  const retryCount = useRef(0);
  const demoStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isDemoSession()) {
      const storedStart = sessionStorage.getItem('atlas_demo_start');
      const start = storedStart ? Number(storedStart) : Date.now();
      if (!storedStart) sessionStorage.setItem('atlas_demo_start', String(start));
      demoStartRef.current = start;

      const elapsed = Date.now() - start;
      if (elapsed >= DEMO_DURATION_MS) {
        sessionStorage.removeItem('atlas_demo');
        sessionStorage.removeItem('atlas_demo_start');
        clearDemoCookie();
        window.location.href = `${config.landingUrl}/auth/login?from=demo`;
        return;
      }

      setUser(DEMO_USER);
      setIsDemo(true);
      setDemoSecondsLeft(Math.ceil((DEMO_DURATION_MS - elapsed) / 1000));
      setLoading(false);
      return;
    }

    let ignore = false;

    async function fetchUser() {
      try {
        const me = await getMe();
        if (ignore) return;
        setUser(me);
        setError(null);
        retryCount.current = 0;

        // Auto-set timezone for new users (no timezone stored yet) — silently, no prompt
        const storedTz = me.timezone?.trim();
        if (!storedTz && typeof window !== 'undefined') {
          try {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (detected) {
              const updated = await updateMe({ timezone: detected });
              if (!ignore) setUser(updated);
            }
          } catch {
            // Silently ignore — user can set manually in profile
          }
        }
      } catch (err: unknown) {
        if (ignore) return;
        const status = (err as { status?: number })?.status;

        if (status === 401 || status === 403) {
          setUser(null);
          setError({ kind: 'unauthorized' });
        } else if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          if (!ignore) return fetchUser();
        } else {
          setUser(null);
          setError({ kind: 'transient', message: 'Failed to load user' });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchUser();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!isDemo || demoStartRef.current === null) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - demoStartRef.current!;
      const remaining = Math.ceil((DEMO_DURATION_MS - elapsed) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        sessionStorage.removeItem('atlas_demo');
        sessionStorage.removeItem('atlas_demo_start');
        clearDemoCookie();
        window.location.href = `${config.landingUrl}/auth/login?from=demo`;
        return;
      }
      setDemoSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [isDemo]);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
    setError(null);
  }, []);

  const handleUpdateProfile = useCallback(async (input: { full_name?: string; timezone?: string; org_name?: string }) => {
    const updated = await updateMe(input);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('atlas_demo');
    sessionStorage.removeItem('atlas_demo_start');
    clearDemoCookie();
    if (isDemo) {
      window.location.href = `${config.landingUrl}/auth/login?from=demo`;
      return;
    }
    fetch(`${config.publicApi}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).finally(() => {
      document.cookie = 'session=; path=/; max-age=0';
      window.location.href = `${config.landingUrl}/auth/login`;
    });
  }, [isDemo]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemo, demoSecondsLeft, refreshUser, updateProfile: handleUpdateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
