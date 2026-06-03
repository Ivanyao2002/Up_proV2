"use client";

import { latLngToPercent } from "@/shared/lib/mapProjection";
import { formatDateTime } from "@/shared/lib/format";

export interface GpsTracePoint {
  at: string;
  lat: number;
  lng: number;
  speed_kmh: number;
}

interface TripForensicMapProps {
  trace: GpsTracePoint[];
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
}

export function TripForensicMap({
  trace,
  fromCoords,
  toCoords,
}: TripForensicMapProps) {
  const points = trace.map((p) => latLngToPercent(p.lat, p.lng));
  const from = latLngToPercent(fromCoords.lat, fromCoords.lng);
  const to = latLngToPercent(toCoords.lat, toCoords.lng);

  const polyline = points
    .map((p) => {
      const x = parseFloat(p.left);
      const y = parseFloat(p.top);
      return `${x},${y}`;
    })
    .join(" ");

  const maxSpeed = Math.max(...trace.map((p) => p.speed_kmh), 0);
  const anomalyIdx = trace.findIndex((p) => p.speed_kmh >= 80);

  return (
    <div className="relative h-[min(420px,55vh)] overflow-hidden rounded-card border border-border bg-[#e8eaf0] shadow-card">
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
      <p className="absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-navy shadow-sm">
        Trace GPS · {trace.length} points · max {maxSpeed} km/h
      </p>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {polyline && (
          <polyline
            points={polyline}
            fill="none"
            stroke="#405189"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        )}
        {points.map((pos, i) => {
          const x = parseFloat(pos.left);
          const y = parseFloat(pos.top);
          const isAnomaly = i === anomalyIdx;
          return (
            <circle
              key={trace[i].at}
              cx={x}
              cy={y}
              r={isAnomaly ? "1.4" : "0.8"}
              fill={isAnomaly ? "#ef4444" : "#0ab39c"}
              stroke="#fff"
              strokeWidth="0.2"
            />
          );
        })}
        <circle
          cx={parseFloat(from.left)}
          cy={parseFloat(from.top)}
          r="1.5"
          fill="#405189"
          stroke="#fff"
          strokeWidth="0.3"
        />
        <circle
          cx={parseFloat(to.left)}
          cy={parseFloat(to.top)}
          r="1.5"
          fill="#0ab39c"
          stroke="#fff"
          strokeWidth="0.3"
        />
      </svg>

      <div className="absolute bottom-3 left-3 flex gap-2 text-[10px]">
        <span className="rounded bg-surface/90 px-2 py-1 text-navy shadow-sm">Départ</span>
        <span className="rounded bg-surface/90 px-2 py-1 text-navy shadow-sm">Arrivée</span>
        {anomalyIdx >= 0 && (
          <span className="rounded bg-red-100 px-2 py-1 text-red-700 shadow-sm">
            Anomalie {formatDateTime(trace[anomalyIdx].at)}
          </span>
        )}
      </div>
    </div>
  );
}
