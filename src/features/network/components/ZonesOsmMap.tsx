"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { MapBounds } from "@/shared/lib/mapProjection";
import { initLeafletMap } from "@/shared/components/map/leafletMapCore";
import {
  DEFAULT_MAP_ZOOM,
  IVORY_COAST_CENTER,
  collectZoneLatLngs,
  draftToGeoJson,
  mapBoundsToLeafletBounds,
  zoneFillColor,
  zoneStrokeColor,
  zonesToGeoJson,
} from "@/shared/components/map/zonesMapGeoJson";
import type { ZoneMapItem } from "./AbidjanZonesMap";

interface ZonesOsmMapProps {
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

export function ZonesOsmMap({
  zones,
  cityLabel = "Zones",
  selectedZoneId = null,
  onSelectZone,
  mode = "select",
  draftRing = [],
  onDraftPoint,
  className = "h-[min(380px,50vh)]",
  emptyMessage = "Aucune zone cartographiée",
  mapBounds,
}: ZonesOsmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.GeoJSON | null>(null);
  const draftLayerRef = useRef<L.GeoJSON | null>(null);
  const zonesRef = useRef(zones);
  const onSelectRef = useRef(onSelectZone);
  const onDraftRef = useRef(onDraftPoint);
  const didFitRef = useRef(false);
  const [ready, setReady] = useState(false);

  zonesRef.current = zones;
  onSelectRef.current = onSelectZone;
  onDraftRef.current = onDraftPoint;

  const zonesGeoJson = useMemo(
    () => zonesToGeoJson(zones, selectedZoneId, mode !== "draw"),
    [zones, selectedZoneId, mode]
  );

  const draftGeoJson = useMemo(() => draftToGeoJson(draftRing), [draftRing]);

  const fitBounds = useMemo(() => {
    if (mapBounds) return mapBoundsToLeafletBounds(mapBounds);
    const points = collectZoneLatLngs(zones);
    if (points.length === 0) return null;
    return L.latLngBounds(points);
  }, [mapBounds, zones]);

  const hasMappableZones = zonesGeoJson.features.length > 0;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = initLeafletMap(containerRef.current, {
      center: [IVORY_COAST_CENTER[1], IVORY_COAST_CENTER[0]],
      zoom: DEFAULT_MAP_ZOOM,
    });

    mapRef.current = map;
    setReady(true);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      zonesLayerRef.current = null;
      draftLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      didFitRef.current = false;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    zonesLayerRef.current?.remove();
    draftLayerRef.current?.remove();

    zonesLayerRef.current = L.geoJSON(zonesGeoJson, {
      style: (feature) => {
        const props = feature?.properties as {
          colorIndex?: number;
          selected?: boolean;
        };
        const colorIndex = props?.colorIndex ?? 0;
        const selected = Boolean(props?.selected);
        if (feature?.geometry.type === "Polygon") {
          return {
            color: zoneStrokeColor(selected),
            weight: selected ? 2.5 : 1.2,
            fillColor: zoneFillColor(colorIndex, selected),
            fillOpacity: mode === "draw" ? 0.25 : 0.55,
          };
        }
        return {};
      },
      pointToLayer: (feature, latlng) => {
        const props = feature.properties as {
          colorIndex?: number;
          selected?: boolean;
        };
        const colorIndex = props?.colorIndex ?? 0;
        const selected = Boolean(props?.selected);
        return L.circleMarker(latlng, {
          radius: selected ? 10 : 7,
          color: zoneStrokeColor(selected),
          weight: selected ? 2 : 1,
          fillColor: zoneFillColor(colorIndex, selected),
          fillOpacity: mode === "draw" ? 0.4 : 0.9,
        });
      },
      onEachFeature: (feature, layer) => {
        if (mode === "draw") return;
        const id = feature.properties?.id as string | undefined;
        if (!id) return;
        layer.on("click", () => {
          const zone = zonesRef.current.find((z) => String(z.id) === String(id));
          if (zone) onSelectRef.current?.(zone);
        });
        layer.on("mouseover", () => {
          map.getContainer().style.cursor = "pointer";
        });
        layer.on("mouseout", () => {
          map.getContainer().style.cursor = "";
        });
      },
    }).addTo(map);

    draftLayerRef.current = L.geoJSON(draftGeoJson, {
      style: (feature) => {
        if (feature?.geometry.type === "LineString") {
          return { color: "#0ab39c", weight: 2.5, dashArray: "6 4" };
        }
        if (feature?.geometry.type === "Polygon") {
          return {
            color: "#0ab39c",
            weight: 2,
            fillColor: "rgba(10,179,156,0.3)",
            fillOpacity: 0.35,
          };
        }
        return {};
      },
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          color: "#fff",
          weight: 2,
          fillColor: "#0ab39c",
          fillOpacity: 1,
        }),
    }).addTo(map);

    if (!didFitRef.current) {
      didFitRef.current = true;
      map.invalidateSize();
      if (fitBounds) {
        map.fitBounds(fitBounds, { padding: [56, 56], maxZoom: 12 });
      } else {
        map.setView([IVORY_COAST_CENTER[1], IVORY_COAST_CENTER[0]], DEFAULT_MAP_ZOOM);
      }
    }
  }, [zonesGeoJson, draftGeoJson, fitBounds, mode, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleDrawClick = (e: L.LeafletMouseEvent) => {
      if (mode !== "draw" || !onDraftRef.current) return;
      onDraftRef.current(e.latlng.lng, e.latlng.lat);
    };

    map.getContainer().style.cursor = mode === "draw" ? "crosshair" : "";
    map.on("click", handleDrawClick);

    return () => {
      map.off("click", handleDrawClick);
      map.getContainer().style.cursor = "";
    };
  }, [mode, ready]);

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border shadow-card ${className}`}
    >
      <div ref={containerRef} className="leaflet-live-map h-full w-full" />
      <p className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-surface/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        {cityLabel}
      </p>
      {mode === "draw" && (
        <p className="pointer-events-none absolute right-3 top-3 z-[500] rounded-lg bg-teal/90 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
          {draftRing.length} point{draftRing.length !== 1 ? "s" : ""}
        </p>
      )}
      {mode === "select" && !hasMappableZones && (
        <p className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-surface/40 text-sm text-muted backdrop-blur-[1px]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
