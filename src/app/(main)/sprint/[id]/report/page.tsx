'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileText,
  Download,
  Globe,
  Copy,
  Printer,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import TabBar from '@/components/TabBar';
import { Reveal } from '@/components/Reveal';
import * as atlas from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ---------------------------------------------------------------------------
// Inline mock data
// ---------------------------------------------------------------------------

const ticketBreakdown = [
  { id: 'COMP-112', title: 'Payment redesign', est: 8, act: 9, delta: +1, status: 'done' },
  { id: 'COMP-203', title: 'Auth token refresh', est: 5, act: 5, delta: 0, status: 'done' },
  { id: 'COMP-091', title: 'Dashboard perf', est: 8, act: 8, delta: 0, status: 'done' },
  { id: 'COMP-044', title: 'Payment gateway v2', est: 13, act: 11, delta: -2, status: 'done' },
  { id: 'COMP-155', title: 'Email notifications', est: 5, act: 5, delta: 0, status: 'done' },
  { id: 'COMP-199', title: 'Real-time notifs', est: 3, act: 3, delta: 0, status: 'done' },
  { id: 'COMP-217', title: 'N+1 query fix', est: 5, act: 0, delta: -5, status: 'carry' },
  { id: 'COMP-220', title: 'Rate limiter', est: 1, act: 0, delta: -1, status: 'dropped' },
];

const teamPerformance = [
  { name: 'Sarah Chen', assigned: 13, completed: 11, accuracy: 85 },
  { name: 'Marcus Johnson', assigned: 10, completed: 10, accuracy: 100 },
  { name: 'Emily Torres', assigned: 8, completed: 8, accuracy: 100 },
  { name: 'David Kim', assigned: 9, completed: 7, accuracy: 78 },
  { name: 'Alex Rivera', assigned: 8, completed: 5, accuracy: 63 },
];

const calibrationChanges = [
  { ticket: 'COMP-112', change: 'Adjusted from 5pts to 8pts based on code complexity signal (+60%)', direction: 'up' },
  { ticket: 'COMP-044', change: 'Adjusted from 8pts to 13pts based on historical debt overhead (+62%)', direction: 'up' },
  { ticket: 'COMP-199', change: 'Adjusted from 5pts to 3pts based on similar past ticket COMP-178 (-40%)', direction: 'down' },
];

// ---------------------------------------------------------------------------
// Report page tabs
// ---------------------------------------------------------------------------

const tabs = [
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'report', label: 'Report \u2713' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'share', label: 'Share' },
];

// ---------------------------------------------------------------------------
// Sprint Report Page
// ---------------------------------------------------------------------------

export default function SprintReportPage() {
  const params = useParams();
  const { activeProjectId, activeSprint } = useProject();
  const [activeTab, setActiveTab] = useState('report');
  const [apiReport, setApiReport] = useState<atlas.SprintReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sprintId = params?.id as string | undefined;
    if (activeProjectId && sprintId) {
      setLoading(true);
      atlas.getSprintReport(activeProjectId, sprintId)
        .then(setApiReport)
        .catch((err) => console.error('Failed to load sprint report', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeProjectId, params?.id]);

  const sprintLabel = apiReport?.sprint?.name ?? activeSprint?.name ?? `Sprint ${params?.id ?? ''}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Reveal>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">{sprintLabel} Report</h1>
        <Badge variant="orange">Jira</Badge>
      </div>

      {/* Tab bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Report content */}
      <Card className="space-y-8 !p-6 lg:!p-8">
        {/* ============================================================ */}
        {/* EXECUTIVE SUMMARY */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Executive Summary
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sprint 24 &middot; ACME Backend &middot; Feb 10 &ndash; Feb 21, 2025 &middot; 2-week sprint
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Accuracy
              </p>
              <p className="text-3xl font-bold text-primary">76%</p>
              <p className="text-xs text-success mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" /> +14% from S23
              </p>
            </div>
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Committed
              </p>
              <p className="text-3xl font-bold text-foreground">48<span className="text-lg text-muted-foreground">pts</span></p>
            </div>
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Delivered
              </p>
              <p className="text-3xl font-bold text-foreground">41<span className="text-lg text-muted-foreground">pts</span></p>
            </div>
          </div>

          {/* Goal + Unplanned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Goal Achievement
              </p>
              <p className="text-foreground">
                3 of 4 payment tickets shipped. Auth overhaul completed on schedule.
              </p>
              <Badge variant="success">3/4 Goals Met</Badge>
            </div>
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Unplanned Work
              </p>
              <p className="text-foreground">
                5 unplanned tickets added mid-sprint (12 pts). Primary cause: production hotfixes.
              </p>
              <Badge variant="warning">5 Unplanned</Badge>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* KEY WINS */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Key Wins
          </h2>
          <ul className="space-y-2">
            {[
              'Payment redesign shipped on time \u2014 unblocked $142K in pipeline revenue',
              'Auth token refresh completed ahead of schedule \u2014 0 regressions',
              'Revenue-critical tickets unblocked $142K ARR across 3 deals',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ============================================================ */}
        {/* KEY MISSES */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Key Misses
          </h2>
          <ul className="space-y-2">
            {[
              'COMP-217 (N+1 query fix) carried over \u2014 underestimated DB migration complexity',
              'Rate limiter dropped due to mid-sprint priority shift from escalation',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ============================================================ */}
        {/* TICKET BREAKDOWN */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Ticket Breakdown
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ticket
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Title
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Est
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Act
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Delta
                  </th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ticketBreakdown.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-primary font-medium">{t.id}</span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{t.title}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground tabular-nums">
                      {t.est}
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground tabular-nums">
                      {t.act}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center font-medium tabular-nums ${
                        t.delta > 0
                          ? 'text-destructive'
                          : t.delta < 0
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t.delta > 0 ? `+${t.delta}` : t.delta === 0 ? '0' : t.delta}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant={
                          t.status === 'done'
                            ? 'success'
                            : t.status === 'carry'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {t.status === 'done'
                          ? 'Done'
                          : t.status === 'carry'
                          ? 'Carry'
                          : 'Dropped'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================ */}
        {/* TEAM PERFORMANCE */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Team Performance
          </h2>
          <div className="space-y-2">
            {teamPerformance.map((member) => (
              <div
                key={member.name}
                className="bento-card flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/50 border border-border"
              >
                {/* Avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {member.assigned} assigned
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {member.completed} completed
                </div>
                <div className="flex items-center gap-2 w-24">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        member.accuracy >= 90
                          ? 'bg-success'
                          : member.accuracy >= 70
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${member.accuracy}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      member.accuracy >= 90
                        ? 'text-success'
                        : member.accuracy >= 70
                        ? 'text-warning'
                        : 'text-destructive'
                    }`}
                  >
                    {member.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* AI CALIBRATION APPLIED */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Calibration Applied
            </span>
          </h2>
          <div className="space-y-2">
            {calibrationChanges.map((cal, i) => (
              <div
                key={i}
                className="bento-card flex items-start gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border"
              >
                <span className="text-primary font-medium text-sm shrink-0">
                  {cal.ticket}
                </span>
                <p className="text-sm text-muted-foreground">{cal.change}</p>
                <Badge
                  variant={cal.direction === 'up' ? 'warning' : 'success'}
                  className="shrink-0"
                >
                  {cal.direction === 'up' ? '\u2191' : '\u2193'}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* NEXT SPRINT PREVIEW */}
        {/* ============================================================ */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">
            Next Sprint Preview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Carry-over
              </p>
              <p className="text-foreground font-medium">
                1 ticket &middot; COMP-217 (5pts)
              </p>
            </div>
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Suggested Capacity
              </p>
              <p className="text-foreground font-medium">52 pts (adj. for carry)</p>
            </div>
            <div className="bento-card rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Revenue Signals
              </p>
              <p className="text-foreground font-medium">$89K pipeline at risk</p>
            </div>
          </div>
        </section>
      </Card>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="md">
          <Download className="w-4 h-4" />
          Export as PDF
        </Button>
        <Button variant="secondary" size="md">
          <Globe className="w-4 h-4" />
          Export as HTML
        </Button>
        <Button variant="secondary" size="md">
          <Copy className="w-4 h-4" />
          Copy Link
        </Button>
        <Button variant="secondary" size="md">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>
      </div>
    </Reveal>
  );
}
