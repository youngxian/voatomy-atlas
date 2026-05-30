'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GitMerge,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Rocket,
  Target,
  Eye,
  Brain,
  Sparkles,
  Users,
  DollarSign,
  Zap,
  Shield,
  Plus,
  X,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { BacklogIllustration } from '@/components/EmptyIllustrations';
import { Reveal } from '@/components/Reveal';
import {
  getDependencies,
  getDependencySummary,
  getTickets,
  createDependency,
  updateDependency,
  deleteDependency,
  type Dependency as APIDep,
  type DependencySummary,
  type Ticket as APITicket,
} from '@/lib/api';
import { useProject } from '@/lib/project-context';

// ─── Types ──────────────────────────────────────────────────────────────────

type DepStatus = 'clear' | 'at-risk' | 'blocked' | 'resolved';

interface DepTicket {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  points: number;
  sprint: string;
  team: string;
  module: string;
}

interface Dependency {
  id: string;
  from: string;
  to: string;
  type: 'blocks' | 'depends-on' | 'relates-to';
  depStatus: DepStatus;
  riskMessage?: string;
  revenueImpact?: number;
  criticalPath: boolean;
}

interface DepChain {
  id: string;
  name: string;
  tickets: string[];
  status: DepStatus;
  totalPoints: number;
  criticalPath: boolean;
  risk: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapApiDep(d: APIDep): Dependency {
  return {
    id: d.id,
    from: d.source_ticket_id,
    to: d.target_ticket_id,
    type: d.type === 'blocks' ? 'blocks' : d.type === 'blocked_by' ? 'depends-on' : 'relates-to',
    depStatus: d.status === 'resolved' ? 'resolved' : 'clear',
    criticalPath: false,
  };
}

function mapApiTicket(t: APITicket): DepTicket {
  return {
    id: t.id,
    title: t.title,
    status: (t.status === 'in_review' ? 'review' : t.status) as DepTicket['status'],
    assignee: t.assignee_id || 'Unassigned',
    assigneeInitials: (t.assignee_id || 'UN').slice(0, 2).toUpperCase(),
    assigneeColor: 'var(--primary)',
    points: t.human_points ?? t.ai_points ?? 0,
    sprint: '',
    team: '',
    module: t.labels?.[0] || 'general',
  };
}

/**
 * Build dependency chains by walking the "blocks" graph.
 * A chain is a maximal path through source→target edges of type "blocks".
 */
function buildChains(deps: Dependency[], ticketMap: Record<string, DepTicket>): DepChain[] {
  const blocksDeps = deps.filter(d => d.type === 'blocks' && d.depStatus !== 'resolved');
  if (blocksDeps.length === 0) return [];

  const adj = new Map<string, string[]>();
  const inbound = new Set<string>();
  for (const d of blocksDeps) {
    if (!adj.has(d.from)) adj.set(d.from, []);
    adj.get(d.from)!.push(d.to);
    inbound.add(d.to);
  }

  // Chain roots: tickets that appear as source but not as target
  const roots = [...adj.keys()].filter(k => !inbound.has(k));
  if (roots.length === 0) {
    // Cycle — just pick first source as root
    roots.push(blocksDeps[0].from);
  }

  const visited = new Set<string>();
  const chains: DepChain[] = [];

  for (const root of roots) {
    if (visited.has(root)) continue;
    const path: string[] = [];
    let current: string | undefined = root;
    while (current && !visited.has(current)) {
      visited.add(current);
      path.push(current);
      const nexts = adj.get(current);
      current = nexts?.[0];
    }
    if (path.length < 2) continue;

    const statuses = path.map(tid => {
      const dep = blocksDeps.find(d => d.from === tid);
      return dep?.depStatus;
    }).filter(Boolean);
    const chainStatus: DepStatus = statuses.includes('blocked') ? 'blocked' : statuses.includes('at-risk') ? 'at-risk' : 'clear';

    const totalPoints = path.reduce((sum, tid) => sum + (ticketMap[tid]?.points ?? 0), 0);
    const names = path.map(tid => ticketMap[tid]?.id || tid).join(' → ');

    chains.push({
      id: `chain-${root}`,
      name: names,
      tickets: path,
      status: chainStatus,
      totalPoints,
      criticalPath: chainStatus === 'blocked',
      risk: chainStatus === 'blocked'
        ? `Chain is blocked — ${path.length} tickets (${totalPoints}pts) cannot progress.`
        : chainStatus === 'at-risk'
          ? `Chain is at risk — ${path.length} tickets may be delayed.`
          : `Chain is clear — ${path.length} tickets progressing normally.`,
    });
  }

  return chains.sort((a, b) => {
    const order: Record<DepStatus, number> = { blocked: 0, 'at-risk': 1, clear: 2, resolved: 3 };
    return order[a.status] - order[b.status];
  });
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; iconBg: string; icon: React.ElementType }> = {
  backlog: { label: 'Backlog', color: 'var(--muted-foreground)', iconBg: 'bg-muted-foreground/10', icon: Clock },
  todo: { label: 'To Do', color: 'var(--muted-foreground)', iconBg: 'bg-muted-foreground/10', icon: Target },
  in_progress: { label: 'In Progress', color: 'var(--primary)', iconBg: 'bg-primary/10', icon: Rocket },
  review: { label: 'Review', color: 'var(--primary)', iconBg: 'bg-primary/10', icon: Eye },
  done: { label: 'Done', color: 'var(--success)', iconBg: 'bg-success/10', icon: CheckCircle2 },
};

const DEP_STATUS_META: Record<DepStatus, { label: string; color: string; bg: string; iconBg: string; dividerBg: string }> = {
  clear: { label: 'Clear', color: 'var(--success)', bg: 'bg-success/10 text-success border-success/15', iconBg: 'bg-success/10', dividerBg: 'bg-success/40' },
  'at-risk': { label: 'At Risk', color: 'var(--warning)', bg: 'bg-warning/10 text-warning border-warning/15', iconBg: 'bg-warning/10', dividerBg: 'bg-warning/40' },
  blocked: { label: 'Blocked', color: 'var(--destructive)', bg: 'bg-destructive/10 text-destructive border-destructive/15', iconBg: 'bg-destructive/10', dividerBg: 'bg-destructive/40' },
  resolved: { label: 'Resolved', color: 'var(--success)', bg: 'bg-success/10 text-success border-success/15', iconBg: 'bg-success/10', dividerBg: 'bg-success/40' },
};

// ─── Dependency Chain Card ──────────────────────────────────────────────────

function ChainCard({ chain, deps, tickets }: { chain: DepChain; deps: Dependency[]; tickets: Record<string, DepTicket> }) {
  const [expanded, setExpanded] = useState(chain.status === 'blocked');
  const meta = DEP_STATUS_META[chain.status];

  return (
    <div style={chain.criticalPath ? { borderLeftColor: meta.color, borderLeftWidth: '3px', borderLeftStyle: 'solid', borderRadius: '12px' } : undefined}>
    <Card className="bento-card !p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`section-chain-${chain.id}`}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}>
          <GitMerge className="w-4.5 h-4.5" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{chain.name}</span>
            <Badge variant={chain.status === 'blocked' ? 'danger' : chain.status === 'at-risk' ? 'warning' : 'success'}>{meta.label}</Badge>
            {chain.criticalPath && <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">CRITICAL PATH</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{chain.tickets.length} tickets</span>
            <span>{chain.totalPoints}pts</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-secondary-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-secondary-foreground shrink-0" />}
      </button>

      {expanded && (
        <div id={`section-chain-${chain.id}`} role="region" aria-label={chain.name} className="border-t border-border/60">
          <div className="px-4 py-3 bg-muted border-b border-border/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary">Chain Assessment</span>
            </div>
            <p className="text-[11px] text-secondary-foreground leading-relaxed">{chain.risk}</p>
          </div>

          <div className="px-4 py-3">
            <div className="flex flex-col gap-1">
              {chain.tickets.map((tid, idx) => {
                const t = tickets[tid];
                if (!t) return null;
                const sm = STATUS_META[t.status] ?? STATUS_META.backlog;
                const SIcon = sm.icon;
                const dep = idx < chain.tickets.length - 1 ? deps.find(d => d.from === tid && chain.tickets.includes(d.to)) : null;
                const depMeta = dep ? DEP_STATUS_META[dep.depStatus] : null;

                return (
                  <div key={tid}>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors" style={{ animation: `fadeSlideIn 0.2s ease-out ${idx * 0.05}s both` }}>
                      <span className="w-6 text-center text-[10px] font-bold tabular-nums text-secondary-foreground">{idx + 1}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sm.iconBg}`}>
                        <SIcon className="w-3.5 h-3.5" style={{ color: sm.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{t.id}</span>
                          <span className="text-xs font-medium text-foreground truncate">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-secondary-foreground">
                          {t.team && <><span>{t.team}</span><span>&middot;</span></>}
                          <span>{t.points}pts</span>
                          {t.sprint && <><span>&middot;</span><span>{t.sprint}</span></>}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: t.assigneeColor }}>
                        {t.assigneeInitials}
                      </div>
                    </div>
                    {dep && depMeta && (
                      <div className="flex items-center gap-2 ml-9 py-1">
                        <div className={`w-px h-4 ml-3 ${depMeta.dividerBg}`} />
                        <ArrowRight className="w-3 h-3" style={{ color: depMeta.color }} />
                        <span className="text-[9px] font-medium" style={{ color: depMeta.color }}>
                          {dep.type === 'blocks' ? 'blocks' : dep.type === 'depends-on' ? 'required by' : 'relates to'} →
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
    </div>
  );
}

// ─── Dependency Graph (Wire Flow) ───────────────────────────────────────────

interface GraphNode {
  id: string;
  ticket: DepTicket;
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  from: string;
  to: string;
  dep: Dependency;
}

function layoutGraph(deps: Dependency[], ticketMap: Record<string, DepTicket>): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const relevantIds = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const d of deps) {
    if (ticketMap[d.from] && ticketMap[d.to]) {
      relevantIds.add(d.from);
      relevantIds.add(d.to);
      edges.push({ from: d.from, to: d.to, dep: d });
    }
  }

  if (relevantIds.size === 0) return { nodes: [], edges: [] };

  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of relevantIds) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }
  for (const e of edges) {
    adj.get(e.from)!.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  // Topological level assignment via Kahn's algorithm
  const levels = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) { queue.push(id); levels.set(id, 0); }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curLevel = levels.get(cur) ?? 0;
    for (const next of adj.get(cur) ?? []) {
      const newLevel = curLevel + 1;
      if (!levels.has(next) || newLevel > levels.get(next)!) levels.set(next, newLevel);
      inDegree.set(next, (inDegree.get(next) ?? 1) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  // Assign remaining (cycle members) a level
  for (const id of relevantIds) {
    if (!levels.has(id)) levels.set(id, 0);
  }

  // Group by level
  const byLevel = new Map<number, string[]>();
  for (const [id, lvl] of levels) {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(id);
  }

  const NODE_W = 180;
  const NODE_H = 56;
  const GAP_X = 80;
  const GAP_Y = 24;
  const PAD = 40;

  const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);
  const nodes: GraphNode[] = [];

  for (const lvl of sortedLevels) {
    const col = byLevel.get(lvl)!;
    col.forEach((id, row) => {
      nodes.push({
        id,
        ticket: ticketMap[id],
        x: PAD + lvl * (NODE_W + GAP_X),
        y: PAD + row * (NODE_H + GAP_Y),
        level: lvl,
      });
    });
  }

  return { nodes, edges };
}

function DependencyGraph({ deps, tickets }: { deps: Dependency[]; tickets: Record<string, DepTicket> }) {
  const { nodes, edges } = useMemo(() => layoutGraph(deps, tickets), [deps, tickets]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  if (nodes.length === 0) {
    return (
      <Card className="bento-card py-10 text-center">
        <GitMerge className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">No dependencies to visualize. Add dependencies to see the graph.</p>
      </Card>
    );
  }

  const NODE_W = 180;
  const NODE_H = 56;
  const maxX = Math.max(...nodes.map(n => n.x)) + NODE_W + 40;
  const maxY = Math.max(...nodes.map(n => n.y)) + NODE_H + 40;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const connectedToHovered = new Set<string>();
  if (hoveredNode) {
    for (const e of edges) {
      if (e.from === hoveredNode || e.to === hoveredNode) {
        connectedToHovered.add(e.from);
        connectedToHovered.add(e.to);
      }
    }
  }

  return (
    <Card className="bento-card !p-0 overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        <svg width={maxX} height={maxY} className="block" style={{ minWidth: maxX, minHeight: maxY }}>
          <defs>
            <marker id="arrow-clear" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--success)" />
            </marker>
            <marker id="arrow-blocked" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--destructive)" />
            </marker>
            <marker id="arrow-at-risk" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--warning)" />
            </marker>
            <marker id="arrow-resolved" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--muted-foreground)" />
            </marker>
            <marker id="arrow-muted" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--border)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return null;

            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;
            const midX = (x1 + x2) / 2;

            const isHoveredEdge = hoveredEdge === `${e.from}-${e.to}`;
            const dimmed = hoveredNode && !connectedToHovered.has(e.from) && !connectedToHovered.has(e.to);
            const statusKey = e.dep.depStatus;
            const strokeColor = statusKey === 'blocked' ? 'var(--destructive)' : statusKey === 'at-risk' ? 'var(--warning)' : statusKey === 'resolved' ? 'var(--muted-foreground)' : 'var(--success)';
            const markerId = dimmed ? 'arrow-muted' : `arrow-${statusKey}`;

            return (
              <g
                key={`edge-${i}`}
                onMouseEnter={() => setHoveredEdge(`${e.from}-${e.to}`)}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s' }}
              >
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={dimmed ? 'var(--border)' : strokeColor}
                  strokeWidth={isHoveredEdge ? 2.5 : 1.5}
                  strokeDasharray={statusKey === 'resolved' ? '4,3' : undefined}
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-200"
                />
                {isHoveredEdge && (
                  <text x={midX} y={Math.min(y1, y2) - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9, fontWeight: 600 }}>
                    {e.dep.type}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const sm = STATUS_META[node.ticket.status] ?? STATUS_META.backlog;
            const dimmed = hoveredNode && hoveredNode !== node.id && !connectedToHovered.has(node.id);
            const isHovered = hoveredNode === node.id;
            const isBlocked = deps.some(d => d.to === node.id && d.depStatus === 'blocked');
            const isBlocking = deps.some(d => d.from === node.id && d.depStatus === 'blocked');

            const borderColor = isBlocked ? 'var(--destructive)' : isBlocking ? 'var(--warning)' : isHovered ? 'var(--primary)' : 'var(--border)';

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill="var(--card)"
                  stroke={borderColor}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-200"
                  style={isHovered ? { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' } : undefined}
                />
                {/* Status dot */}
                <circle
                  cx={node.x + 14}
                  cy={node.y + NODE_H / 2}
                  r={4}
                  fill={sm.color}
                />
                {/* Ticket ID */}
                <text
                  x={node.x + 26}
                  y={node.y + 22}
                  className="fill-primary"
                  style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {node.ticket.id.length > 12 ? node.ticket.id.slice(0, 12) + '…' : node.ticket.id}
                </text>
                {/* Title */}
                <text
                  x={node.x + 26}
                  y={node.y + 38}
                  className="fill-muted-foreground"
                  style={{ fontSize: 9.5, fontWeight: 500 }}
                >
                  {node.ticket.title.length > 20 ? node.ticket.title.slice(0, 20) + '…' : node.ticket.title}
                </text>
                {/* Points badge */}
                <text
                  x={node.x + NODE_W - 12}
                  y={node.y + 22}
                  textAnchor="end"
                  className="fill-foreground"
                  style={{ fontSize: 9, fontWeight: 700 }}
                >
                  {node.ticket.points}pt
                </text>
                {/* Assignee circle */}
                <circle
                  cx={node.x + NODE_W - 14}
                  cy={node.y + 38}
                  r={8}
                  fill={node.ticket.assigneeColor}
                />
                <text
                  x={node.x + NODE_W - 14}
                  y={node.y + 41}
                  textAnchor="middle"
                  fill="white"
                  style={{ fontSize: 7, fontWeight: 700 }}
                >
                  {node.ticket.assigneeInitials}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/60 bg-muted/50 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Legend</span>
        {[
          { label: 'Clear', color: 'var(--success)' },
          { label: 'At Risk', color: 'var(--warning)' },
          { label: 'Blocked', color: 'var(--destructive)' },
          { label: 'Resolved', color: 'var(--muted-foreground)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke={l.color} strokeWidth={2} strokeDasharray={l.label === 'Resolved' ? '3,2' : undefined} /></svg>
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <svg width={12} height={12}><circle cx={6} cy={6} r={4} fill="var(--primary)" /></svg>
          <span className="text-[10px] text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width={12} height={12}><circle cx={6} cy={6} r={4} fill="var(--success)" /></svg>
          <span className="text-[10px] text-muted-foreground">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width={12} height={12}><circle cx={6} cy={6} r={4} fill="var(--muted-foreground)" /></svg>
          <span className="text-[10px] text-muted-foreground">To Do</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Dependency Table ───────────────────────────────────────────────────────

function DependencyTable({
  deps,
  tickets,
  projectId,
  onResolve,
  onDelete,
  resolvingId,
  deletingId,
}: {
  deps: Dependency[];
  tickets: Record<string, DepTicket>;
  projectId: string;
  onResolve: (dep: Dependency) => void;
  onDelete: (dep: Dependency) => void;
  resolvingId: string | null;
  deletingId: string | null;
}) {
  return (
    <Card className="bento-card !p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted">
              <th className="text-left py-2.5 px-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">From</th>
              <th className="text-left py-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Type</th>
              <th className="text-left py-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">To</th>
              <th className="text-left py-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</th>
              <th className="text-left py-2.5 px-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deps.map((d, i) => {
              const fromT = tickets[d.from];
              const toT = tickets[d.to];
              const meta = DEP_STATUS_META[d.depStatus];
              if (!fromT || !toT) return null;
              return (
                <tr key={d.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted transition-colors" style={{ animation: `fadeSlideIn 0.2s ease-out ${i * 0.03}s both` }}>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-primary">{fromT.id}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{fromT.title}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                      {d.type}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-primary">{toT.id}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{toT.title}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${meta.bg}`}>{meta.label}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {d.depStatus !== 'resolved' && (
                        <button
                          onClick={() => onResolve(d)}
                          disabled={resolvingId === d.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-50"
                        >
                          {resolvingId === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(d)}
                        disabled={deletingId === d.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        {deletingId === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Add Dependency Modal ───────────────────────────────────────────────────

function AddDependencyModal({
  open,
  onClose,
  ticketOptions,
  projectId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  ticketOptions: DepTicket[];
  projectId: string;
  onCreated: () => void;
}) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState<'blocks' | 'blocked_by' | 'relates'>('blocks');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!source || !target) { setError('Select both tickets.'); return; }
    if (source === target) { setError('A ticket cannot depend on itself.'); return; }
    setSaving(true);
    setError(null);
    try {
      await createDependency(projectId, { source_ticket_id: source, target_ticket_id: target, type });
      onCreated();
      onClose();
      setSource('');
      setTarget('');
      setType('blocks');
    } catch {
      setError('Failed to create dependency. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Add Dependency</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/15">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Source Ticket</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground">
              <option value="">Select ticket...</option>
              {ticketOptions.map(t => <option key={t.id} value={t.id}>{t.id} — {t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Dependency Type</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground">
              <option value="blocks">Blocks</option>
              <option value="blocked_by">Blocked By</option>
              <option value="relates">Relates To</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Target Ticket</label>
            <select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground">
              <option value="">Select ticket...</option>
              {ticketOptions.map(t => <option key={t.id} value={t.id}>{t.id} — {t.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={saving} disabled={saving}>
            <Plus className="w-3 h-3" />
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DependenciesPage() {
  const [ticketMap, setTicketMap] = useState<Record<string, DepTicket>>({});
  const [allDeps, setAllDeps] = useState<Dependency[]>([]);
  const [summary, setSummary] = useState<DependencySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'graph' | 'chains' | 'table' | 'teams'>('graph');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { activeProjectId } = useProject();
  const projectId = activeProjectId;

  const fetchAll = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [apiDeps, apiTickets, apiSummary] = await Promise.all([
        getDependencies(projectId),
        getTickets(projectId),
        getDependencySummary(projectId),
      ]);
      const tMap: Record<string, DepTicket> = {};
      (apiTickets ?? []).forEach(t => {
        const mapped = mapApiTicket(t);
        tMap[mapped.id] = mapped;
      });
      setTicketMap(tMap);
      setAllDeps((apiDeps ?? []).map(mapApiDep));
      setSummary(apiSummary);
    } catch {
      setError('Failed to load dependencies. Please check that a project is selected.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Computed chains
  const depChains = useMemo(() => buildChains(allDeps, ticketMap), [allDeps, ticketMap]);

  const filteredDeps = statusFilter === 'all' ? allDeps : allDeps.filter(d => d.depStatus === statusFilter);
  const filteredChains = statusFilter === 'all' ? depChains : depChains.filter(c => c.status === statusFilter);

  const graphNodeCount = useMemo(() => {
    const ids = new Set<string>();
    for (const d of allDeps) { if (ticketMap[d.from] && ticketMap[d.to]) { ids.add(d.from); ids.add(d.to); } }
    return ids.size;
  }, [allDeps, ticketMap]);
  const nodes_count = graphNodeCount;

  const blockedCount = summary?.by_status?.active ?? allDeps.filter(d => d.depStatus === 'blocked').length;
  const resolvedCount = summary?.resolved ?? allDeps.filter(d => d.depStatus === 'resolved').length;
  const totalCount = summary?.total ?? allDeps.length;
  const blocksCount = summary?.blocks ?? allDeps.filter(d => d.type === 'blocks').length;

  const teamDeps = useMemo(() => {
    const teams = new Map<string, { team: string; tickets: DepTicket[]; blockedBy: number; blocking: number }>();
    Object.values(ticketMap).forEach(t => {
      const teamName = t.team || 'Unassigned';
      if (!teams.has(teamName)) teams.set(teamName, { team: teamName, tickets: [], blockedBy: 0, blocking: 0 });
      teams.get(teamName)!.tickets.push(t);
    });
    allDeps.forEach(d => {
      const fromT = ticketMap[d.from];
      const toT = ticketMap[d.to];
      if (fromT && toT && fromT.team !== toT.team && d.type === 'blocks') {
        const fromTeam = teams.get(fromT.team);
        const toTeam = teams.get(toT.team);
        if (fromTeam) fromTeam.blocking++;
        if (toTeam) toTeam.blockedBy++;
      }
    });
    return [...teams.values()];
  }, [ticketMap, allDeps]);

  // Action handlers
  const handleResolve = useCallback(async (dep: Dependency) => {
    if (!projectId) return;
    setResolvingId(dep.id);
    try {
      await updateDependency(projectId, dep.id, { status: 'resolved' });
      await fetchAll();
    } catch {
      setError('Failed to resolve dependency.');
    } finally {
      setResolvingId(null);
    }
  }, [projectId, fetchAll]);

  const handleDelete = useCallback(async (dep: Dependency) => {
    if (!projectId) return;
    const confirmed = window.confirm(`Delete this dependency (${dep.from} → ${dep.to})? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(dep.id);
    try {
      await deleteDependency(projectId, dep.id);
      await fetchAll();
    } catch {
      setError('Failed to delete dependency.');
    } finally {
      setDeletingId(null);
    }
  }, [projectId, fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <EmptyState
        icon={GitMerge}
        title="No project selected"
        description="Select a project from the project switcher to view dependencies."
        illustration={<BacklogIllustration className="w-[220px] h-[176px]" />}
      />
    );
  }

  if (allDeps.length === 0 && !error) {
    return (
      <>
        <EmptyState
          icon={GitMerge}
          title="No dependencies found"
          description="Dependencies will appear here once your project has tickets with cross-team or cross-module relationships."
          actionLabel="Add Dependency"
          onAction={() => setShowAddModal(true)}
          illustration={<BacklogIllustration className="w-[220px] h-[176px]" />}
        />
        <AddDependencyModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          ticketOptions={Object.values(ticketMap)}
          projectId={projectId}
          onCreated={fetchAll}
        />
      </>
    );
  }

  return (
    <>
      <Reveal>
        <div className="space-y-5 pb-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center">
                <GitMerge className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>Dependencies</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{totalCount} dependencies across {Object.keys(ticketMap).length} tickets &middot; {depChains.length} chains</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-secondary-foreground">
                <option value="all">All Statuses</option>
                <option value="blocked">Blocked</option>
                <option value="at-risk">At Risk</option>
                <option value="clear">Clear</option>
                <option value="resolved">Resolved</option>
              </select>
              <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-3 h-3" />
                Add Dependency
              </Button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-destructive/60 hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Dependencies', value: totalCount.toString(), iconBg: 'bg-primary/10', iconColor: 'text-primary', icon: GitMerge },
              { label: 'Active', value: (summary?.active ?? allDeps.filter(d => d.depStatus !== 'resolved').length).toString(), iconBg: 'bg-warning/10', iconColor: 'text-warning', icon: Clock },
              { label: 'Resolved', value: resolvedCount.toString(), iconBg: 'bg-success/10', iconColor: 'text-success', icon: CheckCircle2 },
              { label: 'Blocking Deps', value: blocksCount.toString(), iconBg: 'bg-destructive/10', iconColor: 'text-destructive', icon: AlertTriangle },
            ].map(kpi => (
              <Card key={kpi.label} className="bento-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 border-b border-border/60">
            {[
              { id: 'graph' as const, label: 'Graph', badge: nodes_count },
              { id: 'chains' as const, label: 'Dependency Chains', badge: depChains.length },
              { id: 'table' as const, label: 'All Dependencies', badge: allDeps.length },
              { id: 'teams' as const, label: 'Cross-Team', badge: teamDeps.filter(t => t.blockedBy > 0 || t.blocking > 0).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeView === tab.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-secondary-foreground'}`}
              >
                {tab.label}
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeView === tab.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          {activeView === 'graph' && (
            <DependencyGraph deps={filteredDeps} tickets={ticketMap} />
          )}

          {activeView === 'chains' && (
            depChains.length === 0 ? (
              <Card className="bento-card py-10 text-center">
                <p className="text-xs text-muted-foreground">No dependency chains detected. Chains appear when tickets have transitive "blocks" relationships.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredChains.map(chain => (
                  <ChainCard key={chain.id} chain={chain} deps={allDeps} tickets={ticketMap} />
                ))}
              </div>
            )
          )}

          {activeView === 'table' && (
            <DependencyTable
              deps={filteredDeps}
              tickets={ticketMap}
              projectId={projectId}
              onResolve={handleResolve}
              onDelete={handleDelete}
              resolvingId={resolvingId}
              deletingId={deletingId}
            />
          )}

          {activeView === 'teams' && (
            <div className="space-y-3">
              {teamDeps.map(td => (
                <Card key={td.team} className="bento-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">{td.team}</span>
                      <span className="text-[10px] text-secondary-foreground">{td.tickets.length} tickets</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {td.blockedBy > 0 && <span className="text-[10px] font-semibold text-destructive">{td.blockedBy} blocked by other teams</span>}
                      {td.blocking > 0 && <span className="text-[10px] font-semibold text-warning">{td.blocking} blocking other teams</span>}
                      {td.blockedBy === 0 && td.blocking === 0 && <span className="text-[10px] text-success font-medium">No cross-team deps</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {td.tickets.map(t => {
                      const sm = STATUS_META[t.status] ?? STATUS_META.backlog;
                      const isBlocked = allDeps.some(d => d.to === t.id && d.depStatus === 'blocked');
                      const isBlocking = allDeps.some(d => d.from === t.id && d.depStatus === 'blocked');
                      return (
                        <div key={t.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${isBlocked ? 'border-destructive/30 bg-destructive/5' : isBlocking ? 'border-warning/30 bg-warning/5' : 'border-border/60 bg-card'}`}>
                          <span className="w-2 h-2 rounded-full" style={{ background: sm.color }} />
                          <span className="text-[10px] font-bold text-primary">{t.id}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{t.title}</span>
                          <span className="text-[9px] tabular-nums text-secondary-foreground">{t.points}pts</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* AI Insight */}
          {depChains.length > 0 && (
            <Card className="bento-card !border-primary/20 !bg-primary/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">AI Dependency Insights</span>
              </div>
              <div className="space-y-2 text-[11px] text-secondary-foreground leading-relaxed">
                {depChains.filter(c => c.status === 'blocked').length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p><strong>Blocked chains:</strong> {depChains.filter(c => c.status === 'blocked').length} chain(s) blocked, affecting {depChains.filter(c => c.status === 'blocked').reduce((s, c) => s + c.tickets.length, 0)} tickets and {depChains.filter(c => c.status === 'blocked').reduce((s, c) => s + c.totalPoints, 0)}pts total.</p>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                  <p><strong>Summary:</strong> {allDeps.length} total dependencies, {allDeps.filter(d => d.type === 'blocks').length} blocking relationships, {depChains.length} chains detected.</p>
                </div>
                {teamDeps.filter(t => t.blockedBy > 0 || t.blocking > 0).length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p><strong>Cross-team risk:</strong> {teamDeps.filter(t => t.blockedBy > 0 || t.blocking > 0).length} team(s) have cross-team dependencies that may require coordination.</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </Reveal>

      <AddDependencyModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        ticketOptions={Object.values(ticketMap)}
        projectId={projectId}
        onCreated={fetchAll}
      />
    </>
  );
}
