"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/core/config/env";
import { resolveMapEngine } from "@/core/config/mapProvider";
import type { MapBounds } from "@/shared/lib/mapProjection";
import type { ZoneMapItem } from "./AbidjanZonesMap";

mapboxgl.accessToken = env.mapboxToken;

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const ZONES_SOURCE = "zones-geojson";
const ZONES_FILL = "zones-fill";
const ZONES_OUTLINE = "zones-outline";
const ZONES_POINTS = "zones-points";
const DRAFT_SOURCE = "zones-draft";
const DRAFT_LINE = "zones-draft-line";
const DRAFT_FILL = "zones-draft-fill";
const DRAFT_POINTS = "zones-draft-points";

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const ZONE_FILL_COLORS = [
  "rgba(10,179,156,0.35)",
  "rgba(64,81,137,0.28)",
  "rgba(245,158,11,0.28)",
  "rgba(99,102,241,0.25)",
  "rgba(236,72,153,0.22)",
];

const IVORY_COAST_CENTER: [number, number] = [-5.5, 7.5];
const DEFAULT_ZOOM = 6;

function isMapAlive(map: mapboxgl.Map | null | undefined): map is mapboxgl.Map {
  if (!map) return false;
  try {
    return Boolean(map.getContainer?.());
  } catch {
    return false;
  }
}

function safeSetMapCursor(
  map: mapboxgl.Map | null | undefined,
  cursor: string
): void {
  if (!isMapAlive(map)) return;
  try {
    const canvas = map.getCanvas?.();
    if (canvas && typeof canvas.style !== "undefined") {
      canvas.style.cursor = cursor;
    }
  } catch {
    // Map déjà détruite
  }
}

function detachMapInteractionListeners(
  map: mapboxgl.Map,
  handlers: {
    handleZoneClick: (
      e: mapboxgl.MapMouseEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[];
      }
    ) => void;
    handleDrawClick: (e: mapboxgl.MapMouseEvent) => void;
    setPointer: () => void;
    resetPointer: () => void;
  }
): void {
  if (!isMapAlive(map)) return;
  try {
    map.off("click", ZONES_FILL, handlers.handleZoneClick);
    map.off("click", ZONES_POINTS, handlers.handleZoneClick);
    map.off("mouseenter", ZONES_FILL, handlers.setPointer);
    map.off("mouseenter", ZONES_POINTS, handlers.setPointer);
    map.off("mouseleave", ZONES_FILL, handlers.resetPointer);
    map.off("mouseleave", ZONES_POINTS, handlers.resetPointer);
    map.off("click", handlers.handleDrawClick);
  } catch {
    // Carte déjà détruite
  }
}

function isValidCoord(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function zonesToGeoJson(
  zones: ZoneMapItem[],
  selectedZoneId?: number | string | null,
  interactive = true
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  zones.forEach((zone, index) => {
    const selected = String(selectedZoneId) === String(zone.id);
    const props = {
      id: String(zone.id),
      name: zone.name,
      selected,
      colorIndex: index % ZONE_FILL_COLORS.length,
      interactive,
    };

    const ring = zone.polygon_geojson?.coordinates?.[0];
    if (ring?.length) {
      features.push({
        type: "Feature",
        properties: props,
        geometry: {
          type: "Polygon",
          coordinates: zone.polygon_geojson!.coordinates,
        },
      });
      return;
    }

    if (
      zone.center_lng != null &&
      zone.center_lat != null &&
      isValidCoord(zone.center_lng, zone.center_lat)
    ) {
      features.push({
        type: "Feature",
        properties: props,
        geometry: {
          type: "Point",
          coordinates: [zone.center_lng, zone.center_lat],
        },
      });
    }
  });

  return { type: "FeatureCollection", features };
}

function draftToGeoJson(draftRing: number[][]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  if (draftRing.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: draftRing,
      },
    });
  }
  if (draftRing.length >= 3) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[...draftRing, draftRing[0]!]],
      },
    });
    for (const [lng, lat] of draftRing) {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [lng, lat] },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

function computeFitBounds(zones: ZoneMapItem[]): mapboxgl.LngLatBounds | null {
  const bounds = new mapboxgl.LngLatBounds();
  let hasPoint = false;

  for (const zone of zones) {
    const ring = zone.polygon_geojson?.coordinates?.[0];
    if (ring?.length) {
      for (const [lng, lat] of ring) {
        if (isValidCoord(lng, lat)) {
          bounds.extend([lng, lat]);
          hasPoint = true;
        }
      }
    } else if (
      zone.center_lng != null &&
      zone.center_lat != null &&
      isValidCoord(zone.center_lng, zone.center_lat)
    ) {
      bounds.extend([zone.center_lng, zone.center_lat]);
      hasPoint = true;
    }
  }

  return hasPoint ? bounds : null;
}

function mapBoundsToLngLatBounds(bounds: MapBounds): mapboxgl.LngLatBounds {
  return new mapboxgl.LngLatBounds(
    [bounds.lng_min, bounds.lat_min],
    [bounds.lng_max, bounds.lat_max]
  );
}

function setGeoJsonSourceData(
  map: mapboxgl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
): void {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
  }
}

function ensureMapLayers(map: mapboxgl.Map): void {
  if (!map.getSource(ZONES_SOURCE)) {
    map.addSource(ZONES_SOURCE, { type: "geojson", data: EMPTY_FC });
  }
  if (!map.getSource(DRAFT_SOURCE)) {
    map.addSource(DRAFT_SOURCE, { type: "geojson", data: EMPTY_FC });
  }

  if (!map.getLayer(ZONES_FILL)) {
    map.addLayer({
      id: ZONES_FILL,
      type: "fill",
      source: ZONES_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": [
          "case",
          ["get", "selected"],
          "rgba(10,179,156,0.45)",
          [
            "match",
            ["get", "colorIndex"],
            0,
            ZONE_FILL_COLORS[0]!,
            1,
            ZONE_FILL_COLORS[1]!,
            2,
            ZONE_FILL_COLORS[2]!,
            3,
            ZONE_FILL_COLORS[3]!,
            ZONE_FILL_COLORS[4]!,
          ],
        ],
        "fill-opacity": 0.55,
      },
    });
  }

  if (!map.getLayer(ZONES_OUTLINE)) {
    map.addLayer({
      id: ZONES_OUTLINE,
      type: "line",
      source: ZONES_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "line-color": ["case", ["get", "selected"], "#0ab39c", "#405189"],
        "line-width": ["case", ["get", "selected"], 2.5, 1.2],
      },
    });
  }

  if (!map.getLayer(ZONES_POINTS)) {
    map.addLayer({
      id: ZONES_POINTS,
      type: "circle",
      source: ZONES_SOURCE,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": ["case", ["get", "selected"], 10, 7],
        "circle-color": [
          "case",
          ["get", "selected"],
          "rgba(10,179,156,0.75)",
          [
            "match",
            ["get", "colorIndex"],
            0,
            ZONE_FILL_COLORS[0]!,
            1,
            ZONE_FILL_COLORS[1]!,
            2,
            ZONE_FILL_COLORS[2]!,
            3,
            ZONE_FILL_COLORS[3]!,
            ZONE_FILL_COLORS[4]!,
          ],
        ],
        "circle-stroke-color": ["case", ["get", "selected"], "#0ab39c", "#405189"],
        "circle-stroke-width": ["case", ["get", "selected"], 2, 1],
        "circle-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(DRAFT_LINE)) {
    map.addLayer({
      id: DRAFT_LINE,
      type: "line",
      source: DRAFT_SOURCE,
      filter: ["==", ["geometry-type"], "LineString"],
      paint: {
        "line-color": "#0ab39c",
        "line-width": 2.5,
        "line-dasharray": [2, 1],
      },
    });
  }

  if (!map.getLayer(DRAFT_FILL)) {
    map.addLayer({
      id: DRAFT_FILL,
      type: "fill",
      source: DRAFT_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": "rgba(10,179,156,0.3)",
        "fill-outline-color": "#0ab39c",
      },
    });
  }

  if (!map.getLayer(DRAFT_POINTS)) {
    map.addLayer({
      id: DRAFT_POINTS,
      type: "circle",
      source: DRAFT_SOURCE,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 6,
        "circle-color": "#0ab39c",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    });
  }
}

interface ZonesMapboxMapProps {
  zones: ZoneMapItem[];
  cityLabel?: string;
  selectedZoneId?: number | string | null;
  onSelectZone?: (zone: ZoneMapItem) => void;
  mode?: "select" | "draw";
  draftRing?: number[][];
  onDraftPoint?: (lng: number, lat: number) => void;
  className?: string;
  emptyMessage?: string;
  /** Vue fixe (ex. Abidjan) — évite un recentrage à chaque point tracé */
  mapBounds?: MapBounds;
}

export function ZonesMapboxMap({
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
}: ZonesMapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const zonesRef = useRef(zones);
  const onSelectRef = useRef(onSelectZone);
  const onDraftRef = useRef(onDraftPoint);
  const didFitRef = useRef(false);
  const layersReadyRef = useRef(false);
  const [ready, setReady] = useState(false);

  zonesRef.current = zones;
  onSelectRef.current = onSelectZone;
  onDraftRef.current = onDraftPoint;

  const zonesGeoJson = useMemo(
    () =>
      zonesToGeoJson(
        zones,
        selectedZoneId,
        mode !== "draw"
      ),
    [zones, selectedZoneId, mode]
  );

  const draftGeoJson = useMemo(() => draftToGeoJson(draftRing), [draftRing]);

  const fitBounds = useMemo(() => {
    if (mapBounds) return mapBoundsToLngLatBounds(mapBounds);
    return computeFitBounds(zones);
  }, [mapBounds, zones]);

  const hasMappableZones = zonesGeoJson.features.length > 0;

  useEffect(() => {
    if (!env.mapboxToken || !containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: IVORY_COAST_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      ensureMapLayers(map);
      layersReadyRef.current = true;
      setReady(true);
    });
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (!isMapAlive(map)) return;
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      didFitRef.current = false;
      layersReadyRef.current = false;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !layersReadyRef.current) return;

    setGeoJsonSourceData(map, ZONES_SOURCE, zonesGeoJson);
    setGeoJsonSourceData(map, DRAFT_SOURCE, draftGeoJson);

    if (map.getLayer(ZONES_FILL)) {
      map.setPaintProperty(
        ZONES_FILL,
        "fill-opacity",
        mode === "draw" ? 0.25 : 0.55
      );
    }
    if (map.getLayer(ZONES_POINTS)) {
      map.setPaintProperty(
        ZONES_POINTS,
        "circle-opacity",
        mode === "draw" ? 0.4 : 0.9
      );
    }

    if (!didFitRef.current) {
      didFitRef.current = true;
      map.resize();
      if (fitBounds) {
        map.fitBounds(fitBounds, { padding: 56, maxZoom: 12, duration: 0 });
      } else {
        map.flyTo({ center: IVORY_COAST_CENTER, zoom: DEFAULT_ZOOM, duration: 0 });
      }
    }
  }, [zonesGeoJson, draftGeoJson, fitBounds, mode, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleZoneClick = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }
    ) => {
      if (mode === "draw") return;
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (!id) return;
      const zone = zonesRef.current.find((z) => String(z.id) === String(id));
      if (zone) onSelectRef.current?.(zone);
    };

    const handleDrawClick = (e: mapboxgl.MapMouseEvent) => {
      if (mode !== "draw" || !onDraftRef.current) return;
      onDraftRef.current(e.lngLat.lng, e.lngLat.lat);
    };

    const setPointer = () => {
      safeSetMapCursor(map, "pointer");
    };
    const resetPointer = () => {
      safeSetMapCursor(map, mode === "draw" ? "crosshair" : "");
    };

    map.on("click", ZONES_FILL, handleZoneClick);
    map.on("click", ZONES_POINTS, handleZoneClick);
    map.on("mouseenter", ZONES_FILL, setPointer);
    map.on("mouseenter", ZONES_POINTS, setPointer);
    map.on("mouseleave", ZONES_FILL, resetPointer);
    map.on("mouseleave", ZONES_POINTS, resetPointer);

    if (mode === "draw") {
      safeSetMapCursor(map, "crosshair");
      map.on("click", handleDrawClick);
    }

    return () => {
      detachMapInteractionListeners(map, {
        handleZoneClick,
        handleDrawClick,
        setPointer,
        resetPointer,
      });
      safeSetMapCursor(map, "");
    };
  }, [mode, ready]);

  if (resolveMapEngine() !== "mapbox") {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border shadow-card ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-surface/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        {cityLabel}
      </p>
      {mode === "draw" && (
        <p className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-teal/90 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
          {draftRing.length} point{draftRing.length !== 1 ? "s" : ""}
        </p>
      )}
      {mode === "select" && !hasMappableZones && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/40 text-sm text-muted backdrop-blur-[1px]">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
