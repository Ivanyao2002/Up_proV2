"use client";

import type { ReactNode } from "react";
import { resolveMapEngine } from "@/core/config/mapProvider";
import type { MapBounds } from "@/shared/lib/mapProjection";
import { SimplePinMapOsm, type SimpleMapPin } from "./SimplePinMapOsm";
import { SimplePinMapMapbox } from "./SimplePinMapMapbox";

export type { SimpleMapPin };

interface SimplePinMapProps {
  pins: SimpleMapPin[];
  bounds?: MapBounds;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  overlayLabel?: string;
  cursorCrosshair?: boolean;
  /** Contenu affiché en mode legacy (grille CSS / SVG). */
  legacyFallback?: ReactNode;
}

/** Carte à épingles — Mapbox ou OpenStreetMap selon `NEXT_PUBLIC_LIVE_MAP_PROVIDER`. */
export function SimplePinMap({
  legacyFallback,
  ...props
}: SimplePinMapProps) {
  const engine = resolveMapEngine();

  if (engine === "osm") {
    return <SimplePinMapOsm {...props} />;
  }

  if (engine === "mapbox") {
    return <SimplePinMapMapbox {...props} />;
  }

  if (legacyFallback) {
    return <>{legacyFallback}</>;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-card border border-dashed border-border bg-map text-center text-xs text-muted ${props.className ?? ""}`}
    >
      Carte indisponible — configurez OSM ou Mapbox.
    </div>
  );
}
