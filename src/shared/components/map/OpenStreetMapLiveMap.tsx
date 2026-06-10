"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { env } from "@/core/config/env";
import type { LiveMapTripRoute, LiveMapHotZone } from "@/shared/types";
import { resolveOsmTripRoutesGeometry } from "./osmDirections";
import { updateLiveMapMarkerElement } from "./mapboxMarkerElement";
import {
  clearAllDriverMotions,
  createLeafletDriverMotionMarker,
  removeDriverMotion,
  setDriverMotionTarget,
  snapDriverMarker,
} from "./mapboxDriverMotion";
import { syncLeafletHotZones } from "./leafletHotZones";
import {
  createLeafletLiveMarker,
  ensureLeafletMarkerMounted,
  type LeafletLiveMarkerEntry,
} from "./leafletLiveMapMarker";
import type { DriverMotionMarker } from "./mapboxDriverMotion";
import type { MapboxPointFeature } from "./mapboxMarkers";

function isValidMapCoord(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

interface StoredMarker {
  entry: LeafletLiveMarkerEntry;
  motion: DriverMotionMarker;
}

interface OpenStreetMapLiveMapProps {
  features: MapboxPointFeature[];
  tripRoutes?: LiveMapTripRoute[];
  hotZones?: LiveMapHotZone[];
  bounds?: [[number, number], [number, number]];
  zoneLabel?: string;
  cityLabel?: string;
  className?: string;
  animateDriverMoves?: boolean;
}

function lngLatPathToLeaflet(
  coordinates: [number, number][]
): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

export function OpenStreetMapLiveMap({
  features,
  tripRoutes = [],
  hotZones = [],
  bounds,
  zoneLabel,
  cityLabel,
  className = "",
  animateDriverMoves = false,
}: OpenStreetMapLiveMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersByIdRef = useRef<Map<string, StoredMarker>>(new Map());
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const hotZonesLayerRef = useRef<L.LayerGroup | null>(null);
  const didFitBoundsRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Map<string, [number, number][]>>(
    () => new Map()
  );
  const routesRequestRef = useRef(0);

  useEffect(() => {
    const onPopupLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "a.mapbox-live-popup__link"
      );
      if (!target || !(target instanceof HTMLAnchorElement)) return;

      const href = target.getAttribute("href");
      if (!href?.startsWith("/")) return;

      event.preventDefault();
      event.stopPropagation();
      router.push(href);
    };

    document.addEventListener("click", onPopupLinkClick, true);
    return () => document.removeEventListener("click", onPopupLinkClick, true);
  }, [router]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [5.35, -3.99],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(env.osmTileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    routesLayerRef.current = L.layerGroup().addTo(map);
    hotZonesLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
    setReady(true);

    return () => {
      clearAllDriverMotions();
      markersByIdRef.current.forEach(({ entry }) => entry.marker.remove());
      markersByIdRef.current.clear();
      didFitBoundsRef.current = false;
      routesLayerRef.current = null;
      hotZonesLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || tripRoutes.length === 0) {
      setRouteCoords(new Map());
      return;
    }

    const requestId = ++routesRequestRef.current;
    let cancelled = false;

    const segments = tripRoutes
      .filter((r) => r.coordinates.length >= 2)
      .map((r) => ({
        order_id: r.order_id,
        from: r.coordinates[0],
        to: r.coordinates[r.coordinates.length - 1],
        fallback: r.coordinates,
      }));

    resolveOsmTripRoutesGeometry(segments, env.osrmUrl).then((resolved) => {
      if (cancelled || routesRequestRef.current !== requestId) return;
      setRouteCoords(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [tripRoutes, ready]);

  useEffect(() => {
    const routesLayer = routesLayerRef.current;
    if (!routesLayer || !ready) return;

    routesLayer.clearLayers();

    for (const route of tripRoutes) {
      const path = routeCoords.get(route.order_id) ?? route.coordinates;
      if (path.length < 2) continue;

      L.polyline(lngLatPathToLeaflet(path), {
        color: "#405189",
        weight: 4,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routesLayer);
    }
  }, [tripRoutes, routeCoords, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const hotZonesLayer = hotZonesLayerRef.current;
    if (!map || !hotZonesLayer || !ready) return;
    syncLeafletHotZones(map, hotZonesLayer, hotZones);
  }, [hotZones, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const markersById = markersByIdRef.current;
    const nextIds = new Set(features.map((f) => f.id));

    for (const [id, stored] of markersById) {
      if (!nextIds.has(id)) {
        removeDriverMotion(stored.motion);
        stored.entry.marker.remove();
        markersById.delete(id);
      }
    }

    for (const feature of features) {
      if (!isValidMapCoord(feature.lng, feature.lat)) continue;

      const target: [number, number] = [feature.lng, feature.lat];
      const existing = markersById.get(feature.id);
      const smoothDriver =
        animateDriverMoves && feature.kind === "driver";

      if (existing) {
        ensureLeafletMarkerMounted(existing.entry);
        updateLiveMapMarkerElement(existing.entry.root, feature);
        if (smoothDriver) {
          setDriverMotionTarget(
            existing.motion,
            existing.entry.root,
            target,
            feature.heading,
            feature.speedKmh
          );
        } else {
          removeDriverMotion(existing.motion);
          snapDriverMarker(
            existing.motion,
            existing.entry.root,
            target,
            feature.heading
          );
        }
        continue;
      }

      const entry = createLeafletLiveMarker(feature);
      const motion = createLeafletDriverMotionMarker(entry.marker, map);

      entry.marker
        .bindPopup(feature.popupHtml, {
          className: "mapbox-live-popup",
          maxWidth: 300,
          offset: [0, -12],
        })
        .addTo(map);

      ensureLeafletMarkerMounted(entry);

      if (smoothDriver) {
        setDriverMotionTarget(
          motion,
          entry.root,
          target,
          feature.heading,
          feature.speedKmh
        );
      } else {
        snapDriverMarker(motion, entry.root, target, feature.heading);
      }

      markersById.set(feature.id, { entry, motion });
    }

    if (!didFitBoundsRef.current && features.length > 0) {
      didFitBoundsRef.current = true;
      if (bounds) {
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
      } else if (features.length === 1) {
        map.setView([features[0].lat, features[0].lng], 13);
      }
    }
  }, [features, bounds, ready, animateDriverMoves]);

  return (
    <div
      className={`relative h-[min(520px,70vh)] w-full overflow-hidden rounded-card border shadow-card ${className}`}
    >
      <div ref={containerRef} className="leaflet-live-map h-full w-full" />
      {(zoneLabel || cityLabel) && (
        <p className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg bg-elevated/95 px-3 py-1.5 text-xs font-medium text-heading shadow-md backdrop-blur">
          {zoneLabel}
          {cityLabel ? (
            <span className="text-muted"> · {cityLabel}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}
