'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { updateSettings, getSettings } from './api';

// ─── Color palette ──────────────────────────────────────────────────────────

export interface ThemeColor {
  id: string;
  label: string;
  swatch: string;
  primary: string;
  ring: string;
  accent: string;
  accentForeground: string;
  glowRgb: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { id: 'gray',    label: 'Graphite',  swatch: '#374151', primary: '#374151', ring: '#9ca3af', accent: '#f3f4f6', accentForeground: '#1f2937', glowRgb: '55,65,81'    },
  { id: 'teal',    label: 'Teal',      swatch: '#14b8a6', primary: '#14b8a6', ring: '#5eead4', accent: '#ccfbf1', accentForeground: '#0f766e', glowRgb: '20,184,166'  },
  { id: 'blue',    label: 'Blue',      swatch: '#3b82f6', primary: '#3b82f6', ring: '#93c5fd', accent: '#dbeafe', accentForeground: '#1d4ed8', glowRgb: '59,130,246'  },
  { id: 'green',   label: 'Green',     swatch: '#22C55E', primary: '#22C55E', ring: '#86EFAC', accent: '#DCFCE7', accentForeground: '#166534', glowRgb: '34,197,94'   },
  { id: 'rose',    label: 'Rose',      swatch: '#f43f5e', primary: '#f43f5e', ring: '#fda4af', accent: '#ffe4e6', accentForeground: '#be123c', glowRgb: '244,63,94'   },
  { id: 'purple',  label: 'Purple',    swatch: '#a855f7', primary: '#a855f7', ring: '#d8b4fe', accent: '#f3e8ff', accentForeground: '#7e22ce', glowRgb: '168,85,247'  },
  { id: 'violet',  label: 'Violet',    swatch: '#8b5cf6', primary: '#8b5cf6', ring: '#c4b5fd', accent: '#ede9fe', accentForeground: '#5b21b6', glowRgb: '139,92,246'  },
  { id: 'orange',  label: 'Orange',    swatch: '#f97316', primary: '#f97316', ring: '#fdba74', accent: '#ffedd5', accentForeground: '#c2410c', glowRgb: '249,115,22'  },
  { id: 'cyan',    label: 'Cyan',      swatch: '#06b6d4', primary: '#06b6d4', ring: '#67e8f9', accent: '#cffafe', accentForeground: '#0e7490', glowRgb: '6,182,212'   },
];

export type Appearance = 'light' | 'dark' | 'auto';

// ─── Persistence key ────────────────────────────────────────────────────────

const STORAGE_KEY = 'voatomy_theme';

interface StoredTheme {
  colorId: string;
  appearance: Appearance;
  highContrast: boolean;
}

function normalizeColorId(id: string): string {
  return id === 'indigo' ? 'green' : id;
}

function readStored(): StoredTheme {
  if (typeof window === 'undefined') return { colorId: 'green', appearance: 'light', highContrast: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { colorId: 'green', appearance: 'light', highContrast: false };
    const parsed = JSON.parse(raw) as Partial<StoredTheme>;
    return {
      appearance: 'light',
      highContrast: false,
      ...parsed,
      colorId: normalizeColorId(parsed.colorId ?? 'green'),
    };
  } catch {
    return { colorId: 'green', appearance: 'light', highContrast: false };
  }
}

function writeStored(t: StoredTheme) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

// ─── Apply to DOM ───────────────────────────────────────────────────────────

function resolveAppearance(appearance: Appearance): 'light' | 'dark' {
  if (appearance !== 'auto') return appearance;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(color: ThemeColor, appearance: Appearance, highContrast: boolean) {
  const root = document.documentElement;
  const resolved = resolveAppearance(appearance);
  const softAlpha = resolved === 'dark' ? '0.2' : '0.12';
  const softStrongAlpha = resolved === 'dark' ? '0.3' : '0.2';
  const accentSoftAlpha = resolved === 'dark' ? '0.18' : '0.1';
  const accentStrongAlpha = resolved === 'dark' ? '0.28' : '0.18';
  const borderSoftMix = resolved === 'dark' ? '70%' : '84%';
  const borderStrongMix = resolved === 'dark' ? '56%' : '70%';
  const focusRingAlpha = resolved === 'dark' ? '0.52' : '0.36';
  const accentSoft = `rgba(${color.glowRgb}, ${accentSoftAlpha})`;
  const accentStrong = `rgba(${color.glowRgb}, ${accentStrongAlpha})`;

  root.style.setProperty('--primary', color.primary);
  root.style.setProperty('--ring', color.ring);
  root.style.setProperty('--info', color.primary);
  root.style.setProperty('--primary-soft', `rgba(${color.glowRgb}, ${softAlpha})`);
  root.style.setProperty('--primary-soft-strong', `rgba(${color.glowRgb}, ${softStrongAlpha})`);
  root.style.setProperty('--dashboard-accent-soft', accentSoft);
  root.style.setProperty('--dashboard-accent-strong', accentStrong);
  root.style.setProperty('--dashboard-border-soft', `color-mix(in srgb, var(--border) ${borderSoftMix}, ${accentSoft})`);
  root.style.setProperty('--dashboard-border-strong', `color-mix(in srgb, var(--border) ${borderStrongMix}, ${accentStrong})`);
  root.style.setProperty('--focus-ring', `rgba(${color.glowRgb}, ${focusRingAlpha})`);

  if (resolved === 'light') {
    root.style.setProperty('--accent', color.accent);
    root.style.setProperty('--accent-foreground', color.accentForeground);
  } else {
    root.style.setProperty('--accent', color.accentForeground);
    root.style.setProperty('--accent-foreground', '#ffffff');
  }

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colorId: string;
  appearance: Appearance;
  highContrast: boolean;
  resolvedAppearance: 'light' | 'dark';
  themeColor: ThemeColor;
  setColorId: (id: string) => void;
  setAppearance: (a: Appearance) => void;
  setHighContrast: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorId, setColorIdRaw] = useState<string>('green');
  const [appearance, setAppearanceRaw] = useState<Appearance>('light');
  const [highContrast, setHighContrastRaw] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const themeColor = useMemo(
    () => THEME_COLORS.find(c => c.id === colorId) ?? THEME_COLORS[3],
    [colorId],
  );

  const resolvedAppearance = useMemo(
    () => (hydrated ? resolveAppearance(appearance) : 'light'),
    [appearance, hydrated],
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStored();
    setColorIdRaw(stored.colorId);
    setAppearanceRaw(stored.appearance);
    setHighContrastRaw(stored.highContrast);
    setHydrated(true);

    // Also try to fetch from backend
    getSettings('theme')
      .then(resp => {
        const s = resp?.settings as Record<string, unknown> | undefined;
        if (s?.colorId && typeof s.colorId === 'string') {
          const nextId = normalizeColorId(s.colorId);
          setColorIdRaw(nextId);
          setAppearanceRaw((s.appearance as Appearance) ?? 'light');
          setHighContrastRaw(!!s.highContrast);
          writeStored({
            colorId: nextId,
            appearance: (s.appearance as Appearance) ?? 'light',
            highContrast: !!s.highContrast,
          });
        }
      })
      .catch(() => { /* fallback to localStorage */ });
  }, []);

  // Apply DOM changes whenever values change
  useEffect(() => {
    if (!hydrated) return;
    const color = THEME_COLORS.find(c => c.id === colorId) ?? THEME_COLORS[3];
    applyThemeToDOM(color, appearance, highContrast);
  }, [colorId, appearance, highContrast, hydrated]);

  // Listen for system color scheme changes when appearance === 'auto'
  useEffect(() => {
    if (appearance !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const color = THEME_COLORS.find(c => c.id === colorId) ?? THEME_COLORS[3];
      applyThemeToDOM(color, 'auto', highContrast);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [appearance, colorId, highContrast]);

  const persist = useCallback((next: StoredTheme) => {
    writeStored(next);
    updateSettings('theme', next as unknown as Record<string, unknown>).catch(() => { /* ignore backend errors */ });
  }, []);

  const setColorId = useCallback((id: string) => {
    setColorIdRaw(id);
    const next = { colorId: id, appearance, highContrast };
    persist(next);
  }, [appearance, highContrast, persist]);

  const setAppearance = useCallback((a: Appearance) => {
    setAppearanceRaw(a);
    const next = { colorId, appearance: a, highContrast };
    persist(next);
  }, [colorId, highContrast, persist]);

  const setHighContrast = useCallback((v: boolean) => {
    setHighContrastRaw(v);
    const next = { colorId, appearance, highContrast: v };
    persist(next);
  }, [colorId, appearance, persist]);

  const value = useMemo<ThemeContextValue>(() => ({
    colorId,
    appearance,
    highContrast,
    resolvedAppearance,
    themeColor,
    setColorId,
    setAppearance,
    setHighContrast,
  }), [colorId, appearance, highContrast, resolvedAppearance, themeColor, setColorId, setAppearance, setHighContrast]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
