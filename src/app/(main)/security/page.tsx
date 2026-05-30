'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  RefreshCw,
  TrendingUp,
  Clock,
  Filter,
  Users,
  Brain,
  Eye,
  Zap,
  Loader2,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import type {
  PIIStats,
  PIITrackerRow,
  PIISeverity,
  PIIFindingStatus,
  OwnershipFlag,
} from '@/lib/api';
import {
  getPIIStats,
  getPIITracker,
  getFlaggedTickets,
  triggerPIIScan,
  getProjectSettings,
} from '@/lib/api';
import PIIWorkflowPanel from '@/components/PIIWorkflow';
import PIIRemediationPanel from '@/components/PIIRemediationPanel';
import { LockUnlockIcon } from '@/components/ui/animated-state-icons';

const SEVERITY_COLORS: Record<PIISeverity, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
  high: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  low: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
};

const FLAG_META: Record<OwnershipFlag, { label: string; color: string } | null> = {
  none: null,
  orphaned: { label: 'Orphaned', color: 'text-destructive bg-destructive/10 border-destructive/20' },
  bouncing: { label: 'Bouncing', color: 'text-warning bg-warning/10 border-warning/20' },
  risk: { label: 'Risk', color: 'text-warning bg-warning/10 border-warning/20' },
};

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background bento-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
    </div>
  );
}

function SeverityBar({ stats }: { stats: PIIStats }) {
  const total = stats.critical + stats.high + stats.medium + stats.low;
  if (total === 0) return null;
  const segments = [
    { count: stats.critical, color: 'var(--destructive)', label: 'Critical' },
    { count: stats.high, color: 'var(--warning)', label: 'High' },
    { count: stats.medium, color: 'var(--warning)', label: 'Medium' },
    { count: stats.low, color: 'var(--primary)', label: 'Low' },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {segments.map(s => s.count > 0 && (
          <div
            key={s.label}
            className="h-full transition-all duration-500"
            style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-muted-foreground">{s.label}: <strong className="text-foreground">{s.count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const [stats, setStats] = useState<PIIStats | null>(null);
  const [tracker, setTracker] = useState<PIITrackerRow[]>([]);
  const [flagged, setFlagged] = useState<PIITrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanEnabled, setScanEnabled] = useState<boolean | null>(null);
  const [severityFilter, setSeverityFilter] = useState<PIISeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PIIFindingStatus | 'all'>('all');
  const [workflowTicket, setWorkflowTicket] = useState<string | null>(null);
  const [remediationTicket, setRemediationTicket] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const projectID = 'current';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, f, settings] = await Promise.all([
        getPIIStats(projectID).catch(() => null),
        getPIITracker(projectID).catch(() => []),
        getFlaggedTickets(projectID).catch(() => []),
        getProjectSettings(projectID).catch(() => null),
      ]);
      if (s) setStats(s);
      setTracker(t);
      setFlagged(f);
      if (settings) setScanEnabled(settings.vuln_scan_enabled);
    } catch { /* handled per-call */ }
    setLoading(false);
  }, [projectID]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await triggerPIIScan(projectID);
      await loadData();
    } catch { /* ignore */ }
    setScanning(false);
  };

  const filteredTracker = tracker.filter(row => {
    if (severityFilter !== 'all' && row.highest_severity !== severityFilter) return false;
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    return true;
  });

  if (scanEnabled === false) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Ticket Vulnerability Scanner</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Automatically scan every ticket, description, and comment for PII, API keys, and sensitive data.
          AI classifies findings, suggests fixes, and executes remediation.
        </p>
        <Link
          href="/settings/security"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          Turn On Vulnerability Scanner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LockUnlockIcon size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vulnerability Tracker</h1>
            <p className="text-xs text-muted-foreground">PII & sensitive data detection across tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {scanning ? 'Scanning...' : 'Rescan'}
          </button>
          <Link
            href="/settings/security"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Open Findings" value={stats.total_open} icon={ShieldAlert} color="var(--destructive)" subtext={`+${stats.opened_last_7d} this week`} />
              <StatCard label="Critical" value={stats.critical} icon={AlertTriangle} color="var(--destructive)" />
              <StatCard label="Tickets Affected" value={stats.tickets_affected} icon={Users} color="var(--warning)" />
              <StatCard label="Avg Resolution" value={`${stats.avg_resolution_hours}h`} icon={Clock} color="var(--primary)" subtext={`${stats.resolved_last_7d} resolved this week`} />
            </div>
          )}

          {/* Severity bar */}
          {stats && <SeverityBar stats={stats} />}

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:border-border transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              <ChevronDown className="w-3 h-3" />
            </button>
            {filterOpen && (
              <>
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value as PIISeverity | 'all')}
                  className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as PIIFindingStatus | 'all')}
                  className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="remediated">Remediated</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </>
            )}
          </div>

          {/* Tracked Tickets Table */}
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Tracked Tickets</h2>
            </div>
            {filteredTracker.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No findings match the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left font-medium px-4 py-2">Ticket</th>
                      <th className="text-left font-medium px-3 py-2">Assignee</th>
                      <th className="text-center font-medium px-3 py-2">Findings</th>
                      <th className="text-center font-medium px-3 py-2">Severity</th>
                      <th className="text-left font-medium px-3 py-2">Scanned</th>
                      <th className="text-center font-medium px-3 py-2">Status</th>
                      <th className="text-right font-medium px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracker.map(row => {
                      const sev = SEVERITY_COLORS[row.highest_severity];
                      const flag = FLAG_META[row.ownership_flag];
                      return (
                        <tr key={row.ticket_id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-foreground">{row.ticket_key}</span>
                              {flag && (
                                <span className={clsx('text-[8px] font-bold px-1.5 py-[1px] rounded border', flag.color)}>
                                  {flag.label}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground truncate max-w-[200px]">{row.ticket_title}</p>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{row.assignee_name || 'Unassigned'}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="font-bold text-foreground">{row.findings_count}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold', sev.bg, sev.text)}>
                              {row.highest_severity}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{row.last_scanned}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={clsx(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              row.status === 'open' ? 'bg-destructive/10 text-destructive' :
                              row.status === 'remediated' ? 'bg-success/10 text-success' :
                              'bg-muted text-muted-foreground'
                            )}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setRemediationTicket(row.ticket_id)}
                                className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                                title="View findings"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setWorkflowTicket(row.ticket_id)}
                                className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                                title="View AI workflow"
                              >
                                <Brain className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Flagged Tickets */}
          {flagged.length > 0 && (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h2 className="text-sm font-bold text-foreground">Flagged Tickets</h2>
              </div>
              <div className="divide-y divide-border/30">
                {flagged.map(row => {
                  const flag = FLAG_META[row.ownership_flag];
                  return (
                    <div key={row.ticket_id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-foreground">{row.ticket_key}</span>
                          {flag && (
                            <span className={clsx('text-[8px] font-bold px-1.5 py-[1px] rounded border', flag.color)}>
                              {flag.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{row.ticket_title}</p>
                      </div>
                      <button
                        onClick={() => setWorkflowTicket(row.ticket_id)}
                        className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        View <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Workflow Panel */}
      <PIIWorkflowPanel
        projectID={projectID}
        ticketID={workflowTicket || ''}
        open={!!workflowTicket}
        onClose={() => setWorkflowTicket(null)}
      />

      {/* Remediation Panel */}
      <PIIRemediationPanel
        projectID={projectID}
        ticketID={remediationTicket || ''}
        open={!!remediationTicket}
        onClose={() => setRemediationTicket(null)}
      />
    </div>
  );
}
