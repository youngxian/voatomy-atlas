'use client';

import Link from 'next/link';
import { Trophy, Users, Target, ClipboardList, BarChart3, CheckCircle } from 'lucide-react';

const TILES = [
  {
    id: 'leaderboard',
    title: 'Top Performers',
    desc: 'Accuracy and delivery leaderboard',
    icon: Trophy,
    href: null,
    active: true,
    theme: 'amber',
  },
  {
    id: 'lineup',
    title: 'Sprint Formation',
    desc: 'Team capacity and ticket allocation',
    icon: Target,
    href: null,
    active: true,
    theme: 'emerald',
  },
  {
    id: 'report',
    title: 'Squad Report',
    desc: 'Performance metrics over time',
    icon: BarChart3,
    href: null,
    active: false,
    theme: 'sky',
  },
  {
    id: 'strategy',
    title: 'Sprint Strategy',
    desc: 'Tactical lineup and load balance',
    icon: ClipboardList,
    href: null,
    active: true,
    theme: 'violet',
  },
  {
    id: 'team-sheets',
    title: 'Team Sheets',
    desc: 'Assignments and commitments',
    icon: ClipboardList,
    href: null,
    active: false,
    theme: 'indigo',
  },
  {
    id: 'milestones',
    title: 'Sprint Milestones',
    desc: 'Key deliverables and checkpoints',
    icon: CheckCircle,
    href: null,
    active: false,
    theme: 'primary',
  },
];

const THEME_CLASSES: Record<string, string> = {
  amber: 'from-amber-100 to-amber-50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-700/30',
  emerald: 'from-emerald-100 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30',
  sky: 'from-sky-100 to-sky-50 dark:from-sky-950/30 dark:to-sky-900/20 border-sky-200/50 dark:border-sky-700/30',
  violet: 'from-violet-100 to-violet-50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200/50 dark:border-violet-700/30',
  indigo: 'from-indigo-100 to-indigo-50 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200/50 dark:border-indigo-700/30',
  primary: 'from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/30 dark:border-primary/50',
};

/** 3D-style trophy SVG with depth via gradients */
function Trophy3D() {
  return (
    <div className="relative w-16 h-16" style={{ perspective: '600px' }}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: 'rotateX(12deg) rotateY(-8deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-lg">
          <defs>
            <linearGradient id="trophy-cup" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="trophy-handles" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <filter id="trophy-shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>
          <ellipse cx="32" cy="52" rx="14" ry="4" fill="#B45309" opacity="0.5" />
          <path
            d="M20 20 L24 44 L40 44 L44 20 L38 20 L36 36 L28 36 L26 20 Z"
            fill="url(#trophy-cup)"
            filter="url(#trophy-shadow)"
          />
          <path d="M18 28 Q14 32 18 36 Q22 32 18 28" stroke="url(#trophy-handles)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M46 28 Q50 32 46 36 Q42 32 46 28" stroke="url(#trophy-handles)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="30" y="12" width="4" height="8" rx="1" fill="#F59E0B" />
          <circle cx="32" cy="10" r="4" fill="#FCD34D" />
        </svg>
      </div>
    </div>
  );
}

/** 3D-style podium / formation diagram */
function Formation3D() {
  return (
    <div className="relative w-16 h-16" style={{ perspective: '500px' }}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: 'rotateX(10deg) rotateY(5deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg viewBox="0 0 64 64" className="w-14 h-14">
          <defs>
            <linearGradient id="podium-base" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="60%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
          {/* Isometric podium blocks */}
          <path d="M12 44 L20 36 L52 36 L44 44 Z" fill="url(#podium-base)" opacity="0.9" />
          <path d="M20 36 L28 28 L60 28 L52 36 Z" fill="url(#podium-base)" opacity="0.95" />
          <path d="M28 28 L36 20 L68 20 L60 28 Z" fill="url(#podium-base)" />
          {/* Small circles as "players" */}
          <circle cx="24" cy="40" r="4" fill="#22C55E" stroke="#065F46" strokeWidth="1" />
          <circle cx="36" cy="32" r="4" fill="#22C55E" stroke="#065F46" strokeWidth="1" />
          <circle cx="48" cy="24" r="4" fill="#22C55E" stroke="#065F46" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

/** 3D-style chart/graph placeholder */
function Chart3D() {
  return (
    <div className="relative w-16 h-16" style={{ perspective: '550px' }}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: 'rotateX(8deg) rotateY(-5deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg viewBox="0 0 64 64" className="w-14 h-14">
          <defs>
            <linearGradient id="bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          <rect x="8" y="40" width="10" height="16" rx="2" fill="url(#bar-grad)" opacity="0.8" />
          <rect x="22" y="28" width="10" height="28" rx="2" fill="url(#bar-grad)" />
          <rect x="36" y="20" width="10" height="36" rx="2" fill="url(#bar-grad)" opacity="0.9" />
          <rect x="50" y="32" width="10" height="24" rx="2" fill="url(#bar-grad)" opacity="0.7" />
          <path d="M8 44 L18 44 L18 40 L28 40 L28 28 L38 28 L38 20 L48 20 L48 32 L58 32" stroke="#0EA5E9" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}

function get3DIcon(tileId: string) {
  switch (tileId) {
    case 'leaderboard':
    case 'gamified':
      return <Trophy3D />;
    case 'lineup':
    case 'strategy':
      return <Formation3D />;
    case 'report':
      return <Chart3D />;
    default:
      return null;
  }
}

interface ScoreboardPlaceholderProps {
  onTabSelect?: (tab: 'leaderboard' | 'gamified' | 'lineup') => void;
}

export function ScoreboardPlaceholder({ onTabSelect }: ScoreboardPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Scoreboard Overview</h2>
        <p className="text-sm text-muted-foreground">
          Choose a section below or use the tabs above to explore
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const themeClass = THEME_CLASSES[tile.theme] ?? THEME_CLASSES.primary;
          const ThreeDIcon = get3DIcon(tile.id);

          const content = (
            <div
              className={`
                relative flex flex-col rounded-2xl border p-5 min-h-[140px]
                bg-gradient-to-br ${themeClass}
                transition-all duration-200
                ${tile.active
                  ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-foreground/20'
                  : 'opacity-75 cursor-default'}
              `}
            >
              {tile.active && (
                <span className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </span>
              )}
              <div className="flex items-start gap-4 flex-1">
                <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-xl bg-white/60 dark:bg-black/10 border border-black/5">
                  {ThreeDIcon ?? (
                    <div style={{ perspective: '400px' }}>
                      <div style={{ transform: 'rotateX(10deg) rotateY(-5deg)' }}>
                        <Icon className="w-8 h-8 text-foreground/70" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-semibold text-foreground text-sm">{tile.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{tile.desc}</p>
                </div>
              </div>
              {tile.active && tile.id === 'leaderboard' && onTabSelect && (
                <button
                  onClick={() => onTabSelect('leaderboard')}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  View leaderboard →
                </button>
              )}
              {tile.active && tile.id === 'lineup' && onTabSelect && (
                <button
                  onClick={() => onTabSelect('lineup')}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  View formation →
                </button>
              )}
              {tile.active && tile.id === 'strategy' && onTabSelect && (
                <button
                  onClick={() => onTabSelect('lineup')}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  View tactical lineup →
                </button>
              )}
              {!tile.active && (
                <p className="mt-3 text-[11px] text-muted-foreground italic">Coming soon</p>
              )}
            </div>
          );

          if (tile.active && tile.href) {
            return (
              <Link key={tile.id} href={tile.href}>
                {content}
              </Link>
            );
          }
          return <div key={tile.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
