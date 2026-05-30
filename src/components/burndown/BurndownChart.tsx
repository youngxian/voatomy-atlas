'use client';

import { BarChart3, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import type { DayData } from '@/lib/burndown-mock';

interface RechartsDataPoint {
  date: string;
  day: number;
  ideal: number;
  actual?: number;
  projected?: number;
  isToday: boolean;
}

interface BurndownChartProps {
  rechartsData: RechartsDataPoint[];
  chartConfig: ChartConfig;
  activeBurndownData: DayData[];
  activeTodayIndex: number;
  activeTotalPoints: number;
  activeCompletedPoints: number;
  forecastPts: number;
  actualVelocity: number;
}

export function BurndownChart({
  rechartsData,
  chartConfig,
  activeBurndownData,
  activeTodayIndex,
  activeTotalPoints,
  activeCompletedPoints,
  forecastPts,
  actualVelocity,
}: BurndownChartProps) {
  return (
    <Reveal delay={0.1}>
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden bento-card" style={{ boxShadow: '0 1px 3px rgba(0,17,44,0.04), 0 4px 16px rgba(0,17,44,0.03)' }}>
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
            </div>
            Burndown Chart
          </h2>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-5 h-0.5 rounded-full border-t-2 border-dashed border-muted-foreground" />
              Ideal
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-0.5 rounded-full bg-primary" />
              Actual
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-0.5 rounded-full border-t-2 border-dashed border-success" />
              Projected
            </span>
          </div>
        </div>

        <div className="px-2">
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart data={rechartsData} margin={{ top: 20, right: 24, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="bdAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="bdProjGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="bdStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--primary)" />
                </linearGradient>
                <filter id="bdLineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="rgba(34,197,94,0.35)" />
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="4 8" className="stroke-border/30" horizontal vertical={false} />

              <ReferenceLine
                x={activeBurndownData[activeTodayIndex]?.date}
                stroke="var(--primary)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.6}
                label={{ value: 'Today', position: 'insideTopRight', fill: 'var(--primary)', fontSize: 11, fontWeight: 700 }}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickMargin={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickMargin={8}
                domain={[0, activeTotalPoints]}
                tickFormatter={(v) => `${v}`}
              />

              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-xl backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Day {d.day} · {d.date}</p>
                      {d.actual !== undefined && (
                        <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {d.actual} pts remaining
                        </p>
                      )}
                      {d.projected !== undefined && d.actual === undefined && (
                        <p className="text-sm font-bold text-success flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-success opacity-60" />
                          ~{d.projected} pts (projected)
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-0.5 border-t border-dashed border-muted-foreground" />
                        Ideal: {d.ideal} pts
                      </p>
                    </div>
                  );
                }}
                cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted-foreground)', strokeOpacity: 0.25 }}
              />

              <Area type="monotone" dataKey="actual" fill="url(#bdAreaGrad)" stroke="none" connectNulls={false} />
              <Area type="monotone" dataKey="projected" fill="url(#bdProjGrad)" stroke="none" connectNulls={false} />

              <Line type="monotone" dataKey="ideal" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="8 4" dot={false} opacity={0.3} />

              <Line
                type="monotone"
                dataKey="actual"
                stroke="url(#bdStroke)"
                strokeWidth={2.5}
                filter="url(#bdLineShadow)"
                connectNulls={false}
                dot={(props) => {
                  const { cx, cy, index } = props;
                  const isLast = index === activeTodayIndex;
                  if (cx == null || cy == null) return <g key={`dot-${index}`} />;
                  return (
                    <g key={`dot-${index}`}>
                      {isLast && (
                        <circle cx={cx} cy={cy} r={12} fill="var(--primary)" opacity={0.08}>
                          <animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.1;0.02;0.1" dur="2.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={cx} cy={cy} r={isLast ? 6 : 3.5} fill={isLast ? 'var(--primary)' : 'var(--card)'} stroke="var(--primary)" strokeWidth={isLast ? 3 : 2} />
                      {isLast && <circle cx={cx} cy={cy} r={2} fill="white" />}
                    </g>
                  );
                }}
                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
              />

              <Line
                type="monotone"
                dataKey="projected"
                stroke="var(--success)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                connectNulls={false}
                opacity={0.5}
                dot={{ r: 2.5, fill: 'var(--card)', stroke: 'var(--success)', strokeWidth: 1.5, opacity: 0.4 }}
                activeDot={{ r: 5, fill: 'var(--success)', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>

        <div className="px-6 pb-5 pt-2 flex items-center gap-6 border-t border-border/30 mx-6">
          <div className="flex items-center gap-2">
            {forecastPts >= activeTotalPoints ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-success font-medium">Ahead of plan by ~{forecastPts - activeTotalPoints} pts</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-warning font-medium">Behind plan by ~{activeTotalPoints - forecastPts} pts</span>
              </>
            )}
          </div>
          <div className="w-px h-4 bg-border/40" />
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Avg {actualVelocity.toFixed(1)} pts/day</span>
          </div>
          <div className="w-px h-4 bg-border/40" />
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{activeTotalPoints - activeCompletedPoints} pts to go</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
