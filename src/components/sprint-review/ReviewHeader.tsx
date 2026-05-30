'use client';

import {
  ExternalLink,
  Shield,
  Target,
  TrendingUp,
  Users,
  Flame,
  Gauge,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { shimmerStyle, barGrowStyle } from '@/lib/sprint-review-config';

interface ReviewHeaderProps {
  totalPlanned: number;
  capacity: number;
  capacityPct: number;
  buffer: number;
  recommendedTickets: number;
  addedExcluded: number;
  highRiskCount: number;
}

export function ReviewHeader({
  totalPlanned,
  capacity,
  capacityPct,
  buffer,
  recommendedTickets,
  addedExcluded,
  highRiskCount,
}: ReviewHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Sprint 25 Plan</h1>
            <Badge variant="orange">AI Generated</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-muted-foreground">Jira: ACME Engineering</span>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-muted-foreground">Feb 17 - Mar 2, 2025</span>
            <span className="text-xs text-muted-foreground">2-week cadence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <Activity className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-medium text-success">Plan Health: Good</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">v3 - 2 iterations</span>
          </span>
        </div>
      </div>

      {/* Stats + Confidence Gauge — bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="relative overflow-hidden bento-card">
            <div style={shimmerStyle} className="absolute inset-0 pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/8 border border-success/12 flex items-center justify-center">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p>
            </div>
            <p className="text-2xl font-bold text-success" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out both' }}>87%</p>
            <p className="text-[10px] text-success/60 mt-1">HIGH</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full origin-left" style={{ width: '87%', ...barGrowStyle(0.2) }} />
            </div>
          </Card>

          <Card className="relative overflow-hidden bento-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out 0.1s both' }}>81%</p>
            <p className="text-[10px] text-muted-foreground mt-1">+5% vs Sprint 24</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full origin-left" style={{ width: '81%', ...barGrowStyle(0.3) }} />
            </div>
          </Card>

          <Card className="bento-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-info/8 border border-info/12 flex items-center justify-center">
                <Users className="w-4 h-4 text-info" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacity</p>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out 0.2s both' }}>
              {capacity}<span className="text-sm text-muted-foreground ml-0.5">pts</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">5 engineers</p>
            <div className="flex gap-1 mt-2">
              {['AC', 'SK', 'JL', 'PP', 'MW'].map((init, i) => (
                <span key={init} className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground" style={{ animation: `sr-fade-in-scale 0.3s ease-out ${0.3 + i * 0.05}s both` }}>
                  {init}
                </span>
              ))}
            </div>
          </Card>

          <Card className="bento-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Planned</p>
            </div>
            <p className="text-2xl font-bold text-primary tabular-nums" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out 0.3s both' }}>
              {totalPlanned}<span className="text-sm text-muted-foreground ml-0.5">pts</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{recommendedTickets + addedExcluded} tickets</p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full origin-left" style={{ width: `${capacityPct}%`, ...barGrowStyle(0.4) }} />
            </div>
          </Card>

          <Card className="bento-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/8 border border-success/12 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Buffer</p>
            </div>
            <p className="text-2xl font-bold text-success tabular-nums" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out 0.4s both' }}>
              {buffer}<span className="text-sm text-muted-foreground ml-0.5">pts</span>
            </p>
            <p className="text-[10px] text-success/60 mt-1">{capacity > 0 ? Math.round((buffer / capacity) * 100) : 0}% headroom</p>
          </Card>

          <Card className="bento-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/8 border border-destructive/12 flex items-center justify-center">
                <Flame className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">High Risk</p>
            </div>
            <p className="text-2xl font-bold text-destructive tabular-nums" style={{ fontFamily: 'var(--font-serif)', animation: 'sr-count-up 0.6s ease-out 0.5s both' }}>
              {highRiskCount}
            </p>
            <p className="text-[10px] text-destructive/60 mt-1">require monitoring</p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: highRiskCount }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-destructive" style={{ animation: `sr-pulse-glow 2s ease-in-out ${i * 0.3}s infinite` }} />
              ))}
            </div>
          </Card>
        </div>

        {/* Confidence Gauge */}
        <Card className="flex flex-col items-center justify-center py-6">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Sprint Confidence Meter</p>
          <div className="relative w-48 h-28">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="var(--destructive)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />
              <path d="M 60 35 A 80 80 0 0 1 100 20" fill="none" stroke="var(--warning)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />
              <path d="M 100 20 A 80 80 0 0 1 140 35" fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />
              <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="var(--success)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="33" style={{ animation: 'sr-gauge-anim 1.5s ease-out both' }} />
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--destructive)" />
                  <stop offset="33%" stopColor="var(--warning)" />
                  <stop offset="66%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--success)" />
                </linearGradient>
              </defs>
              <line x1="100" y1="100" x2="100" y2="30" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" transform={`rotate(${-90 + (87 / 100) * 180}, 100, 100)`} style={{ animation: 'sr-gauge-anim 1.5s ease-out both' }} />
              <circle cx="100" cy="100" r="5" fill="var(--foreground)" />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <p className="text-2xl font-bold text-foreground">87%</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" />Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Good</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" />High</span>
          </div>
          <p className="text-xs text-success mt-3 font-medium">Above team average by 12%</p>
        </Card>
      </div>

      {/* Capacity Bar */}
      <Card className="py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            Capacity utilization
          </span>
          <span className="text-xs font-medium text-foreground tabular-nums">
            {totalPlanned} / {capacity} pts ({capacityPct}%)
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          <div className="h-full rounded-full bg-primary origin-left" style={{ width: `${capacityPct}%`, ...barGrowStyle(0.3) }} />
          <div className="absolute top-0 h-full border-l-2 border-dashed border-success/50" style={{ left: `${capacityPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>0</span>
          <span className="text-primary">Planned: {totalPlanned}</span>
          <span className="text-success">Buffer: {buffer}</span>
          <span>{capacity}</span>
        </div>
      </Card>
    </>
  );
}
