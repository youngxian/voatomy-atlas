'use client';

import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Card, Badge } from '@/components/ui';
import { Avatar, MiniSparkline, WorkloadDonut } from './analytics-charts';
import type { TeamMember } from '@/lib/analytics-mock';

interface TeamPerformanceProps {
  teamMembers: TeamMember[];
  expandedMember: string | null;
  setExpandedMember: (name: string | null) => void;
}

export function TeamPerformance({ teamMembers, expandedMember, setExpandedMember }: TeamPerformanceProps) {
  return (
    <Reveal delay={0.3}>
      <div className="pb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Individual Performance</h2>
        </div>

        <div className="space-y-3 analytics-card-stagger">
          {teamMembers.map((member) => {
            const isExpanded = expandedMember === member.name;
            return (
              <Card
                key={member.name}
                className={`winboard-card transition-all duration-300 ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedMember(isExpanded ? null : member.name)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar initials={member.initials} color={member.color} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{member.name}</span>
                        <Badge variant="muted">{member.role}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{member.velocity}</span> pts/sprint
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{member.accuracy}%</span> accuracy
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{member.storiesCompleted}</span> stories
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                      <MiniSparkline values={member.sprintTrend} color={member.color} />
                      <div className="flex items-center gap-1.5">
                        {member.strengths.slice(0, 2).map(s => (
                          <Badge key={s} variant="muted">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="w-5 flex justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border" style={{ animation: 'analytics-fade-in-up 0.3s ease-out' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sprint Trend (Last 4)</span>
                        <div className="flex items-end gap-2 mt-3 h-16">
                          {member.sprintTrend.map((v, i) => {
                            const maxT = Math.max(...member.sprintTrend);
                            const h = (v / maxT) * 100;
                            const isLast = i === member.sprintTrend.length - 1;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className={`text-[10px] font-bold tabular-nums ${isLast ? '' : 'text-muted-foreground'}`} style={isLast ? { color: member.color } : undefined}>{v}</span>
                                <div
                                  className="w-full rounded-t-sm"
                                  style={{
                                    height: `${h}%`,
                                    background: isLast ? member.color : 'var(--border)',
                                    animation: `analytics-bar-grow 0.6s ease-out ${i * 0.1}s both`,
                                    transformOrigin: 'bottom',
                                  }}
                                />
                                <span className="text-[9px] text-muted-foreground">S{21 + i}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Workload Distribution</span>
                        <div className="flex items-center gap-4 mt-3">
                          <WorkloadDonut data={member.workload} />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-sm bg-[#ec4899]" />
                              <span className="text-[10px] text-muted-foreground">Frontend {member.workload.frontend}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-sm bg-primary" />
                              <span className="text-[10px] text-muted-foreground">Backend {member.workload.backend}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-sm bg-[#06b6d4]" />
                              <span className="text-[10px] text-muted-foreground">Infra {member.workload.infra}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Strength Areas</span>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {member.strengths.map(s => (
                            <span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium border" style={{ color: member.color, borderColor: `${member.color}30`, background: `${member.color}10` }}>
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${member.accuracy}%`,
                                background: member.color,
                                animation: 'analytics-bar-grow-x 1s ease-out both',
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums" style={{ color: member.color }}>{member.accuracy}%</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 block">Estimation Accuracy</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}
