"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeColor = "currentColor",
  fillColor,
  className,
}: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - (value / max) * innerHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const fillPath = fillColor
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`
    : undefined;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      {fillPath && (
        <path
          d={fillPath}
          fill={fillColor}
          opacity={0.15}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on the last point */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
