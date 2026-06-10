"use client";

import { resolveMapEngine } from "@/core/config/mapProvider";
import type { TripDriverLocation } from "@/shared/types";
import { TripRouteMapbox } from "./TripRouteMapbox";
import { TripRouteOsmMap } from "./TripRouteOsmMap";

interface TripRouteMapProps {
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  fromLabel: string;
  toLabel: string;
  driverLocation?: TripDriverLocation;
  driverLive?: boolean;
  vehicleIconUrl?: string | null;
  className?: string;
  heightClass?: string;
}

/** Itinéraire course — Mapbox ou OpenStreetMap selon `NEXT_PUBLIC_LIVE_MAP_PROVIDER`. */
export function TripRouteMap(props: TripRouteMapProps) {
  const engine = resolveMapEngine();

  if (engine === "osm") {
    return <TripRouteOsmMap {...props} />;
  }

  if (engine === "mapbox") {
    return <TripRouteMapbox {...props} />;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-card border border-dashed border-border bg-map text-center text-xs text-muted ${props.heightClass ?? "h-48"} ${props.className ?? ""}`}
    >
      Carte indisponible — configurez OSM ou Mapbox.
    </div>
  );
}
