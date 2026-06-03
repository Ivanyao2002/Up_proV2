"use client";

import { ringLngLatToSvgPoints } from "@/shared/lib/mapProjection";

interface ZonePolygonMapProps {
  polygon?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  zoneName: string;
  className?: string;
}

export function ZonePolygonMap({
  polygon,
  zoneName,
  className = "h-64",
}: ZonePolygonMapProps) {
  const ring = polygon?.coordinates?.[0];
  const points = ring ? ringLngLatToSvgPoints(ring) : "30,70 70,20 85,55 50,85";

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-map ${className}`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points={points}
          fill="rgba(10,179,156,0.25)"
          stroke="#0ab39c"
          strokeWidth="0.8"
        />
      </svg>
      <p className="absolute bottom-3 left-3 rounded bg-surface/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
        {zoneName} · polygone actif
      </p>
    </div>
  );
}
