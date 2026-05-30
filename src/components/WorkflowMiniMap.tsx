'use client';

import React, { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { Maximize2 } from 'lucide-react';
import type { WorkflowNode, Viewport } from '@/hooks/useWorkflowState';
import { NODE_TYPE_MAP } from '@/components/workflow-nodes';

interface WorkflowMiniMapProps {
  nodes: WorkflowNode[];
  viewport: Viewport;
  canvasWidth: number;
  canvasHeight: number;
  onViewportChange: (viewport: Viewport) => void;
  onFitView: () => void;
}

const MAP_W = 200;
const MAP_H = 140;
const PADDING = 20;

export default function WorkflowMiniMap({
  nodes,
  viewport,
  canvasWidth,
  canvasHeight,
  onViewportChange,
  onFitView,
}: WorkflowMiniMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validNodes = React.useMemo(() => nodes.filter((n) => isFinite(n.x) && isFinite(n.y)), [nodes]);

  const bounds = React.useMemo(() => {
    if (validNodes.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
    const xs = validNodes.map((n) => n.x);
    const ys = validNodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - PADDING * 4,
      minY: Math.min(...ys) - PADDING * 4,
      maxX: Math.max(...xs) + 200 + PADDING * 4,
      maxY: Math.max(...ys) + 100 + PADDING * 4,
    };
  }, [validNodes]);

  const worldW = bounds.maxX - bounds.minX || 1;
  const worldH = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(MAP_W / worldW, MAP_H / worldH);

  const toMiniX = useCallback((wx: number) => (wx - bounds.minX) * scale, [bounds.minX, scale]);
  const toMiniY = useCallback((wy: number) => (wy - bounds.minY) * scale, [bounds.minY, scale]);

  const safeZoom = viewport.zoom || 1;
  const viewRectX = toMiniX(-viewport.x / safeZoom) || 0;
  const viewRectY = toMiniY(-viewport.y / safeZoom) || 0;
  const viewRectW = ((canvasWidth / safeZoom) * scale) || MAP_W;
  const viewRectH = ((canvasHeight / safeZoom) * scale) || MAP_H;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const worldX = mx / scale + bounds.minX;
      const worldY = my / scale + bounds.minY;
      onViewportChange({
        ...viewport,
        x: -(worldX - canvasWidth / viewport.zoom / 2) * viewport.zoom,
        y: -(worldY - canvasHeight / viewport.zoom / 2) * viewport.zoom,
      });
    },
    [isDragging, scale, bounds, viewport, canvasWidth, canvasHeight, onViewportChange]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  return (
    <div className="absolute bottom-4 right-4 z-30 bg-card rounded-xl border border-border/60 shadow-lg overflow-hidden" style={{ width: MAP_W + 16, padding: 8 }}>
      <svg
        ref={svgRef}
        width={MAP_W}
        height={MAP_H}
        className="bg-[#FAFAF8] rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {validNodes.map((node) => {
          const cfg = NODE_TYPE_MAP[node.type];
          const isCondition = node.type === 'condition';
          const nx = toMiniX(node.x);
          const ny = toMiniY(node.y);
          const nw = isCondition ? 8 : 14;
          const nh = isCondition ? 8 : 6;

          if (isCondition) {
            return (
              <rect
                key={node.id}
                x={nx + nw / 2 - 4}
                y={ny + nh / 2 - 4}
                width={8}
                height={8}
                rx={1}
                fill={cfg.color}
                opacity={0.7}
                transform={`rotate(45, ${nx + nw / 2}, ${ny + nh / 2})`}
              />
            );
          }

          return (
            <rect
              key={node.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={2}
              fill={cfg.color}
              opacity={0.7}
            />
          );
        })}

        <rect
          x={Math.max(0, viewRectX)}
          y={Math.max(0, viewRectY)}
          width={Math.min(MAP_W, viewRectW)}
          height={Math.min(MAP_H, viewRectH)}
          rx={2}
          fill="transparent"
          stroke="#22C55E"
          strokeWidth={1.5}
          className={clsx(isDragging && 'stroke-primary')}
        />
      </svg>

      <div className="flex items-center justify-between mt-1.5 px-0.5">
        <span className="text-[9px] font-medium text-muted-foreground tabular-nums">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={onFitView}
          className="p-0.5 rounded text-secondary-foreground hover:text-primary transition-colors"
          title="Fit view"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
