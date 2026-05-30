'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import {
  X,
  Trash2,
  Settings,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  MessageSquare,
  Zap,
  Mail,
  Bell,
  Brain,
  Calendar,
  Database,
  GitBranch,
  Play,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { panelVariants, base } from '@/lib/motion';
import { Badge, Button } from '@/components/ui';
import { NODE_TYPE_MAP } from '@/components/workflow-nodes';
import type { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '@/hooks/useWorkflowState';

interface WorkflowInspectorProps {
  open: boolean;
  node: WorkflowNode | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onClose: () => void;
  onUpdateConfig: (id: string, config: Record<string, unknown>) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onSelectNode: (id: string) => void;
}

// ── Mock live metrics ──

function getMockMetrics(nodeType: WorkflowNodeType) {
  const base = {
    trigger: { count: 42, throughput: 12, avgTime: '0.3s', weeklyData: [8, 5, 7, 12, 6, 3, 1] },
    action: { count: 24, throughput: 8, avgTime: '1.2s', weeklyData: [4, 6, 3, 2, 5, 3, 1] },
    condition: { count: 24, throughput: 24, avgTime: '0.1s', weeklyData: [5, 3, 4, 6, 2, 3, 1] },
    ai: { count: 8, throughput: 3, avgTime: '4.5s', weeklyData: [1, 2, 1, 0, 2, 1, 1] },
    notification: { count: 15, throughput: 5, avgTime: '0.8s', weeklyData: [3, 2, 1, 4, 2, 2, 1] },
    meeting: { count: 4, throughput: 1, avgTime: '2.1s', weeklyData: [1, 0, 1, 0, 1, 0, 1] },
    data: { count: 18, throughput: 6, avgTime: '0.5s', weeklyData: [3, 4, 2, 3, 2, 2, 2] },
  };
  return base[nodeType] ?? base.action;
}

const MOCK_EVENTS = [
  { id: 'ev1', title: 'Processed ticket ACME-142', time: '2m ago', icon: CheckCircle2, color: '#16a34a' },
  { id: 'ev2', title: 'Stale warning triggered', time: '15m ago', icon: AlertTriangle, color: '#e22d2d' },
  { id: 'ev3', title: 'Notification sent to #eng', time: '1h ago', icon: Bell, color: '#ca8a04' },
  { id: 'ev4', title: 'AI analysis completed', time: '2h ago', icon: Sparkles, color: '#8b5cf6' },
  { id: 'ev5', title: 'Config updated by admin', time: '5h ago', icon: Settings, color: '#8d95a3' },
];

// ── Config Forms ──

function TriggerConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Event Type</label>
        <select
          value={(config.eventType as string) ?? 'ticket_created'}
          onChange={(e) => onChange({ ...config, eventType: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="ticket_created">Ticket Created</option>
          <option value="status_changed">Status Changed</option>
          <option value="webhook">Webhook</option>
          <option value="schedule">Schedule</option>
        </select>
      </div>
      {config.eventType === 'schedule' && (
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cron Expression</label>
          <input
            type="text"
            value={(config.cron as string) ?? '0 9 * * *'}
            onChange={(e) => onChange({ ...config, cron: e.target.value })}
            className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground font-mono"
            placeholder="0 9 * * *"
          />
        </div>
      )}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Filter Conditions</label>
        <textarea
          value={(config.filter as string) ?? ''}
          onChange={(e) => onChange({ ...config, filter: e.target.value })}
          rows={2}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-none"
          placeholder='e.g. priority == "high"'
        />
      </div>
    </div>
  );
}

function ConditionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Condition Type</label>
        <select
          value={(config.conditionType as string) ?? 'stale_check'}
          onChange={(e) => onChange({ ...config, conditionType: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="stale_check">Stale Check</option>
          <option value="threshold">Threshold</option>
          <option value="status_match">Status Match</option>
          <option value="custom">Custom Expression</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Threshold (days)</label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={1}
            max={14}
            value={(config.thresholdDays as number) ?? 2}
            onChange={(e) => onChange({ ...config, thresholdDays: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <span className="text-xs font-bold text-foreground w-6 text-right">{(config.thresholdDays as number) ?? 2}</span>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Comparison</label>
        <select
          value={(config.operator as string) ?? 'gt'}
          onChange={(e) => onChange({ ...config, operator: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="gt">Greater than</option>
          <option value="lt">Less than</option>
          <option value="eq">Equal to</option>
          <option value="gte">Greater than or equal</option>
          <option value="lte">Less than or equal</option>
        </select>
      </div>
    </div>
  );
}

function NotificationConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Channel</label>
        <select
          value={(config.channel as string) ?? 'slack'}
          onChange={(e) => onChange({ ...config, channel: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="slack">Slack</option>
          <option value="teams">Microsoft Teams</option>
          <option value="email">Email</option>
          <option value="in_app">In-App</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Message Template</label>
        <textarea
          value={(config.messageTemplate as string) ?? ''}
          onChange={(e) => onChange({ ...config, messageTemplate: e.target.value })}
          rows={3}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-none"
          placeholder="Hey {{assignee}}, your ticket {{ticket_id}} needs attention..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={(config.mentionAssignee as boolean) ?? true}
          onChange={(e) => onChange({ ...config, mentionAssignee: e.target.checked })}
          className="accent-primary rounded"
        />
        <span className="text-xs text-secondary-foreground">Mention assignee</span>
      </div>
    </div>
  );
}

function AIConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Model</label>
        <select
          value={(config.model as string) ?? 'gpt-4o'}
          onChange={(e) => onChange({ ...config, model: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="claude-3.5">Claude 3.5 Sonnet</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prompt Preview</label>
        <textarea
          value={(config.prompt as string) ?? ''}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          rows={4}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-none font-mono"
          placeholder="Analyze the following ticket data and provide..."
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Temperature</label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="range"
            min={0}
            max={100}
            value={((config.temperature as number) ?? 0.3) * 100}
            onChange={(e) => onChange({ ...config, temperature: Number(e.target.value) / 100 })}
            className="flex-1 accent-[#8b5cf6]"
          />
          <span className="text-xs font-bold text-foreground w-8 text-right">{((config.temperature as number) ?? 0.3).toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

function MeetingConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Calendar Provider</label>
        <select
          value={(config.provider as string) ?? 'google'}
          onChange={(e) => onChange({ ...config, provider: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="google">Google Calendar</option>
          <option value="outlook">Outlook</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={(config.autoSync as boolean) ?? true}
          onChange={(e) => onChange({ ...config, autoSync: e.target.checked })}
          className="accent-primary rounded"
        />
        <span className="text-xs text-secondary-foreground">Auto-sync calendar events</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={(config.autoAnalyze as boolean) ?? false}
          onChange={(e) => onChange({ ...config, autoAnalyze: e.target.checked })}
          className="accent-primary rounded"
        />
        <span className="text-xs text-secondary-foreground">Auto-analyze meeting notes</span>
      </div>
    </div>
  );
}

function DataConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operation</label>
        <select
          value={(config.operation as string) ?? 'read'}
          onChange={(e) => onChange({ ...config, operation: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
          <option value="query">Query</option>
          <option value="aggregate">Aggregate</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data Source</label>
        <input
          type="text"
          value={(config.dataSource as string) ?? ''}
          onChange={(e) => onChange({ ...config, dataSource: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          placeholder="e.g. activity_stats"
        />
      </div>
    </div>
  );
}

function ActionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action Type</label>
        <select
          value={(config.actionType as string) ?? 'update_status'}
          onChange={(e) => onChange({ ...config, actionType: e.target.value })}
          className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          <option value="update_status">Update Status</option>
          <option value="create_ticket">Create Ticket</option>
          <option value="sync_board">Sync Board</option>
          <option value="create_reminder">Create Reminder</option>
          <option value="delay">Delay / Wait</option>
        </select>
      </div>
      {config.actionType === 'delay' && (
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Duration (minutes)</label>
          <input
            type="number"
            value={(config.delayMinutes as number) ?? 60}
            onChange={(e) => onChange({ ...config, delayMinutes: Number(e.target.value) })}
            className="mt-1 w-full text-xs px-3 py-2 rounded-lg border border-border/60 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            min={1}
          />
        </div>
      )}
    </div>
  );
}

const CONFIG_MAP: Record<WorkflowNodeType, React.ComponentType<{ config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }>> = {
  trigger: TriggerConfig,
  action: ActionConfig,
  condition: ConditionConfig,
  ai: AIConfig,
  notification: NotificationConfig,
  meeting: MeetingConfig,
  data: DataConfig,
};

// ── Mini bar chart ──

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(val / max) * 100}%`, backgroundColor: `${color}40`, minHeight: val > 0 ? 2 : 0 }}
          />
          <span className="text-[8px] text-secondary-foreground">{days[i]?.[0]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──

export default function WorkflowInspector({
  open,
  node,
  nodes,
  edges,
  onClose,
  onUpdateConfig,
  onUpdateLabel,
  onDelete,
  onSelectNode,
}: WorkflowInspectorProps) {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'config' | 'metrics' | 'connections' | 'activity'>('config');

  if (!node) return null;

  const cfg = NODE_TYPE_MAP[node.type];
  const Icon = cfg.icon;
  const ConfigForm = CONFIG_MAP[node.type];
  const metrics = getMockMetrics(node.type);

  const upstreamEdges = edges.filter((e) => e.targetId === node.id);
  const downstreamEdges = edges.filter((e) => e.sourceId === node.id);
  const upstreamNodes = upstreamEdges.map((e) => nodes.find((n) => n.id === e.sourceId)).filter(Boolean) as WorkflowNode[];
  const downstreamNodes = downstreamEdges.map((e) => nodes.find((n) => n.id === e.targetId)).filter(Boolean) as WorkflowNode[];

  const tabs = [
    { key: 'config' as const, label: 'Config', icon: Settings },
    { key: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
    { key: 'connections' as const, label: 'Links', icon: GitBranch },
    { key: 'activity' as const, label: 'Activity', icon: Clock },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="inspector"
          className="w-80 border-l border-border/60 bg-card flex flex-col shrink-0 overflow-hidden"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={reduceMotion ? { duration: 0.12 } : base}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cfg.color}15` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={node.label}
                    onChange={(e) => onUpdateLabel(node.id, e.target.value)}
                    className="text-sm font-bold text-foreground bg-transparent border-none outline-none w-full truncate focus:ring-1 focus:ring-primary/30 rounded px-0.5 -ml-0.5"
                  />
                  <Badge variant="muted" className="mt-0.5">{cfg.label}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onDelete(node.id)}
                  className="p-1 rounded-lg text-secondary-foreground hover:text-[#e22d2d] hover:bg-[#e22d2d]/10 transition-colors"
                  title="Delete node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/40 px-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px',
                    activeTab === tab.key
                      ? 'text-primary border-primary'
                      : 'text-secondary-foreground border-transparent hover:text-muted-foreground'
                  )}
                >
                  <TabIcon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'config' && (
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Configuration</h4>
                <ConfigForm
                  config={node.config}
                  onChange={(c) => onUpdateConfig(node.id, c)}
                />
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold" style={{ color: cfg.color }}>{metrics.count}</p>
                    <p className="text-[9px] text-muted-foreground">Total</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-foreground">{metrics.throughput}</p>
                    <p className="text-[9px] text-muted-foreground">Per day</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary text-center">
                    <p className="text-lg font-bold text-foreground">{metrics.avgTime}</p>
                    <p className="text-[9px] text-muted-foreground">Avg time</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Last 7 Days</h4>
                  <div className="p-3 rounded-lg bg-secondary">
                    <MiniBarChart data={metrics.weeklyData} color={cfg.color} />
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Tickets</h4>
                  <div className="space-y-1.5">
                    {['ACME-142', 'ACME-156', 'ACME-171'].map((ticket) => (
                      <div key={ticket} className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-xs">
                        <span className="font-mono font-medium text-primary">{ticket}</span>
                        <span className="text-muted-foreground truncate flex-1">Sample ticket title</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Upstream ({upstreamNodes.length})
                  </h4>
                  {upstreamNodes.length === 0 ? (
                    <p className="text-[10px] text-secondary-foreground py-2">No upstream connections</p>
                  ) : (
                    <div className="space-y-1.5">
                      {upstreamNodes.map((n) => {
                        const nCfg = NODE_TYPE_MAP[n.type];
                        const NIcon = nCfg.icon;
                        return (
                          <button
                            key={n.id}
                            onClick={() => onSelectNode(n.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-muted text-left transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${nCfg.color}15` }}>
                              <NIcon className="w-3 h-3" style={{ color: nCfg.color }} />
                            </div>
                            <span className="text-xs font-medium text-secondary-foreground flex-1 truncate">{n.label}</span>
                            <ArrowRight className="w-3 h-3 text-[#d1d5da]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Downstream ({downstreamNodes.length})
                  </h4>
                  {downstreamNodes.length === 0 ? (
                    <p className="text-[10px] text-secondary-foreground py-2">No downstream connections</p>
                  ) : (
                    <div className="space-y-1.5">
                      {downstreamNodes.map((n) => {
                        const nCfg = NODE_TYPE_MAP[n.type];
                        const NIcon = nCfg.icon;
                        return (
                          <button
                            key={n.id}
                            onClick={() => onSelectNode(n.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-muted text-left transition-colors"
                          >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${nCfg.color}15` }}>
                              <NIcon className="w-3 h-3" style={{ color: nCfg.color }} />
                            </div>
                            <span className="text-xs font-medium text-secondary-foreground flex-1 truncate">{n.label}</span>
                            <ArrowRight className="w-3 h-3 text-[#d1d5da]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Events</h4>
                <div className="space-y-0">
                  {MOCK_EVENTS.map((event, i) => {
                    const EvIcon = event.icon;
                    return (
                      <div key={event.id} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${event.color}15` }}
                          >
                            <EvIcon className="w-3 h-3" style={{ color: event.color }} />
                          </div>
                          {i < MOCK_EVENTS.length - 1 && (
                            <div className="w-px flex-1 min-h-[12px] bg-[#d1d5da]/80" />
                          )}
                        </div>
                        <div className="pb-3 flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground">{event.title}</p>
                          <p className="text-[9px] text-secondary-foreground">{event.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
