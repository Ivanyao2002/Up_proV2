"use client";

import { resolveMapEngine } from "@/core/config/mapProvider";
import type { MapBounds } from "@/shared/lib/mapProjection";
import type { ZoneMapItem } from "./AbidjanZonesMap";
import { ZonesMapboxMap } from "./ZonesMapboxMap";
import { ZonesOsmMap } from "./ZonesOsmMap";

interface ZonesMapProps {
  zones: ZoneMapItem[];
  cityLabel?: string;
  selectedZoneId?: number | string | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
  mode?: "select" | "draw";
  draftRing?: number[][];
  onDraftPoint?: (lng: number, lat: number) => void;
  className?: string;
  emptyMessage?: string;
  mapBounds?: MapBounds;
}

/** Carte zones — Mapbox ou OpenStreetMap selon `NEXT_PUBLIC_LIVE_MAP_PROVIDER`. */
export function ZonesMap(props: ZonesMapProps) {
  const engine = resolveMapEngine();

  if (engine === "osm") {
    return <ZonesOsmMap {...props} />;
  }

  if (engine === "mapbox") {
    return <ZonesMapboxMap {...props} />;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-card border border-dashed border-border bg-canvas p-6 text-center text-sm text-muted ${props.className ?? "h-[min(380px,50vh)]"}`}
    >
      Configurez{" "}
      <code className="mx-1 text-xs">NEXT_PUBLIC_LIVE_MAP_PROVIDER=osm</code> ou un
      token Mapbox pour afficher la carte.
    </div>
  );
}
