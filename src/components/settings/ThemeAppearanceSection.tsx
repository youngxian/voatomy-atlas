'use client';

import { Check, Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { Toggle } from './SettingsFormControls';
import { useTheme, THEME_COLORS, type Appearance } from '@/lib/theme';

const APPEARANCE_OPTIONS: { value: Appearance; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark',  label: 'Dark',  icon: Moon },
  { value: 'auto',  label: 'Auto',  icon: Monitor },
];

function AppearanceCard({ mode, isActive, onClick }: { mode: typeof APPEARANCE_OPTIONS[number]; isActive: boolean; onClick: () => void }) {
  const isDark = mode.value === 'dark';
  const isAuto = mode.value === 'auto';

  const bgBase = isDark ? '#1a1a2e' : 'var(--card)';
  const mutedBg = isDark ? '#252540' : 'var(--secondary)';
  const barBg1 = isDark ? '#3a3a5a' : 'var(--border)';
  const barBg2 = isDark ? '#2d2d4a' : 'var(--border)';
  const accentBar = 'var(--primary)';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group transition-all ${isActive ? '' : 'opacity-70 hover:opacity-100'}`}
    >
      <div
        className={`w-[140px] h-[96px] rounded-xl border-2 transition-all overflow-hidden relative ${isActive ? 'border-[var(--primary)] shadow-md' : 'border-border hover:border-muted-foreground'}`}
        style={{ background: isAuto ? `linear-gradient(135deg, #ffffff 50%, #1a1a2e 50%)` : bgBase }}
      >
        {isAuto ? (
          <>
            <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
              <div className="p-2.5 space-y-1.5">
                <div className="h-1.5 w-12 rounded-full bg-border" />
                <div className="h-1.5 w-8 rounded-full bg-border" />
                <div className="flex gap-1 mt-1.5">
                  <div className="h-3 w-5 rounded bg-secondary" />
                  <div className="h-3 w-5 rounded bg-secondary" />
                </div>
                <div className="h-1.5 w-10 rounded-full bg-primary" />
              </div>
            </div>
            <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
              <div className="p-2.5 space-y-1.5 flex flex-col items-end">
                <div className="h-1.5 w-12 rounded-full bg-[#3a3a5a]" />
                <div className="h-1.5 w-8 rounded-full bg-[#2d2d4a]" />
                <div className="flex gap-1 mt-1.5">
                  <div className="h-3 w-5 rounded bg-[#252540]" />
                  <div className="h-3 w-5 rounded bg-[#252540]" />
                </div>
                <div className="h-1.5 w-10 rounded-full bg-primary" />
              </div>
            </div>
          </>
        ) : (
          <div className="p-2.5 space-y-1.5 h-full">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-1.5 w-16 rounded-full" style={{ background: barBg1 }} />
            </div>
            <div className="h-1.5 w-12 rounded-full" style={{ background: barBg2 }} />
            <div className="flex gap-1 mt-2">
              <div className="h-4 flex-1 rounded" style={{ background: mutedBg }} />
              <div className="h-4 flex-1 rounded" style={{ background: mutedBg }} />
              <div className="h-4 flex-1 rounded" style={{ background: mutedBg }} />
            </div>
            <div className="h-1.5 w-14 rounded-full mt-2" style={{ background: accentBar }} />
          </div>
        )}

        {isActive && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--primary)] flex items-center justify-center" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{mode.label}</span>
    </button>
  );
}

export function ThemeAppearanceSection() {
  const { colorId, setColorId, appearance, setAppearance, highContrast, setHighContrast } = useTheme();

  return (
    <Card className="bento-card rounded-2xl">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Theme color</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Choose a preferred theme for the app.</p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {THEME_COLORS.map(color => {
              const active = colorId === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => setColorId(color.id)}
                  title={color.label}
                  className={`relative w-9 h-9 rounded-full transition-all shrink-0 ${active ? 'ring-2 ring-offset-2 ring-[var(--primary)]' : 'hover:scale-110'}`}
                  style={{ background: color.swatch }}
                >
                  {active && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto" style={{ animation: 'scaleIn 0.2s ease-out' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Appearance</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Choose light or dark mode, or switch your mode automatically based on your system settings.</p>
          <div className="flex items-center gap-4 mt-3">
            {APPEARANCE_OPTIONS.map(opt => (
              <AppearanceCard
                key={opt.value}
                mode={opt}
                isActive={appearance === opt.value}
                onClick={() => setAppearance(opt.value)}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border/60">
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Contrast</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Turn on and off high contrast text and borders.</p>
          <div className="mt-3">
            <Toggle
              checked={highContrast}
              onChange={() => setHighContrast(!highContrast)}
              label="High Contrast for increased accessibility"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
