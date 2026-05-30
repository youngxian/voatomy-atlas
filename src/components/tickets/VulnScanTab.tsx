'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import * as api from '@/lib/api';
import { useProject } from '@/lib/project-context';

const SEVERITY_CONFIG: Record<api.PIISeverity, { color: string; bg: string; dot: string; label: string }> = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', dot: 'bg-destructive', label: 'Critical' },
  high: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', dot: 'bg-warning', label: 'High' },
  medium: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', dot: 'bg-primary', label: 'Medium' },
  low: { color: 'text-muted-foreground', bg: 'bg-muted border-border', dot: 'bg-muted-foreground', label: 'Low' },
};

export function VulnScanTab() {
  const { activeProjectId } = useProject();
  const [stats, setStats] = useState<api.PIIStats | null>(null);
  const [tracker, setTracker] = useState<api.PIITrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<api.PIISeverity | 'all'>('all');

  const loadData = useCallback(() => {
    if (!activeProjectId) {
      setLoading(false);
      setError('No active project selected.');
      return;
    }
    setLoading(true);
    setError(null);
    Promise.allSettled([
      api.getPIIStats(activeProjectId),
      api.getPIITracker(activeProjectId),
    ]).then(([statsRes, trackerRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (trackerRes.status === 'fulfilled') setTracker(Array.isArray(trackerRes.value) ? trackerRes.value : []);
      if (statsRes.status === 'rejected' && trackerRes.status === 'rejected') {
        setError('Failed to load vulnerability data');
      }
    }).finally(() => setLoading(false));
  }, [activeProjectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScan = async () => {
    if (!activeProjectId) return;
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api.triggerPIIScan(activeProjectId);
      setScanResult(`Scan complete — ${result.findings_count} finding${result.findings_count !== 1 ? 's' : ''}`);
      loadData();
      setTimeout(() => setScanResult(null), 4000);
    } catch {
      setScanResult('Scan failed');
      setTimeout(() => setScanResult(null), 4000);
    } finally {
      setScanning(false);
    }
  };

  const filtered = severityFilter === 'all'
    ? tracker
    : tracker.filter(r => r.highest_severity === severityFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading vulnerability data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Unable to load scan data</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <button onClick={loadData} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open Findings', value: stats.total_open, color: stats.total_open > 0 ? 'text-warning' : 'text-success', icon: ShieldAlert },
            { label: 'Critical', value: stats.critical, color: stats.critical > 0 ? 'text-destructive' : 'text-muted-foreground', icon: Shield },
            { label: 'Resolved (7d)', value: stats.resolved_last_7d, color: 'text-success', icon: CheckCircle2 },
            { label: 'Avg Resolution', value: `${stats.avg_resolution_hours}h`, color: 'text-primary', icon: RefreshCw },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-card border border-border/50 bento-card">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold tabular-nums leading-none ${m.color}`}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleScan}
          disabled={scanning || !activeProjectId}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50"
        >
          {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
        {scanResult && <span className="text-xs text-muted-foreground">{scanResult}</span>}
        <Link
          href="/security"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground ml-auto"
        >
          Full Security Dashboard
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-1">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              severityFilter === s
                ? 'bg-primary/10 border-primary/25 text-primary'
                : 'bg-card border-border text-muted-foreground hover:border-border'
            }`}
          >
            {s === 'all' ? 'All' : SEVERITY_CONFIG[s].label}
            {s !== 'all' && stats ? ` (${stats[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            {tracker.length === 0 ? 'No Vulnerabilities Found' : 'No Matches'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {tracker.length === 0
              ? 'Run a scan to check your tickets for PII, secrets, and sensitive data exposure.'
              : 'No tickets match the selected severity filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row, idx) => {
            const sev = SEVERITY_CONFIG[row.highest_severity] || SEVERITY_CONFIG.low;
            return (
              <div
                key={row.ticket_id}
                className={`rounded-xl border bg-card p-4 transition-all hover:shadow-sm ${
                  row.highest_severity === 'critical' ? 'border-destructive/30' : 'border-border/60'
                }`}
                style={{ animation: `fadeSlideIn 0.3s ease-out ${idx * 0.04}s both` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${sev.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-primary">{row.ticket_key}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${sev.bg} ${sev.color}`}>
                        {sev.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {row.findings_count} finding{row.findings_count !== 1 ? 's' : ''}
                      </span>
                      {row.status === 'remediated' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Remediated
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{row.ticket_title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{row.assignee_name}</span>
                      <span className="text-[10px]">Scanned {new Date(row.last_scanned).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
