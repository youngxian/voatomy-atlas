'use client';

import { Activity } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge } from '@/components/ui';

export interface HealthMetricItem {
  label: string;
  icon: React.ElementType;
  values: number[];
  unit: string;
  good: 'high' | 'low';
}

export interface HealthTrendsProps {
  healthMetrics?: HealthMetricItem[];
}

export function HealthTrends({ healthMetrics = [] }: HealthTrendsProps) {
  return (
    <Reveal delay={0.4}>
      <div className="pb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10 border border-success/20">
            <Activity className="w-4 h-4 text-success" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Sprint Health Trends</h2>
        </div>

        {healthMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No health metrics yet. Sprint health data will populate this section.</p>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((metric, mi) => {
            const maxVal = Math.max(...metric.values);
            const latest = metric.values[metric.values.length - 1];
            const prev = metric.values[metric.values.length - 2];
            const improving = metric.good === 'low' ? latest < prev : latest > prev;

            return (
              <Card key={metric.label} className="winboard-card relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                  </div>
                  <Badge variant={improving ? 'success' : 'warning'}>
                    {improving ? 'Improving' : 'Watch'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-xl font-bold text-foreground">{latest}</span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="flex items-end gap-2 h-10">
                  {metric.values.map((val, vi) => {
                    const h = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    const isLast = vi === metric.values.length - 1;
                    return (
                      <div key={vi} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background: isLast ? (improving ? 'var(--success)' : 'var(--warning)') : 'var(--border)',
                            transformOrigin: 'bottom',
                            animation: `analytics-bar-grow 0.6s ease-out ${(mi * 4 + vi) * 0.05}s both`,
                          }}
                        />
                        <span className="text-[8px] text-muted-foreground">S{21 + vi}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    </Reveal>
  );
}
