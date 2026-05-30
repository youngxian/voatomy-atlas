'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  ShieldAlert,
  Search,
  Brain,
  AlertTriangle,
  Wrench,
  Bell,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  Zap,
  MessageSquare,
  Loader2,
  ExternalLink,
  X,
} from 'lucide-react';
import type { PIIWorkflowData, PIIFinding, PIISeverity } from '@/lib/api';
import { getPIIWorkflow } from '@/lib/api';

const SEVERITY_COLORS: Record<PIISeverity, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', label: 'Critical' },
  high: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'High' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'Medium' },
  low: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', label: 'Low' },
};

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  safe: { bg: 'bg-success/10', text: 'text-success' },
  review_recommended: { bg: 'bg-warning/10', text: 'text-warning' },
  requires_approval: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? 'var(--success)' : confidence >= 0.5 ? 'var(--warning)' : 'var(--destructive)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function StepIcon({ step, status }: { step: string; status: string }) {
  const iconMap: Record<string, React.ElementType> = {
    source: ExternalLink,
    regex_prefilter: Search,
    ai_classification: Brain,
    ai_severity: AlertTriangle,
    ai_remediation: Wrench,
    notifications: Bell,
    actions: Zap,
    current_status: CheckCircle2,
  };
  const Icon = iconMap[step] || ShieldAlert;
  const statusColor = status === 'completed' ? 'var(--primary)' : status === 'in_progress' ? 'var(--warning)' : '#4a4a5a';

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-[#0e0e1a]"
      style={{ backgroundColor: `${statusColor}20`, borderColor: statusColor, '--tw-ring-color': statusColor } as React.CSSProperties}
    >
      <Icon className="w-4 h-4" style={{ color: statusColor }} />
    </div>
  );
}

function WorkflowTimeline({ data }: { data: PIIWorkflowData }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([2, 3, 4]));

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const stepLabels: Record<string, string> = {
    source: 'Source',
    regex_prefilter: 'Regex Pre-Filter',
    ai_classification: 'AI Classification',
    ai_severity: 'AI Severity Assessment',
    ai_remediation: 'AI Remediation Plan',
    notifications: 'Notifications Sent',
    actions: 'Actions Taken',
    current_status: 'Current Status',
  };

  return (
    <div className="space-y-0">
      {data.steps.map((step, i) => {
        const isExpanded = expanded.has(i);
        const isLast = i === data.steps.length - 1;
        return (
          <div key={i} className="relative">
            {!isLast && (
              <div className="absolute left-4 top-10 bottom-0 w-px bg-[#2a2a3a]" />
            )}
            <button
              onClick={() => toggle(i)}
              className="flex items-start gap-3 w-full text-left py-3 group"
            >
              <StepIcon step={step.step} status={step.status} />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {stepLabels[step.step] || step.step}
                  </span>
                  {step.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  )}
                  {step.status === 'in_progress' && (
                    <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />
                  )}
                </div>
                <span className="text-[10px] text-[#6b6b80]">{step.timestamp}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[#6b6b80] mt-1.5" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#6b6b80] mt-1.5" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-11 pb-3"
                >
                  <StepDetails step={step} data={data} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function StepDetails({ step, data }: { step: PIIWorkflowData['steps'][0]; data: PIIWorkflowData }) {
  switch (step.step) {
    case 'source':
      return (
        <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3">
          <p className="text-xs text-[#9b9bb0]">
            {data.scan_source || 'Synced from integration'} &mdash; triggered scan on ticket{' '}
            <span className="font-mono text-white">{data.ticket_title}</span>
          </p>
        </div>
      );

    case 'regex_prefilter':
      return (
        <div className="space-y-2">
          <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3">
            <p className="text-xs text-[#9b9bb0] mb-2">
              Scanned title, description, and comments. Found{' '}
              <span className="font-bold text-white">{(data.findings.length + data.dismissed.length)}</span> candidates.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.findings.map((f, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {f.category} in {f.field}
                </span>
              ))}
              {data.dismissed.map((d, i) => (
                <span key={`d-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a3a] text-[#6b6b80]">
                  {d.field}: dismissed
                </span>
              ))}
            </div>
          </div>
        </div>
      );

    case 'ai_classification':
      return (
        <div className="space-y-2">
          {data.findings.map((f, i) => (
            <div key={i} className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  Confirmed PII
                </span>
                <span className="text-xs text-white font-medium">{f.category}</span>
                <span className="text-[10px] text-[#6b6b80]">in {f.field}</span>
              </div>
              <ConfidenceBar confidence={f.ai_confidence} />
              <p className="text-xs text-[#9b9bb0] leading-relaxed">{f.ai_reasoning}</p>
            </div>
          ))}
          {data.dismissed.map((d, i) => (
            <div key={`d-${i}`} className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                  Dismissed
                </span>
                <span className="text-xs text-[#6b6b80]">{d.field}</span>
              </div>
              <p className="text-xs text-[#9b9bb0] leading-relaxed">{d.reasoning}</p>
            </div>
          ))}
        </div>
      );

    case 'ai_severity':
      return (
        <div className="space-y-2">
          {data.findings.map((f, i) => {
            const sev = SEVERITY_COLORS[f.severity];
            return (
              <div key={i} className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full border', sev.bg, sev.text, sev.border)}>
                    {sev.label}
                  </span>
                  <span className="text-xs text-white">{f.category}</span>
                </div>
                <p className="text-xs text-[#9b9bb0] leading-relaxed">{f.ai_severity_explanation}</p>
              </div>
            );
          })}
        </div>
      );

    case 'ai_remediation':
      return (
        <div className="space-y-2">
          {data.findings.map((f, i) => (
            <div key={i} className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-2.5">
              <p className="text-xs text-[#9b9bb0] leading-relaxed">{f.remediation}</p>
              <div className="space-y-1.5">
                {f.ai_actions.map((action, j) => {
                  const risk = RISK_COLORS[action.risk] || RISK_COLORS.safe;
                  return (
                    <div key={j} className="flex items-center gap-2 p-2 rounded-md bg-[#12121a] border border-[#2a2a3a]">
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white font-medium">{action.label}</span>
                        <p className="text-[10px] text-[#6b6b80] truncate">{action.description}</p>
                      </div>
                      <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded', risk.bg, risk.text)}>
                        {action.risk.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );

    case 'notifications':
      return (
        <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-1.5">
          {data.notifications_sent.length === 0 ? (
            <p className="text-xs text-[#6b6b80]">No notifications sent.</p>
          ) : (
            data.notifications_sent.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <Bell className="w-3 h-3 text-primary" />
                <span className="text-xs text-[#9b9bb0]">
                  {n.type} sent to {n.recipient}
                </span>
                <span className="text-[10px] text-[#6b6b80] ml-auto">{n.sent_at}</span>
              </div>
            ))
          )}
        </div>
      );

    case 'actions':
      return (
        <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3 space-y-1.5">
          {data.actions_taken.length === 0 ? (
            <p className="text-xs text-[#6b6b80]">No actions taken yet.</p>
          ) : (
            data.actions_taken.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-warning" />
                <span className="text-xs text-[#9b9bb0]">
                  {a.actor} {a.action}
                </span>
                <span className="text-[10px] text-[#6b6b80] ml-auto">{a.timestamp}</span>
              </div>
            ))
          )}
        </div>
      );

    case 'current_status':
      return (
        <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3">
          <p className="text-xs text-white font-medium">{data.current_status}</p>
        </div>
      );

    default:
      return (
        <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3">
          <pre className="text-[10px] text-[#6b6b80] whitespace-pre-wrap">{JSON.stringify(step.details, null, 2)}</pre>
        </div>
      );
  }
}

interface PIIWorkflowPanelProps {
  projectID: string;
  ticketID: string;
  open: boolean;
  onClose: () => void;
}

export default function PIIWorkflowPanel({ projectID, ticketID, open, onClose }: PIIWorkflowPanelProps) {
  const [data, setData] = useState<PIIWorkflowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectID || !ticketID) return;
    setLoading(true);
    setError(null);
    getPIIWorkflow(projectID, ticketID)
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load workflow'))
      .finally(() => setLoading(false));
  }, [open, projectID, ticketID]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-[#0e0e1a] border-l border-[#2a2a3a] overflow-y-auto shadow-2xl"
        >
          <div className="sticky top-0 z-10 bg-[#0e0e1a]/95 backdrop-blur-md border-b border-[#2a2a3a] px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Decision Flow</h2>
                  <p className="text-[10px] text-[#6b6b80]">End-to-end detection pipeline</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#6b6b80] hover:text-white hover:bg-[#2a2a3a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-[#6b6b80]">Loading AI workflow...</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-center">
                <XCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-white">{data.ticket_title}</span>
                  </div>
                  <p className="text-[10px] text-[#6b6b80]">
                    {data.findings.length} finding{data.findings.length !== 1 ? 's' : ''} &middot; {data.current_status}
                  </p>
                </div>
                <WorkflowTimeline data={data} />
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
