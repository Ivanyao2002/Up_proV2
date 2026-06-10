"use client";

import { useMemo } from "react";
import type { LiveMapData } from "@/shared/types";
import { resolveMapEngine } from "@/core/config/mapProvider";
import { MapboxMap } from "@/shared/components/map/MapboxMap";
import { OpenStreetMapLiveMap } from "@/shared/components/map/OpenStreetMapLiveMap";
import {
  boundsToLeafletLatLngBounds,
  boundsToMapboxLngLatBounds,
  liveMapDataToMapFeatures,
} from "@/shared/components/map/mapboxMarkers";
import { useLiveMapHotZones } from "../api/liveMapHotZones.queries";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import { LiveMapCanvasLegacy, LiveMapLegend } from "./LiveMapCanvasLegacy";

interface LiveMapCanvasProps {
  data: LiveMapData;
  scopeFilters?: LiveMapScopeFiltersValue;
}

export function LiveMapCanvas({ data, scopeFilters }: LiveMapCanvasProps) {
  const engine = resolveMapEngine();
  const { data: hotZones = [] } = useLiveMapHotZones(scopeFilters);
  const features = useMemo(() => liveMapDataToMapFeatures(data), [data]);
  const mapboxBounds = useMemo(
    () => boundsToMapboxLngLatBounds(data.bounds),
    [data.bounds]
  );
  const leafletBounds = useMemo(
    () => boundsToLeafletLatLngBounds(data.bounds),
    [data.bounds]
  );

  const legend = (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10">
      <div className="pointer-events-auto">
        <LiveMapLegend
          isGlobal={data.scope === "global"}
          showOrders={Boolean(data.order_markers?.length)}
          showHotZones={hotZones.length > 0}
        />
      </div>
    </div>
  );

  if (engine === "osm") {
    return (
      <div className="relative">
        <OpenStreetMapLiveMap
          features={features}
          tripRoutes={data.trip_routes}
          hotZones={hotZones}
          bounds={leafletBounds}
          zoneLabel={data.zone_name}
          cityLabel={data.city}
          animateDriverMoves
        />
        {legend}
      </div>
    );
  }

  if (engine === "mapbox") {
    return (
      <div className="relative">
        <MapboxMap
          features={features}
          tripRoutes={data.trip_routes}
          hotZones={hotZones}
          bounds={mapboxBounds}
          zoneLabel={data.zone_name}
          cityLabel={data.city}
          animateDriverMoves
        />
        {legend}
      </div>
    );
  }

  return <LiveMapCanvasLegacy data={data} hotZones={hotZones} />;
}
