'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'voatomy_dashboard_prefs';

export interface DashboardPrefs {
  theme: 'light' | 'dark' | 'auto';
  sprintCadence: string;
  notifications: { email: boolean; slack: boolean; inApp: boolean; frequency: string };
  aiMode: { mode: string; autoSuggest: boolean; autoAssign: boolean };
}

export const DEFAULT_PREFS: DashboardPrefs = {
  theme: 'light',
  sprintCadence: '2-week',
  notifications: { email: true, slack: false, inApp: true, frequency: 'daily' },
  aiMode: { mode: 'balanced', autoSuggest: true, autoAssign: false },
};

function readPrefs(): DashboardPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: DashboardPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useDashboardPrefs() {
  const [prefs, setPrefsState] = useState<DashboardPrefs>(readPrefs);

  const setPrefs = useCallback((next: DashboardPrefs) => {
    writePrefs(next);
    setPrefsState(next);
  }, []);

  const updatePrefs = useCallback((partial: Partial<DashboardPrefs>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...partial };
      writePrefs(merged);
      return merged;
    });
  }, []);

  return { prefs, setPrefs, updatePrefs } as const;
}
