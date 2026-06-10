"use client";

import { useMemo } from "react";
import { resolveMapEngine } from "@/core/config/mapProvider";
import type { LiveMapData, LiveMapDriver } from "@/shared/types";
import { MapboxMap } from "./MapboxMap";
import { OpenStreetMapLiveMap } from "./OpenStreetMapLiveMap";
import {
  boundsToLeafletLatLngBounds,
  boundsToMapboxLngLatBounds,
  mapLiveMapDriverToFeature,
} from "./mapboxMarkers";

interface DriverPositionMapProps {
  driver: LiveMapDriver;
  bounds: LiveMapData["bounds"];
  zoneLabel?: string;
  className?: string;
}

/** Carte compacte — un chauffeur avec icône véhicule couleur et animation fluide. */
export function DriverPositionMap({
  driver,
  bounds,
  zoneLabel,
  className = "",
}: DriverPositionMapProps) {
  const engine = resolveMapEngine();
  const feature = useMemo(() => mapLiveMapDriverToFeature(driver), [driver]);
  const mapboxBounds = useMemo(() => boundsToMapboxLngLatBounds(bounds), [bounds]);
  const leafletBounds = useMemo(() => boundsToLeafletLatLngBounds(bounds), [bounds]);

  if (engine === "osm") {
    return (
      <OpenStreetMapLiveMap
        features={[feature]}
        bounds={leafletBounds}
        zoneLabel={zoneLabel}
        className={className}
        animateDriverMoves
      />
    );
  }

  if (engine === "mapbox") {
    return (
      <MapboxMap
        features={[feature]}
        bounds={mapboxBounds}
        zoneLabel={zoneLabel}
        className={className}
        animateDriverMoves
      />
    );
  }

  return null;
}
