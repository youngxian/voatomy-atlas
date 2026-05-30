'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Download,
  FileText,
  Presentation,
  Upload,
  Calendar,
  Check,
  TrendingUp,
  Target,
  BarChart3,
  LineChart,
  BookOpen,
  ArrowRight,
  Image,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import TabBar from '@/components/TabBar';
import { Reveal } from '@/components/Reveal';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Inline mock data
// ---------------------------------------------------------------------------

interface Slide {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

const slides: Slide[] = [
  {
    number: 1,
    title: 'Title',
    subtitle: 'Sprint 24 \u00b7 Acme Backend \u00b7 ATLAS',
    icon: Presentation,
    color: 'text-primary',
  },
  {
    number: 2,
    title: 'Summary',
    subtitle: '76% Accuracy \u00b7 48\u219241 pts \u00b7 \u219114% trend',
    icon: BarChart3,
    color: 'text-success',
  },
  {
    number: 3,
    title: 'Goal',
    subtitle: 'Goal: \u2713 3/4 payment tix shipped',
    icon: Target,
    color: 'text-primary',
  },
  {
    number: 4,
    title: 'Metrics',
    subtitle: '76% | 48pts | 2 carry | 5 unplanned',
    icon: BarChart3,
    color: 'text-warning',
  },
  {
    number: 5,
    title: 'Trend',
    subtitle: 'Accuracy trend line across sprints',
    icon: LineChart,
    color: 'text-primary',
  },
  {
    number: 6,
    title: 'Velocity',
    subtitle: 'Velocity bar chart over time',
    icon: TrendingUp,
    color: 'text-success',
  },
  {
    number: 7,
    title: 'Learnings',
    subtitle: 'debt 2.8x \u00b7 Sarah adj \u00b7 Stripe +1',
    icon: BookOpen,
    color: 'text-primary',
  },
  {
    number: 8,
    title: 'Next Sprint',
    subtitle: 'Carry: 1 \u00b7 Cap: 52pts \u00b7 Rev: $89K',
    icon: ArrowRight,
    color: 'text-primary',
  },
];

type ThemeOption = 'atlas-orange' | 'company-custom' | 'minimal-gray';

const themes: { id: ThemeOption; label: string }[] = [
  { id: 'atlas-orange', label: 'ATLAS Orange' },
  { id: 'company-custom', label: 'Company Custom' },
  { id: 'minimal-gray', label: 'Minimal Gray' },
];

const includeOptions = [
  { id: 'inc-metrics', label: 'Sprint metrics summary', defaultOn: true },
  { id: 'inc-tickets', label: 'Ticket breakdown table', defaultOn: true },
  { id: 'inc-team', label: 'Team performance', defaultOn: true },
  { id: 'inc-calibration', label: 'AI calibration notes', defaultOn: false },
  { id: 'inc-next', label: 'Next sprint preview', defaultOn: true },
];

// ---------------------------------------------------------------------------
// Report page tabs
// ---------------------------------------------------------------------------

const tabs = [
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'report', label: 'Report' },
  { id: 'presentation', label: 'Presentation \u2713' },
  { id: 'share', label: 'Share' },
];

// ---------------------------------------------------------------------------
// Sprint Deck Page
// ---------------------------------------------------------------------------

export default function SprintDeckPage() {
  const params = useParams();
  const { activeProjectId, activeSprint } = useProject();
  const [activeTab, setActiveTab] = useState('presentation');
  const [apiReport, setApiReport] = useState<atlas.SprintReport | null>(null);

  useEffect(() => {
    const sprintId = params?.id as string | undefined;
    if (activeProjectId && sprintId) {
      atlas.getSprintReport(activeProjectId, sprintId).then(setApiReport).catch((err) => console.error('Failed to load sprint report', err));
    }
  }, [activeProjectId, params?.id]);

  const sprintLabel = apiReport?.sprint?.name ?? activeSprint?.name ?? `Sprint ${params?.id ?? ''}`;
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('atlas-orange');
  const [includes, setIncludes] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    includeOptions.forEach((o) => {
      map[o.id] = o.defaultOn;
    });
    return map;
  });

  const toggleInclude = (id: string) =>
    setIncludes((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Reveal>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">{sprintLabel} Presentation</h1>
        <Badge variant="orange">Jira</Badge>
      </div>

      {/* Tab bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Deck title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Deck Preview{' '}
          <span className="text-muted-foreground font-normal">(8 slides)</span>
        </h2>
      </div>

      {/* Slide grid — 4x2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <div
              key={slide.number}
              className="bento-card group relative aspect-[16/10] rounded-xl bg-muted border border-border hover:border-primary/40 transition-colors p-4 flex flex-col justify-between cursor-pointer"
            >
              {/* Slide number */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Slide {slide.number}
                </span>
                <Icon className={`w-4 h-4 ${slide.color}`} />
              </div>

              {/* Slide content preview */}
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{slide.title}</p>
                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {slide.subtitle}
                </p>
              </div>

              {/* Mini visualization placeholder for trend/velocity slides */}
              {(slide.number === 5 || slide.number === 6) && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-end gap-1 h-6 opacity-40">
                  {[40, 55, 48, 62, 70, 65, 76].map((v, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${
                        slide.number === 5 ? 'bg-primary' : 'bg-success'
                      }`}
                      style={{ height: `${(v / 100) * 24}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customize section */}
      <Card className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Customize</h3>

        {/* Theme selector */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Theme</label>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selectedTheme === theme.id
                    ? 'bg-primary border-primary text-white'
                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                }`}
              >
                {theme.label}
                {selectedTheme === theme.id && ' \u2713'}
              </button>
            ))}
          </div>
        </div>

        {/* Logo upload */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Company Logo</label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border bg-muted">
            <Image className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Drag & drop logo or{' '}
                <span className="text-primary cursor-pointer hover:text-primary/80">
                  browse
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground/50">PNG, SVG &middot; Max 2MB</p>
            </div>
          </div>
        </div>

        {/* Include checkboxes */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Include in deck</label>
          <div className="space-y-1.5">
            {includeOptions.map((opt) => {
              const isChecked = includes[opt.id];
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleInclude(opt.id)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm text-foreground">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="md">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
        <Button variant="secondary" size="md">
          <FileText className="w-4 h-4" />
          Export PPTX
        </Button>
        <Button variant="secondary" size="md">
          <Presentation className="w-4 h-4" />
          Open in Google Slides
        </Button>
        <Button variant="secondary" size="md">
          <Calendar className="w-4 h-4" />
          Schedule auto-export
        </Button>
      </div>
      </div>
    </Reveal>
  );
}
