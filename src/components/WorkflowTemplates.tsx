'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import {
  X,
  Activity,
  Calendar,
  Gauge,
  Shield,
  Layers,
  FileText,
  Zap,
  Play,
  GitBranch,
  Brain,
  Bell,
  Database,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  ListChecks,
  Sparkles,
  Plus,
  Mail,
} from 'lucide-react';
import { overlayVariants, base } from '@/lib/motion';
import { Button, Badge } from '@/components/ui';
import { genId, NODE_DEFAULTS, type WorkflowNode, type WorkflowNodeType, type WorkflowEdge, type WorkflowTemplate } from '@/hooks/useWorkflowState';

function makeNode(type: WorkflowNodeType, label: string, x: number, y: number, overrides?: Partial<WorkflowNode>): WorkflowNode {
  const id = genId('tpl');
  const d = NODE_DEFAULTS[type];
  return {
    id,
    type,
    label,
    x,
    y,
    width: d.width,
    height: d.height,
    color: d.color,
    config: {},
    ports: d.ports.map(p => ({ ...p, id: `${id}_${p.id}` })),
    ...overrides,
  };
}

function makeEdge(src: WorkflowNode, srcPort: string, tgt: WorkflowNode, tgtPort: string, options?: Partial<WorkflowEdge>): WorkflowEdge {
  return {
    id: genId('edge'),
    sourceId: src.id,
    sourcePort: `${src.id}_${srcPort}`,
    targetId: tgt.id,
    targetPort: `${tgt.id}_${tgtPort}`,
    animated: true,
    ...options,
  };
}

function buildTicketActivityTemplate(): WorkflowTemplate {
  const n1 = makeNode('trigger', 'Ticket Created', 40, 100, { stats: { count: 42 } });
  const n2 = makeNode('action', 'In Progress', 260, 100, { stats: { count: 24 } });
  const n3 = makeNode('condition', 'Comment Check', 480, 100, { stats: { count: 24 } });
  const n4 = makeNode('action', 'Active', 680, 20, { stats: { count: 17 } });
  const n5 = makeNode('condition', 'Stale Detection', 680, 200, { stats: { count: 7 } });
  const n6 = makeNode('notification', 'Notify Assignee', 900, 100, { stats: { count: 7 } });
  const n7 = makeNode('action', 'Create Reminder', 900, 240, { stats: { count: 3 } });
  const n8 = makeNode('meeting', 'Suggest Meeting', 900, 380, { stats: { count: 1 } });
  return {
    id: 'ticket-activity',
    name: 'Ticket Activity Pipeline',
    description: 'Monitor ticket lifecycle with stale detection, notifications, and meeting suggestions.',
    nodes: [n1, n2, n3, n4, n5, n6, n7, n8],
    edges: [
      makeEdge(n1, 'out', n2, 'in'),
      makeEdge(n2, 'out', n3, 'in'),
      makeEdge(n3, 'yes', n4, 'in', { label: 'Active' }),
      makeEdge(n3, 'no', n5, 'in', { label: 'Stale' }),
      makeEdge(n5, 'yes', n6, 'in', { animated: true }),
      makeEdge(n5, 'no', n7, 'in'),
      makeEdge(n7, 'out', n8, 'in'),
    ],
  };
}

function buildMeetingInsightsTemplate(): WorkflowTemplate {
  const n1 = makeNode('meeting', 'Meeting Created', 40, 120, { stats: { count: 4 } });
  const n2 = makeNode('meeting', 'Notes Added', 260, 120, { stats: { count: 2 } });
  const n3 = makeNode('ai', 'AI Analysis', 480, 120, { stats: { count: 1 } });
  const n4 = makeNode('action', 'Action Items', 700, 20, { stats: { count: 4 } });
  const n5 = makeNode('action', 'New Tickets', 700, 160, { stats: { count: 2 } });
  const n6 = makeNode('data', 'Decisions Logged', 700, 300, { stats: { count: 3 } });
  return {
    id: 'meeting-insights',
    name: 'Meeting Insights Flow',
    description: 'Capture meetings, analyze notes with AI, and extract action items and decisions.',
    nodes: [n1, n2, n3, n4, n5, n6],
    edges: [
      makeEdge(n1, 'out', n2, 'in'),
      makeEdge(n2, 'out', n3, 'in'),
      makeEdge(n3, 'out', n4, 'in', { label: 'Items' }),
      makeEdge(n3, 'alt1', n5, 'in', { label: 'Tickets' }),
      makeEdge(n3, 'alt2', n6, 'in', { label: 'Decisions' }),
    ],
  };
}

function buildSprintHealthTemplate(): WorkflowTemplate {
  const n1 = makeNode('trigger', 'Sprint Start', 40, 140, { stats: { count: 1 } });
  const n2 = makeNode('condition', 'Daily Checks', 260, 140, { stats: { count: 14 } });
  const n3 = makeNode('ai', 'Scope Creep Detect', 500, 20, { stats: { count: 3 } });
  const n4 = makeNode('data', 'Velocity Track', 500, 160, { stats: { count: 14 } });
  const n5 = makeNode('notification', 'Burndown Alert', 500, 300, { stats: { count: 5 } });
  const n6 = makeNode('action', 'Sprint Close', 740, 160, { stats: { count: 1 } });
  return {
    id: 'sprint-health',
    name: 'Sprint Health Monitor',
    description: 'Track sprint health with daily checks, scope creep detection, and burndown alerts.',
    nodes: [n1, n2, n3, n4, n5, n6],
    edges: [
      makeEdge(n1, 'out', n2, 'in'),
      makeEdge(n2, 'yes', n3, 'in', { label: 'Scope' }),
      makeEdge(n2, 'no', n4, 'in', { label: 'Velocity' }),
      makeEdge(n3, 'out', n5, 'in', { label: 'Alert', animated: true }),
      makeEdge(n4, 'out', n6, 'in'),
      makeEdge(n5, 'out', n6, 'in'),
    ],
  };
}

function buildPIIDetectionTemplate(): WorkflowTemplate {
  const n1 = makeNode('trigger', 'Ticket Scanned', 40, 140, { stats: { count: 120 } });
  const n2 = makeNode('condition', 'PII Found?', 260, 140, { stats: { count: 18 } });
  const n3 = makeNode('ai', 'AI Classify', 480, 140, { stats: { count: 15 } });
  const n4 = makeNode('action', 'Auto-Redact', 700, 20, { stats: { count: 8 } });
  const n5 = makeNode('action', 'Manual Review', 700, 160, { stats: { count: 5 } });
  const n6 = makeNode('notification', 'Escalate', 700, 300, { stats: { count: 2 } });
  return {
    id: 'pii-detection',
    name: 'PII Detection Flow',
    description: 'Scan tickets for PII, classify with AI, and handle remediation automatically.',
    nodes: [n1, n2, n3, n4, n5, n6],
    edges: [
      makeEdge(n1, 'out', n2, 'in'),
      makeEdge(n2, 'yes', n3, 'in', { label: 'Found', animated: true }),
      makeEdge(n3, 'out', n4, 'in', { label: 'Auto' }),
      makeEdge(n3, 'alt1', n5, 'in', { label: 'Review' }),
      makeEdge(n3, 'alt2', n6, 'in', { label: 'Critical' }),
    ],
  };
}

function buildFullSystemTemplate(): WorkflowTemplate {
  const t1 = buildTicketActivityTemplate();
  const t2 = buildMeetingInsightsTemplate();
  const offset = { x: 0, y: 460 };
  const idMap = new Map<string, string>();
  const movedNodes = t2.nodes.map((n) => {
    const newId = genId('tpl');
    idMap.set(n.id, newId);
    return {
      ...n,
      id: newId,
      x: n.x + offset.x,
      y: n.y + offset.y,
      ports: n.ports.map(p => ({ ...p, id: p.id.replace(n.id, newId) })),
    };
  });
  const movedEdges = t2.edges.map((e) => {
    const newSrcId = idMap.get(e.sourceId) ?? e.sourceId;
    const newTgtId = idMap.get(e.targetId) ?? e.targetId;
    return {
      ...e,
      id: genId('edge'),
      sourceId: newSrcId,
      targetId: newTgtId,
      sourcePort: e.sourcePort.replace(e.sourceId, newSrcId),
      targetPort: e.targetPort.replace(e.targetId, newTgtId),
    };
  });
  return {
    id: 'full-system',
    name: 'Full System',
    description: 'Complete workflow combining ticket activity pipeline and meeting insights.',
    nodes: [...t1.nodes, ...movedNodes],
    edges: [...t1.edges, ...movedEdges],
  };
}

function buildBlankTemplate(): WorkflowTemplate {
  return {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty canvas.',
    nodes: [],
    edges: [],
  };
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  buildTicketActivityTemplate(),
  buildMeetingInsightsTemplate(),
  buildSprintHealthTemplate(),
  buildPIIDetectionTemplate(),
  buildFullSystemTemplate(),
  buildBlankTemplate(),
];

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  'ticket-activity': Activity,
  'meeting-insights': Calendar,
  'sprint-health': Gauge,
  'pii-detection': Shield,
  'full-system': Layers,
  blank: FileText,
};

const TEMPLATE_COLORS: Record<string, string> = {
  'ticket-activity': '#22C55E',
  'meeting-insights': '#2563EB',
  'sprint-health': '#ca8a04',
  'pii-detection': '#e22d2d',
  'full-system': '#8b5cf6',
  blank: '#8d95a3',
};

// ── Mini Preview (thumbnail in list) ──

function MiniPreview({ template, color }: { template: WorkflowTemplate; color: string }) {
  if (template.nodes.length === 0) {
    return (
      <div className="w-full h-10 bg-[#FAFAF8] rounded-md flex items-center justify-center border border-dashed border-border">
        <Plus className="w-3.5 h-3.5 text-[#d1d5da]" />
      </div>
    );
  }

  const pad = 15;
  const xs = template.nodes.map((n) => n.x);
  const ys = template.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + 200 + pad;
  const maxY = Math.max(...ys) + 80 + pad;

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="w-full h-10 rounded-md" style={{ background: `${color}06` }}>
      {template.edges.map((edge) => {
        const src = template.nodes.find((n) => n.id === edge.sourceId);
        const tgt = template.nodes.find((n) => n.id === edge.targetId);
        if (!src || !tgt) return null;
        const sx = src.x + 80, sy = src.y + 32, tx = tgt.x + 80, ty = tgt.y + 32;
        const cp = Math.max(40, Math.abs(tx - sx) * 0.4);
        return <path key={edge.id} d={`M ${sx} ${sy} C ${sx + cp} ${sy}, ${tx - cp} ${ty}, ${tx} ${ty}`} stroke={color} strokeWidth={2} strokeOpacity={0.2} fill="none" />;
      })}
      {template.nodes.map((node) => (
        <rect key={node.id} x={node.x} y={node.y + 10} width={160} height={44} rx={8} fill={color} opacity={0.15} stroke={color} strokeWidth={1.5} strokeOpacity={0.25} />
      ))}
    </svg>
  );
}

// ── Large Detail Preview ──

function DetailPreview({ template }: { template: WorkflowTemplate }) {
  if (template.nodes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-secondary-foreground gap-2">
        <Plus className="w-8 h-8 text-[#d1d5da]" />
        <span className="text-xs">Empty canvas — start from scratch</span>
      </div>
    );
  }

  const pad = 60;
  const xs = template.nodes.map((n) => n.x);
  const ys = template.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + 200 + pad;
  const maxY = Math.max(...ys) + 90 + pad;
  const vw = maxX - minX;
  const vh = maxY - minY;

  return (
    <svg viewBox={`${minX} ${minY} ${vw} ${vh}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="tpl-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="#C4BFB6" />
        </marker>
      </defs>

      {/* Edges */}
      {template.edges.map((edge) => {
        const src = template.nodes.find((n) => n.id === edge.sourceId);
        const tgt = template.nodes.find((n) => n.id === edge.targetId);
        if (!src || !tgt) return null;
        const sx = src.x + 160, sy = src.y + 36;
        const tx = tgt.x, ty = tgt.y + 36;
        const cpx = Math.max(50, Math.abs(tx - sx) * 0.4);
        const d = `M ${sx} ${sy} C ${sx + cpx} ${sy}, ${tx - cpx} ${ty}, ${tx} ${ty}`;
        return (
          <g key={edge.id}>
            <path d={d} stroke="#d1d5da" strokeWidth={2} fill="none" markerEnd="url(#tpl-arrow)" />
            {edge.label && (() => {
              const mx = (sx + tx) / 2, my = (sy + ty) / 2;
              return (
                <g>
                  <rect x={mx - 24} y={my - 9} width={48} height={18} rx={4} fill="white" stroke="#d1d5da" strokeWidth={1} />
                  <text x={mx} y={my + 4} textAnchor="middle" className="text-[8px] fill-[#8d95a3]" style={{ fontFamily: 'system-ui', fontSize: 8 }}>{edge.label}</text>
                </g>
              );
            })()}
          </g>
        );
      })}

      {/* Nodes */}
      {template.nodes.map((node) => {
        const color = node.color || TEMPLATE_COLORS[template.id] || '#22C55E';
        const nw = 160, nh = 56;
        const ny = node.y + 8;
        return (
          <g key={node.id}>
            <rect x={node.x} y={ny} width={nw} height={nh} rx={10} fill="white" stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
            <rect x={node.x} y={ny} width={nw} height={nh} rx={10} fill={color} opacity={0.07} />
            {/* Color accent bar */}
            <rect x={node.x} y={ny} width={4} height={nh} rx={2} fill={color} opacity={0.6} />
            {/* Label */}
            <text x={node.x + 16} y={ny + 22} className="text-[10px] font-semibold fill-[#00112c]" style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 600 }}>
              {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
            </text>
            {/* Type badge */}
            <rect x={node.x + 16} y={ny + 30} width={node.type.length * 5.2 + 10} height={14} rx={3} fill={color} opacity={0.12} />
            <text x={node.x + 21} y={ny + 40} style={{ fontFamily: 'system-ui', fontSize: 7, fill: color, fontWeight: 500 }}>
              {node.type}
            </text>
            {/* Stats pill */}
            {node.stats && (
              <>
                <rect x={node.x + nw - 40} y={ny + 30} width={30} height={14} rx={3} fill="#f7f7f8" stroke="#d1d5da" strokeWidth={0.5} />
                <text x={node.x + nw - 25} y={ny + 40} textAnchor="middle" style={{ fontFamily: 'system-ui', fontSize: 7, fill: '#8d95a3', fontWeight: 600 }}>
                  {node.stats.count}
                </text>
              </>
            )}
            {/* Input port */}
            {node.ports.some(p => p.type === 'input') && (
              <circle cx={node.x} cy={ny + nh / 2} r={4} fill="white" stroke={color} strokeWidth={1.5} />
            )}
            {/* Output port(s) */}
            {(() => {
              const outs = node.ports.filter(p => p.type === 'output');
              if (outs.length <= 1) return <circle cx={node.x + nw} cy={ny + nh / 2} r={4} fill="white" stroke={color} strokeWidth={1.5} />;
              return outs.map((_, i) => {
                const spacing = nh / (outs.length + 1);
                return <circle key={i} cx={node.x + nw} cy={ny + spacing * (i + 1)} r={3.5} fill="white" stroke={color} strokeWidth={1.5} />;
              });
            })()}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component ──

interface WorkflowTemplatesProps {
  open: boolean;
  onClose: () => void;
  onApply: (template: WorkflowTemplate) => void;
}

export default function WorkflowTemplates({ open, onClose, onApply }: WorkflowTemplatesProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<string>(WORKFLOW_TEMPLATES[0]?.id ?? '');

  const selectedTemplate = WORKFLOW_TEMPLATES.find(t => t.id === selected) ?? WORKFLOW_TEMPLATES[0];

  const handleApply = () => {
    if (!selectedTemplate) return;
    onApply(selectedTemplate);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            className="absolute inset-0 bg-black/40"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={base}
            onClick={onClose}
          />

          <motion.div
            className="relative bg-card rounded-2xl border border-border/60 shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={reduceMotion ? { duration: 0.12 } : base}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground">Choose a Template</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select a template to preview, then use it to create your workflow.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-panel body */}
            <div className="flex flex-1 min-h-0">
              {/* Left: template list */}
              <div className="w-64 shrink-0 border-r border-border/40 overflow-y-auto py-2">
                {WORKFLOW_TEMPLATES.map((template) => {
                  const TplIcon = TEMPLATE_ICONS[template.id] ?? Layers;
                  const color = TEMPLATE_COLORS[template.id] ?? '#22C55E';
                  const isActive = selected === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelected(template.id)}
                      className={clsx(
                        'w-full text-left px-4 py-3 transition-colors',
                        isActive
                          ? 'bg-primary/8 border-r-2 border-primary'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <TplIcon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={clsx('text-xs font-semibold truncate', isActive ? 'text-foreground' : 'text-secondary-foreground')}>
                            {template.name}
                          </h4>
                          <span className="text-[10px] text-secondary-foreground">
                            {template.nodes.length} nodes · {template.edges.length} edges
                          </span>
                        </div>
                      </div>
                      <MiniPreview template={template} color={color} />
                    </button>
                  );
                })}
              </div>

              {/* Right: preview + details */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedTemplate && (
                  <>
                    {/* Preview canvas */}
                    <div className="flex-1 bg-[#FAFAF8] p-4 min-h-0">
                      <div className="w-full h-full rounded-xl border border-border/40 bg-card overflow-hidden p-3">
                        <DetailPreview template={selectedTemplate} />
                      </div>
                    </div>

                    {/* Footer with details + apply */}
                    <div className="shrink-0 border-t border-border/40 px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const TplIcon = TEMPLATE_ICONS[selectedTemplate.id] ?? Layers;
                            const color = TEMPLATE_COLORS[selectedTemplate.id] ?? '#22C55E';
                            return (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                                <TplIcon className="w-4 h-4" style={{ color }} />
                              </div>
                            );
                          })()}
                          <div>
                            <h3 className="text-sm font-bold text-foreground">{selectedTemplate.name}</h3>
                            <p className="text-[11px] text-muted-foreground">{selectedTemplate.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 mr-2">
                          <Badge variant="muted">{selectedTemplate.nodes.length} nodes</Badge>
                          <Badge variant="muted">{selectedTemplate.edges.length} edges</Badge>
                        </div>
                        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" size="md" onClick={handleApply}>
                          <Play className="w-3.5 h-3.5" /> Use Template
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
