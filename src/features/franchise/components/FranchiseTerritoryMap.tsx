"use client";

import type { FranchiseTerritoryZone } from "@/shared/types";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";

const ZONE_COLORS = [
  "rgba(10,179,156,0.25)",
  "rgba(64,81,137,0.2)",
  "rgba(245,158,11,0.2)",
];

function ringToPoints(ring: number[][]): string {
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const lngMin = Math.min(...lngs);
  const lngMax = Math.max(...lngs);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);

  return ring
    .map(([lng, lat]) => {
      const x = ((lng - lngMin) / (lngMax - lngMin || 1)) * 75 + 12;
      const y = (1 - (lat - latMin) / (latMax - latMin || 1)) * 65 + 18;
      return `${x},${y}`;
    })
    .join(" ");
}

interface FranchiseTerritoryMapProps {
  zones: FranchiseTerritoryZone[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  franchiseName: string;
}

export function FranchiseTerritoryMap({
  zones,
  selectedId,
  onSelect,
  franchiseName,
}: FranchiseTerritoryMapProps) {
  return (
    <div className="relative h-[min(420px,55vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
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
      <p className="absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        {franchiseName}
      </p>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {zones.map((zone, i) => {
          const ring = zone.polygon_geojson?.coordinates?.[0];
          const points = ring ? ringToPoints(ring) : "";
          if (!points) return null;
          const selected = selectedId === zone.id;
          return (
            <polygon
              key={zone.id}
              points={points}
              fill={ZONE_COLORS[i % ZONE_COLORS.length]}
              stroke={selected ? "#0ab39c" : "#405189"}
              strokeWidth={selected ? 1.2 : 0.6}
              className="cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => onSelect(zone.id)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function FranchiseTerritoryLegend({
  zones,
  selectedId,
  onSelect,
}: {
  zones: FranchiseTerritoryZone[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {zones.map((zone) => (
        <li key={zone.id}>
          <button
            type="button"
            onClick={() => onSelect(zone.id)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              selectedId === zone.id
                ? "border-teal bg-teal/5"
                : "border-border bg-surface hover:border-teal/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{zone.name}</span>
              <ZoneTypePill type={zone.type} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {zone.drivers_active} chauffeurs · {zone.partners_count} partenaires
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
