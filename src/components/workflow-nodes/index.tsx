'use client';

import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Zap,
  Play,
  GitBranch,
  Brain,
  Bell,
  Calendar,
  Database,
  Sparkles,
} from 'lucide-react';
import type { WorkflowNode, WorkflowNodeType, Port } from '@/hooks/useWorkflowState';

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface WorkflowNodeProps {
  node: WorkflowNode;
  selected: boolean;
  zoom: number;
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: (id: string, startX: number, startY: number) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onPortMouseDown: (nodeId: string, portId: string, portType: 'input' | 'output', x: number, y: number) => void;
  onPortMouseUp: (nodeId: string, portId: string, portType: 'input' | 'output') => void;
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const NODE_ICONS: Record<WorkflowNodeType, React.ElementType> = {
  trigger: Zap,
  action: Play,
  condition: GitBranch,
  ai: Brain,
  notification: Bell,
  meeting: Calendar,
  data: Database,
};

export function getNodeIcon(type: WorkflowNodeType): React.ElementType {
  return NODE_ICONS[type];
}

/* ------------------------------------------------------------------ */
/*  Port component                                                     */
/* ------------------------------------------------------------------ */

interface PortDotProps {
  port: Port;
  nodeId: string;
  nodeColor: string;
  side: 'left' | 'right' | 'top' | 'bottom';
  offset: number;
  totalOnSide: number;
  index: number;
  nodeWidth: number;
  nodeHeight: number;
  onMouseDown: (nodeId: string, portId: string, portType: 'input' | 'output', x: number, y: number) => void;
  onMouseUp: (nodeId: string, portId: string, portType: 'input' | 'output') => void;
}

function PortDot({ port, nodeId, nodeColor, side, index, totalOnSide, nodeWidth, nodeHeight, onMouseDown, onMouseUp }: PortDotProps) {
  const ref = useRef<HTMLDivElement>(null);

  const getPosition = (): React.CSSProperties => {
    const spacing = side === 'left' || side === 'right'
      ? nodeHeight / (totalOnSide + 1)
      : nodeWidth / (totalOnSide + 1);
    const pos = spacing * (index + 1);

    switch (side) {
      case 'left':
        return { left: -5, top: pos - 5 };
      case 'right':
        return { right: -5, top: pos - 5 };
      case 'top':
        return { top: -5, left: pos - 5 };
      case 'bottom':
        return { bottom: -5, left: pos - 5 };
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      onMouseDown(nodeId, port.id, port.type, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }, [nodeId, port.id, port.type, onMouseDown]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseUp(nodeId, port.id, port.type);
  }, [nodeId, port.id, port.type, onMouseUp]);

  return (
    <div
      ref={ref}
      data-port-id={port.id}
      data-port-type={port.type}
      data-node-id={nodeId}
      className="absolute w-[10px] h-[10px] rounded-full border-2 border-white cursor-crosshair z-20 transition-transform hover:scale-150"
      style={{
        ...getPosition(),
        backgroundColor: nodeColor,
        boxShadow: `0 0 0 1px ${nodeColor}40`,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Stat badge                                                         */
/* ------------------------------------------------------------------ */

function StatBadge({ count, color }: { count: number; color: string }) {
  return (
    <div
      className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 z-10"
      style={{ backgroundColor: color }}
    >
      {count > 999 ? `${Math.floor(count / 1000)}k` : count}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Base node wrapper                                                  */
/* ------------------------------------------------------------------ */

function BaseNodeCard({
  node,
  selected,
  zoom,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onPortMouseDown,
  onPortMouseUp,
  children,
  className,
  style,
}: WorkflowNodeProps & { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const dragging = useRef(false);
  const startPos = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.dataset.portId) return;
      el = el.parentElement;
    }
    e.stopPropagation();
    onSelect(node.id, e.shiftKey || e.metaKey);

    dragging.current = true;
    startPos.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
    onDragStart(node.id, node.x, node.y);
    nodeRef.current?.setPointerCapture(e.pointerId);
  }, [node.id, node.x, node.y, onSelect, onDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - startPos.current.mx) / zoom;
    const dy = (e.clientY - startPos.current.my) / zoom;
    onDragMove(node.id, startPos.current.nx + dx, startPos.current.ny + dy);
  }, [node.id, zoom, onDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    nodeRef.current?.releasePointerCapture(e.pointerId);
    onDragEnd(node.id);
  }, [node.id, onDragEnd]);

  const inputPorts = node.ports.filter(p => p.type === 'input');
  const outputPorts = node.ports.filter(p => p.type === 'output');

  return (
    <motion.div
      ref={nodeRef}
      className={clsx('absolute select-none touch-none', className)}
      style={{
        left: node.x || 0,
        top: node.y || 0,
        width: node.width || 180,
        zIndex: selected ? 30 : 10,
        ...style,
      }}
      initial={false}
      animate={{ scale: selected ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Input ports on left side */}
      {inputPorts.map((p, i) => (
        <PortDot
          key={p.id}
          port={p}
          nodeId={node.id}
          nodeColor={node.color}
          side="left"
          offset={0}
          totalOnSide={inputPorts.length}
          index={i}
          nodeWidth={node.width}
          nodeHeight={node.height}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}

      {/* Output ports on right side */}
      {outputPorts.map((p, i) => (
        <PortDot
          key={p.id}
          port={p}
          nodeId={node.id}
          nodeColor={node.color}
          side="right"
          offset={0}
          totalOnSide={outputPorts.length}
          index={i}
          nodeWidth={node.width}
          nodeHeight={node.height}
          onMouseDown={onPortMouseDown}
          onMouseUp={onPortMouseUp}
        />
      ))}

      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trigger Node                                                       */
/* ------------------------------------------------------------------ */

function TriggerNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Zap className="w-4.5 h-4.5" style={{ color: node.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
      {/* Lightning bolt accent bar */}
      <div className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full" style={{ backgroundColor: node.color, opacity: 0.5 }} />
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Action Node                                                        */
/* ------------------------------------------------------------------ */

function ActionNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  const Icon = getNodeIcon('action');
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: node.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Condition Node (diamond shape)                                     */
/* ------------------------------------------------------------------ */

function ConditionNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div className="relative flex items-center justify-center" style={{ height: node.height }}>
        {/* Diamond background */}
        <div
          className={clsx(
            'absolute inset-0 transition-shadow cursor-grab active:cursor-grabbing',
            selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
          )}
          style={{
            backgroundColor: `${node.color}08`,
            border: `2px solid ${selected ? node.color : `${node.color}40`}`,
            borderRadius: '12px',
            transform: 'rotate(45deg) scale(0.7)',
            transformOrigin: 'center',
          }}
        />
        {/* Content (not rotated) */}
        <div className="relative z-10 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
          <GitBranch className="w-5 h-5" style={{ color: node.color }} />
          <p className="text-[11px] font-semibold text-foreground text-center leading-tight">{node.label}</p>
          {node.sublabel && <p className="text-[9px] text-muted-foreground text-center">{node.sublabel}</p>}
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
      {/* Yes/No port labels */}
      {node.ports.filter(p => p.type === 'output').length === 2 && (
        <>
          <span className="absolute right-[-28px] top-[16px] text-[8px] font-bold text-[#16a34a]">YES</span>
          <span className="absolute right-[-22px] bottom-[16px] text-[8px] font-bold text-destructive">NO</span>
        </>
      )}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Node (glow effect)                                              */
/* ------------------------------------------------------------------ */

function AINode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing relative overflow-hidden',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        {/* Subtle glow */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${node.color}, transparent 70%)`,
          }}
        />
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Brain className="w-4.5 h-4.5" style={{ color: node.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
              <Sparkles className="w-3 h-3 text-[#8b5cf6] shrink-0" />
            </div>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification Node                                                  */
/* ------------------------------------------------------------------ */

function NotificationNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Bell className="w-4.5 h-4.5" style={{ color: node.color }} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Meeting Node                                                       */
/* ------------------------------------------------------------------ */

function MeetingNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Calendar className="w-4.5 h-4.5" style={{ color: node.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Data Node                                                          */
/* ------------------------------------------------------------------ */

function DataNode(props: WorkflowNodeProps) {
  const { node, selected } = props;
  return (
    <BaseNodeCard {...props}>
      <div
        className={clsx(
          'rounded-xl border-2 bg-card px-4 py-3 transition-shadow cursor-grab active:cursor-grabbing',
          selected ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
        )}
        style={{ borderColor: selected ? node.color : `${node.color}40` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}25` }}
          >
            <Database className="w-4.5 h-4.5" style={{ color: node.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.label}</p>
            {node.sublabel && <p className="text-[10px] text-muted-foreground truncate">{node.sublabel}</p>}
          </div>
        </div>
      </div>
      {node.stats && <StatBadge count={node.stats.count} color={node.color} />}
    </BaseNodeCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Node renderer factory                                              */
/* ------------------------------------------------------------------ */

const NODE_COMPONENTS: Record<WorkflowNodeType, React.FC<WorkflowNodeProps>> = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  ai: AINode,
  notification: NotificationNode,
  meeting: MeetingNode,
  data: DataNode,
};

export function WorkflowNodeRenderer(props: WorkflowNodeProps) {
  const Component = NODE_COMPONENTS[props.node.type] ?? ActionNode;
  return <Component {...props} />;
}

export const NODE_TYPE_MAP: Record<WorkflowNodeType, { icon: React.ElementType; color: string; label: string }> = {
  trigger: { icon: Zap, color: '#f59e0b', label: 'Trigger' },
  action: { icon: Play, color: '#22C55E', label: 'Action' },
  condition: { icon: GitBranch, color: '#ca8a04', label: 'Condition' },
  ai: { icon: Brain, color: '#8b5cf6', label: 'AI' },
  notification: { icon: Bell, color: '#e22d2d', label: 'Notification' },
  meeting: { icon: Calendar, color: '#2563EB', label: 'Meeting' },
  data: { icon: Database, color: '#06b6d4', label: 'Data' },
};

export default WorkflowNodeRenderer;
