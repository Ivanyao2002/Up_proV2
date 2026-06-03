"use client";

import type { Zone } from "@/shared/types";
import {
  ringLngLatToSvgPoints,
  svgPointToLatLng,
} from "@/shared/lib/mapProjection";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { Button } from "@/shared/ui/Button";

export interface ZoneMapItem {
  id: number;
  name: string;
  type: Zone["type"];
  city?: string;
  franchise_name?: string;
  polygon_geojson?: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

const ZONE_COLORS = [
  "rgba(10,179,156,0.28)",
  "rgba(64,81,137,0.22)",
  "rgba(245,158,11,0.22)",
  "rgba(99,102,241,0.2)",
  "rgba(236,72,153,0.18)",
];

interface AbidjanZonesMapProps {
  mode: "select" | "draw";
  zones: ZoneMapItem[];
  cityLabel?: string;
  selectedZoneId?: number | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
  draftRing?: number[][];
  onDraftPoint?: (lng: number, lat: number) => void;
  onUndoDraftPoint?: () => void;
  onClearDraft?: () => void;
}

export function AbidjanZonesMap({
  mode,
  zones,
  cityLabel = "Abidjan",
  selectedZoneId = null,
  onSelectZone,
  draftRing = [],
  onDraftPoint,
  onUndoDraftPoint,
  onClearDraft,
}: AbidjanZonesMapProps) {
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== "draw" || !onDraftPoint) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const { lat, lng } = svgPointToLatLng(xPct, yPct);
    onDraftPoint(lng, lat);
  };

  const draftPoints =
    draftRing.length >= 2 ? ringLngLatToSvgPoints(draftRing) : "";
  const closedDraft =
    draftRing.length >= 3
      ? ringLngLatToSvgPoints([...draftRing, draftRing[0]])
      : draftPoints;

  return (
    <div className="space-y-3">
      <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
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
          {cityLabel}
        </p>
        {mode === "draw" && (
          <p className="absolute right-3 top-3 z-10 rounded-lg bg-teal/90 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            {draftRing.length} point{draftRing.length !== 1 ? "s" : ""}
          </p>
        )}

        <svg
          className={`absolute inset-0 h-full w-full ${
            mode === "draw" ? "cursor-crosshair" : ""
          }`}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleMapClick}
        >
          {zones.map((zone, i) => {
            const ring = zone.polygon_geojson?.coordinates?.[0];
            if (!ring) return null;
            const points = ringLngLatToSvgPoints(ring);
            const selected = selectedZoneId === zone.id;
            const isReference = mode === "draw";
            return (
              <polygon
                key={zone.id}
                points={points}
                fill={ZONE_COLORS[i % ZONE_COLORS.length]}
                stroke={selected ? "#0ab39c" : "#405189"}
                strokeWidth={selected ? 1.2 : 0.5}
                className={
                  isReference
                    ? "pointer-events-none opacity-35"
                    : "cursor-pointer transition-opacity hover:opacity-90"
                }
                onClick={
                  isReference
                    ? undefined
                    : (ev) => {
                        ev.stopPropagation();
                        onSelectZone?.(zone);
                      }
                }
              />
            );
          })}

          {mode === "draw" && draftRing.length >= 2 && (
            <polyline
              points={draftPoints}
              fill="none"
              stroke="#0ab39c"
              strokeWidth="0.8"
              strokeDasharray="2 1"
              pointerEvents="none"
            />
          )}
          {mode === "draw" && draftRing.length >= 3 && (
            <polygon
              points={closedDraft}
              fill="rgba(10,179,156,0.25)"
              stroke="#0ab39c"
              strokeWidth="0.9"
              pointerEvents="none"
            />
          )}
          {mode === "draw" &&
            draftRing.map(([lng, lat], idx) => {
              const pt = ringLngLatToSvgPoints([[lng, lat]]);
              const [x, y] = pt.split(",");
              return (
                <circle
                  key={`${lng}-${lat}-${idx}`}
                  cx={x}
                  cy={y}
                  r="1.2"
                  fill="#0ab39c"
                  stroke="#fff"
                  strokeWidth="0.3"
                  pointerEvents="none"
                />
              );
            })}
        </svg>

        {mode === "select" && zones.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Aucune zone cartographiée
          </p>
        )}
      </div>

      {mode === "draw" && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="!text-xs"
            disabled={draftRing.length === 0}
            onClick={onUndoDraftPoint}
          >
            Annuler le dernier point
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!text-xs"
            disabled={draftRing.length === 0}
            onClick={onClearDraft}
          >
            Effacer le tracé
          </Button>
          <p className="self-center text-xs text-muted">
            Cliquez sur la carte pour placer au moins 3 points et délimiter la zone.
          </p>
        </div>
      )}

      {mode === "select" && (
        <ZonesMapLegend
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={onSelectZone}
        />
      )}
    </div>
  );
}

export function ZonesMapLegend({
  zones,
  selectedZoneId,
  onSelectZone,
}: {
  zones: ZoneMapItem[];
  selectedZoneId?: number | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {zones.map((zone) => (
        <li key={zone.id}>
          <button
            type="button"
            onClick={() => onSelectZone?.(zone)}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              selectedZoneId === zone.id
                ? "border-teal bg-teal/5 ring-1 ring-teal/30"
                : "border-border bg-surface hover:border-teal/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{zone.name}</span>
              <ZoneTypePill type={zone.type} />
            </div>
            {zone.franchise_name && (
              <p className="mt-1 text-xs text-muted">{zone.franchise_name}</p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
