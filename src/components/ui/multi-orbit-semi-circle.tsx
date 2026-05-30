"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

export interface OrbitItem {
  icon: React.ReactNode;
  label: string;
  color: string;
}

function getColorWithAlpha(color: string, alphaHex: string): string {
  if (color.startsWith("var(")) {
    const pct = Math.round((parseInt(alphaHex, 16) / 255) * 100);
    return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  }
  return color + alphaHex;
}

interface SemiCircleOrbitProps {
  radius: number;
  centerX: number;
  centerY: number;
  items: OrbitItem[];
  iconSize: number;
}

function SemiCircleOrbit({ radius, centerX, centerY, items, iconSize }: SemiCircleOrbitProps) {
  const count = items.length;
  const pad = 10;
  const startAngle = pad;
  const endAngle = 180 - pad;

  return (
    <>
      {items.map((item, index) => {
        const angle = count > 1 ? startAngle + (index / (count - 1)) * (endAngle - startAngle) : 90;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);
        const tooltipAbove = angle > 90;

        return (
          <div
            key={index}
            className="absolute flex flex-col items-center group"
            style={{
              left: `${centerX + x - iconSize / 2}px`,
              top: `${centerY - y - iconSize / 2}px`,
              zIndex: 5,
            }}
          >
            <div
              className="rounded-xl border flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{
                width: iconSize,
                height: iconSize,
                minWidth: iconSize,
                minHeight: iconSize,
                backgroundColor: getColorWithAlpha(item.color, "12"),
                borderColor: getColorWithAlpha(item.color, "30"),
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <div
              className={`absolute ${
                tooltipAbove ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
              } hidden group-hover:block w-28 rounded-lg bg-foreground px-2 py-1 text-xs text-background shadow-lg text-center pointer-events-none`}
            >
              {item.label}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-foreground ${
                  tooltipAbove ? "top-full -mt-1.5" : "bottom-full -mb-1.5"
                }`}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

export interface MultiOrbitSemiCircleProps {
  orbits: OrbitItem[][];
  className?: string;
}

export default function MultiOrbitSemiCircle({ orbits, className }: MultiOrbitSemiCircleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const baseWidth = Math.min(containerWidth * 0.9, 620);
  const centerX = baseWidth / 2;
  const centerY = baseWidth * 0.48;

  const iconSize = baseWidth < 350 ? 28 : baseWidth < 500 ? 32 : 36;
  const radiusSteps = [0.22, 0.36, 0.5];
  const canvasHeight = baseWidth * 0.55 + iconSize;

  return (
    <div ref={containerRef} className={className}>
      {containerWidth > 0 && (
        <div className="relative flex flex-col items-center overflow-hidden">
          <div
            className="relative mx-auto"
            style={{ width: baseWidth, height: canvasHeight }}
          >
            <div className="absolute inset-0 flex justify-center pointer-events-none">
              <div
                className="rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_70%)] blur-3xl"
                style={{ width: baseWidth * 0.85, height: baseWidth * 0.85, marginTop: -baseWidth * 0.15 }}
              />
            </div>

            {orbits.map((_, i) => {
              const r = baseWidth * (radiusSteps[i] ?? 0.22 + i * 0.14);
              return (
                <svg
                  key={`ring-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: centerX - r,
                    top: centerY - r,
                    width: r * 2,
                    height: r * 2,
                  }}
                >
                  <path
                    d={`M 0,${r} A ${r},${r} 0 0,1 ${r * 2},${r}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    opacity="0.5"
                  />
                </svg>
              );
            })}

            {orbits.map((items, i) => (
              <SemiCircleOrbit
                key={i}
                radius={baseWidth * (radiusSteps[i] ?? 0.22 + i * 0.14)}
                centerX={centerX}
                centerY={centerY}
                items={items}
                iconSize={iconSize}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
