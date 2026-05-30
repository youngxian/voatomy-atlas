'use client';

import { AlertTriangle, Bot, Sparkles, Star, Zap } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Badge } from '@/components/ui';

export interface AIRecommendation {
  text: string;
  type: 'warning' | 'positive' | 'action';
}

export interface AIRecommendationsProps {
  recommendations?: AIRecommendation[];
}

export function AIRecommendations({ recommendations = [] }: AIRecommendationsProps) {
  return (
    <Reveal delay={0.5}>
      <div className="pb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Focus Areas & Recommendations</h2>
            <Badge variant="orange">ATLAS AI</Badge>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 p-5 space-y-3 bg-primary/5">
          <div
            className="h-0.5 rounded-full mb-4"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
              backgroundSize: '200% 100%',
              animation: 'analytics-shimmer 3s ease-in-out infinite',
            }}
          />
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No AI recommendations yet. Analytics data will populate this section.</p>
          ) : (
          recommendations.map((rec, i) => {
            const icons = {
              warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />,
              positive: <Star className="w-4 h-4 text-success shrink-0 mt-0.5" />,
              action: <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
            };
            const borderColors = {
              warning: 'border-warning/20 bg-warning/5',
              positive: 'border-success/20 bg-success/5',
              action: 'border-primary/20 bg-primary/5',
            };
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-lg border ${borderColors[rec.type]}`}
                style={{ animation: `analytics-fade-in-up 0.4s ease-out ${i * 0.12}s both` }}
              >
                {icons[rec.type]}
                <p className="text-sm text-foreground leading-relaxed flex-1">{rec.text}</p>
                <Bot className="w-3.5 h-3.5 text-primary/40 shrink-0 mt-0.5" />
              </div>
            );
          })
          )}
        </div>
      </div>
    </Reveal>
  );
}
