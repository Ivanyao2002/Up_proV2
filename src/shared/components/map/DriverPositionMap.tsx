"use client";

import { useMemo, useRef } from "react";
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
  // Stabilise le tableau pour éviter que [feature] recrée une nouvelle référence à chaque render
  const features = useMemo(() => [feature], [feature]);
  // Stabilise bounds en ne recalculant que si lat/lng changent réellement
  const initialBoundsRef = useRef(bounds);
  const stableBounds = useMemo(
    () => boundsToMapboxLngLatBounds(initialBoundsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const mapboxBounds = useMemo(() => boundsToMapboxLngLatBounds(bounds), [bounds]);
  const leafletBounds = useMemo(() => boundsToLeafletLatLngBounds(bounds), [bounds]);

  if (engine === "osm") {
    return (
      <OpenStreetMapLiveMap
        features={features}
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
        features={features}
        bounds={stableBounds}
        zoneLabel={zoneLabel}
        className={className}
        animateDriverMoves
      />
    );
  }

  return null;
}
