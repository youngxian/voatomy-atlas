'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useProject } from '@/lib/project-context';
import { getProviderLabel } from '@/lib/project-utils';
import * as atlas from '@/lib/api';

type TicketStatus = 'over' | 'under' | 'exact' | 'close' | 'notdone';

function ticketStatus(t: atlas.TicketAccuracyDetail): TicketStatus {
  if (!t.delivered) return 'notdone';
  if (t.variance === 0) return 'exact';
  if (Math.abs(t.variance) <= 1) return 'close';
  return t.variance > 0 ? 'over' : 'under';
}

function deltaLabel(t: atlas.TicketAccuracyDetail): string {
  const s = ticketStatus(t);
  if (s === 'notdone') return 'not done';
  if (s === 'exact') return 'exact';
  return `${t.variance > 0 ? '+' : ''}${t.variance} pts`;
}

const tabs = [
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'report', label: 'Report' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'share', label: 'Share' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: TicketStatus }) {
  switch (status) {
    case 'over':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'under':
    case 'exact':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'close':
      return <Minus className="w-4 h-4 text-warning" />;
    case 'notdone':
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
}

function deltaColor(status: TicketStatus) {
  switch (status) {
    case 'over':
      return 'text-destructive';
    case 'under':
    case 'exact':
      return 'text-success';
    case 'close':
      return 'text-warning';
    case 'notdone':
      return 'text-destructive';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SprintAccuracyPage() {
  const params = useParams();
  const { activeProjectId, activeProject } = useProject();
  const [activeTab, setActiveTab] = useState('accuracy');
  const [apiDetail, setApiDetail] = useState<atlas.SprintAccuracyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const sprintId = params?.sprintId as string | undefined;

  useEffect(() => {
    if (!activeProjectId || !sprintId) { setLoading(false); return; }
    setLoading(true);
    atlas.getSprintAccuracy(activeProjectId, sprintId)
      .then(setApiDetail)
      .catch((err) => console.error('Failed to load accuracy data', err))
      .finally(() => setLoading(false));
  }, [activeProjectId, sprintId]);

  const providerLabel = getProviderLabel(activeProject);
  const sprintName = apiDetail?.sprint?.name ?? sprintId ?? 'Sprint';
  const accuracyPct = apiDetail ? Math.round(apiDetail.accuracy_pct) : 0;
  const planned = apiDetail?.planned_points ?? 0;
  const actual = apiDetail?.actual_points ?? 0;
  const delta = actual - planned;
  const ticketsList = apiDetail?.tickets ?? [];
  const deliveredCount = ticketsList.filter(t => t.delivered).length;

  const overruns = ticketsList.filter(t => t.delivered && t.variance > 1).sort((a, b) => b.variance - a.variance);

  return (
    <Reveal>
      <div className="space-y-6">
      {/* ---- Back link ---- */}
      <Link href="/accuracy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Sprints
      </Link>

      {/* ---- Tab bar ---- */}
      <div className="flex items-center gap-0 border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Accuracy tab content ---- */}
      {activeTab === 'accuracy' && (
        loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !apiDetail ? (
          <div className="flex items-center justify-center h-64 rounded-xl bg-muted border border-border">
            <p className="text-muted-foreground text-sm">No accuracy data found for this sprint.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sprintName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{providerLabel}: {activeProject?.name ?? 'Project'}</span>
              </div>
            </div>

            {/* Overall accuracy */}
            <div className="rounded-xl bg-muted border border-border p-6">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Overall Accuracy</div>
                  <div className="text-4xl font-extrabold text-foreground">{accuracyPct}%</div>
                </div>
                <div className={`flex items-center gap-1 text-sm ${delta <= 0 ? 'text-success' : 'text-destructive'}`}>
                  {delta <= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-medium">{delta > 0 ? '+' : ''}{delta} pts variance</span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${accuracyPct}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Planned</div>
                <div className="text-xl font-bold text-foreground">{planned} pts <span className="text-sm font-normal text-muted-foreground">&middot; {ticketsList.length} tickets</span></div>
              </div>
              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Delivered</div>
                <div className="text-xl font-bold text-success">{actual} pts <span className="text-sm font-normal text-muted-foreground">&middot; {deliveredCount} tickets</span></div>
              </div>
              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Delta</div>
                <div className={`text-xl font-bold ${delta < 0 ? 'text-destructive' : delta > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {delta > 0 ? '+' : ''}{delta} pts
                </div>
              </div>
            </div>

            {/* Ticket-by-ticket breakdown */}
            {ticketsList.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3">Ticket-by-Ticket Breakdown</h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planned</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actual</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsList.map((t) => {
                        const s = ticketStatus(t);
                        return (
                          <tr key={t.ticket_id} className="border-b border-border hover:bg-muted/60 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-primary font-medium">{t.external_id || t.ticket_id}</span>
                            </td>
                            <td className="px-4 py-3 text-foreground truncate max-w-xs">{t.title}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                              {t.planned_points}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                              {t.delivered ? t.actual_points : <span className="text-muted-foreground/50">&mdash;</span>}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground text-xs truncate max-w-[120px]">
                              {t.assignee_name || '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center gap-1.5 font-medium ${deltaColor(s)}`}>
                                <StatusIcon status={s} />
                                {deltaLabel(t)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Root Cause Analysis — derived from biggest overruns */}
            {overruns.length > 0 && (
              <div className="rounded-xl bg-muted border border-border p-5 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Biggest Overruns
                </h2>
                <div className="space-y-3">
                  {overruns.slice(0, 3).map((t) => (
                    <div key={t.ticket_id} className="pl-4 border-l-2 border-warning/40">
                      <div className="text-sm font-semibold text-foreground mb-1">
                        {t.external_id || t.ticket_id} overran by +{t.variance} pts
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        &ldquo;{t.title}&rdquo; was estimated at {t.planned_points} pts but took {t.actual_points} pts.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ---- Other tabs placeholder ---- */}
      {activeTab !== 'accuracy' && (
        <div className="flex items-center justify-center h-64 rounded-xl bg-muted border border-border">
          <p className="text-muted-foreground text-sm">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} view coming soon
          </p>
        </div>
      )}
      </div>
    </Reveal>
  );
}
