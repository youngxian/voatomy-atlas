'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { WorkflowNode, WorkflowEdge, Viewport } from '@/hooks/useWorkflowState';
import { WorkflowNodeRenderer } from '@/components/workflow-nodes';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CanvasTool = 'select' | 'pan' | 'connect';

interface WorkflowAPI {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  viewport: Viewport;
  snapToGrid: boolean;
  showGrid: boolean;
  gridSize: number;
  showFlow: boolean;
  selectNode: (id: string, additive?: boolean) => void;
  selectEdge: (id: string, additive?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  moveNode: (id: string, x: number, y: number) => void;
  connectNodes: (sourceId: string, sourcePort: string, targetId: string, targetPort: string) => void;
  setViewport: (viewport: Viewport) => void;
  setCanvasSize: (w: number, h: number) => void;
}

interface WorkflowCanvasProps {
  workflow: WorkflowAPI;
  canvasTool: CanvasTool;
  onContextMenu?: (e: React.MouseEvent, target: { type: 'canvas' | 'node' | 'edge'; id?: string; position: { x: number; y: number } }) => void;
}

/* ------------------------------------------------------------------ */
/*  Edge path calculation                                              */
/* ------------------------------------------------------------------ */

function getPortWorldPosition(
  node: WorkflowNode,
  portId: string,
): { x: number; y: number } | null {
  const port = node.ports.find(p => p.id === portId);
  if (!port) return null;

  const inputPorts = node.ports.filter(p => p.type === 'input');
  const outputPorts = node.ports.filter(p => p.type === 'output');

  if (port.type === 'input') {
    const idx = inputPorts.indexOf(port);
    const spacing = node.height / (inputPorts.length + 1);
    return { x: node.x, y: node.y + spacing * (idx + 1) };
  } else {
    const idx = outputPorts.indexOf(port);
    const spacing = node.height / (outputPorts.length + 1);
    return { x: node.x + node.width, y: node.y + spacing * (idx + 1) };
  }
}

function buildEdgePath(
  fromX: number, fromY: number,
  toX: number, toY: number,
): string {
  const dx = Math.abs(toX - fromX);
  const cpOffset = Math.max(60, dx * 0.4);
  return `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;
}

/* ------------------------------------------------------------------ */
/*  Edge component                                                     */
/* ------------------------------------------------------------------ */

function EdgeLine({
  edge,
  nodes,
  selected,
  showFlow,
  onSelect,
}: {
  edge: WorkflowEdge;
  nodes: WorkflowNode[];
  selected: boolean;
  showFlow: boolean;
  onSelect: (id: string, additive: boolean) => void;
}) {
  const sourceNode = nodes.find(n => n.id === edge.sourceId);
  const targetNode = nodes.find(n => n.id === edge.targetId);
  if (!sourceNode || !targetNode) return null;

  const from = getPortWorldPosition(sourceNode, edge.sourcePort);
  const to = getPortWorldPosition(targetNode, edge.targetPort);
  if (!from || !to) return null;

  const d = buildEdgePath(from.x, from.y, to.x, to.y);
  const edgeColor = selected ? '#22C55E' : '#d1d5da';

  return (
    <g>
      {/* Invisible wider hit area for click */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        className="cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => { e.stopPropagation(); onSelect(edge.id, e.shiftKey); }}
      />
      {/* Visible edge */}
      <path
        d={d}
        stroke={edgeColor}
        strokeWidth={selected ? 2.5 : 1.5}
        fill="none"
        markerEnd="url(#arrowhead)"
        strokeDasharray={edge.animated ? '6 3' : 'none'}
        className={edge.animated ? 'animate-dash' : ''}
        style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
      />
      {/* Animated particles for data flow */}
      {showFlow && edge.animated && (
        <circle r="3" fill={sourceNode.color} opacity="0.7">
          <animateMotion dur="2s" repeatCount="indefinite" path={d} />
        </circle>
      )}
      {/* Edge label */}
      {edge.label && (
        <foreignObject
          x={(from.x + to.x) / 2 - 30}
          y={(from.y + to.y) / 2 - 12}
          width="60"
          height="24"
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center h-full">
            <span className="px-1.5 py-0.5 rounded-md bg-card/90 border border-border/60 text-[9px] font-medium text-secondary-foreground shadow-sm">
              {edge.label}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Drawing edge preview                                               */
/* ------------------------------------------------------------------ */

interface DrawingEdge {
  sourceNodeId: string;
  sourcePortId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/* ------------------------------------------------------------------ */
/*  Selection box                                                      */
/* ------------------------------------------------------------------ */

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/* ------------------------------------------------------------------ */
/*  Main Canvas                                                        */
/* ------------------------------------------------------------------ */

export default function WorkflowCanvas({
  workflow,
  canvasTool,
  onContextMenu,
}: WorkflowCanvasProps) {
  const {
    nodes, edges, selectedNodeIds, selectedEdgeIds, viewport,
    snapToGrid, showGrid, gridSize, showFlow,
    selectNode: onSelectNode, selectEdge: onSelectEdge,
    selectMultiple: onSelectMultiple, clearSelection: onClearSelection,
    moveNode: onMoveNode, connectNodes: onConnect,
    setViewport: onViewportChange, setCanvasSize,
  } = workflow;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const dragNodeId = useRef<string | null>(null);

  const { setNodeRef: setDropRef } = useDroppable({ id: 'workflow-canvas' });

  const combinedRef = useCallback((el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    setDropRef(el);
  }, [setDropRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
      setCanvasSize(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setCanvasSize]);

  /* ---- Zoom via wheel (non-passive to allow preventDefault) ---- */
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const vp = viewportRef.current;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(4, Math.max(0.25, vp.zoom * zoomFactor));
      const scale = newZoom / vp.zoom;

      onViewportChangeRef.current({
        x: mx - (mx - vp.x) * scale,
        y: my - (my - vp.y) * scale,
        zoom: newZoom,
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  /* ---- Canvas pointer events (pan / selection box) ---- */
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || canvasTool === 'pan' || e.shiftKey) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (canvasTool === 'select') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      setSelectionBox({ startX: worldX, startY: worldY, currentX: worldX, currentY: worldY });
      onClearSelection();
    }
  }, [canvasTool, viewport, onClearSelection]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      onViewportChange({
        ...viewport,
        x: panStart.current.vx + dx,
        y: panStart.current.vy + dy,
      });
      return;
    }

    if (drawingEdge) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDrawingEdge(prev => prev ? {
        ...prev,
        currentX: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        currentY: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      } : null);
      return;
    }

    if (selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      setSelectionBox(prev => prev ? { ...prev, currentX: worldX, currentY: worldY } : null);
    }
  }, [viewport, drawingEdge, selectionBox, onViewportChange]);

  const handleCanvasPointerUp = useCallback(() => {
    isPanning.current = false;

    if (drawingEdge) {
      setDrawingEdge(null);
    }

    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
      const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
      const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
      const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const ids = nodes
          .filter(n => n.x + n.width > x1 && n.x < x2 && n.y + n.height > y1 && n.y < y2)
          .map(n => n.id);
        if (ids.length > 0) onSelectMultiple(ids);
      }
      setSelectionBox(null);
    }
  }, [drawingEdge, selectionBox, nodes, onSelectMultiple]);

  /* ---- Node drag handlers (passed to node components) ---- */
  const handleNodeDragStart = useCallback((id: string) => {
    dragNodeId.current = id;
  }, []);

  const handleNodeDragMove = useCallback((id: string, x: number, y: number) => {
    onMoveNode(id, x, y);
  }, [onMoveNode]);

  const handleNodeDragEnd = useCallback(() => {
    dragNodeId.current = null;
  }, []);

  /* ---- Port events (edge creation) ---- */
  const handlePortMouseDown = useCallback((
    nodeId: string, portId: string, portType: 'input' | 'output', screenX: number, screenY: number,
  ) => {
    if (portType !== 'output') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldX = (screenX - rect.left - viewport.x) / viewport.zoom;
    const worldY = (screenY - rect.top - viewport.y) / viewport.zoom;
    setDrawingEdge({
      sourceNodeId: nodeId,
      sourcePortId: portId,
      startX: worldX,
      startY: worldY,
      currentX: worldX,
      currentY: worldY,
    });
  }, [viewport]);

  const handlePortMouseUp = useCallback((
    nodeId: string, portId: string, portType: 'input' | 'output',
  ) => {
    if (!drawingEdge || portType !== 'input') return;
    if (drawingEdge.sourceNodeId === nodeId) return;
    onConnect(drawingEdge.sourceNodeId, drawingEdge.sourcePortId, nodeId, portId);
    setDrawingEdge(null);
  }, [drawingEdge, onConnect]);

  /* ---- Context menu ---- */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!onContextMenu) return;
    e.preventDefault();
    onContextMenu(e, { type: 'canvas', position: { x: e.clientX, y: e.clientY } });
  }, [onContextMenu]);

  /* ---- Cursor logic ---- */
  const cursorClass =
    canvasTool === 'pan' ? 'cursor-grab active:cursor-grabbing' :
    canvasTool === 'connect' ? 'cursor-crosshair' :
    'cursor-default';

  /* ---- Grid background ---- */
  const dotSize = gridSize * viewport.zoom;

  return (
    <div
      ref={combinedRef}
      className={`absolute inset-0 overflow-hidden bg-[#FAFAF8] ${cursorClass}`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onContextMenu={handleContextMenu}
    >
      {/* Dot grid background */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: snapToGrid
              ? 'radial-gradient(circle, #d1d5da 0.8px, transparent 0.8px)'
              : 'radial-gradient(circle, #d1d5da 0.5px, transparent 0.5px)',
            backgroundSize: `${dotSize}px ${dotSize}px`,
            backgroundPosition: `${viewport.x % dotSize}px ${viewport.y % dotSize}px`,
          }}
        />
      )}

      {/* Transform container for all canvas content */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          willChange: 'transform',
        }}
      >
        {/* SVG layer for edges */}
        <svg
          className="absolute"
          style={{ left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#d1d5da" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#22C55E" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(edge => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              nodes={nodes}
              selected={selectedEdgeIds.has(edge.id)}
              showFlow={showFlow}
              onSelect={onSelectEdge}
            />
          ))}

          {/* Drawing preview edge */}
          {drawingEdge && (
            <path
              d={buildEdgePath(drawingEdge.startX, drawingEdge.startY, drawingEdge.currentX, drawingEdge.currentY)}
              stroke="#22C55E"
              strokeWidth="2"
              strokeDasharray="6 3"
              fill="none"
              opacity="0.7"
            />
          )}

          {/* Selection box */}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.startX, selectionBox.currentX)}
              y={Math.min(selectionBox.startY, selectionBox.currentY)}
              width={Math.abs(selectionBox.currentX - selectionBox.startX)}
              height={Math.abs(selectionBox.currentY - selectionBox.startY)}
              fill="#22C55E"
              fillOpacity="0.08"
              stroke="#22C55E"
              strokeWidth={1 / (viewport.zoom || 1)}
              strokeDasharray={`${4 / (viewport.zoom || 1)} ${2 / (viewport.zoom || 1)}`}
            />
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <WorkflowNodeRenderer
            key={node.id}
            node={node}
            selected={selectedNodeIds.has(node.id)}
            zoom={viewport.zoom}
            onSelect={onSelectNode}
            onDragStart={handleNodeDragStart}
            onDragMove={handleNodeDragMove}
            onDragEnd={handleNodeDragEnd}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
          />
        ))}
      </div>

      {/* MiniMap rendered externally in page.tsx */}
    </div>
  );
}
