"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/core/config/env";
import { resolveMapEngine } from "@/core/config/mapProvider";
import { fetchMapboxDrivingRoute, type LngLat } from "./mapboxDirections";
import {
  createTripDriverMarkerElement,
  updateTripDriverMarkerElement,
} from "./mapboxMarkerElement";
import { liveMapPulseBackground } from "@/features/ops/lib/liveMapAvailabilityColors";
import {
  clearAllDriverMotions,
  createMapboxDriverMotionMarker,
  removeDriverMotion,
  setDriverMotionTarget,
  type DriverMotionMarker,
} from "./mapboxDriverMotion";
import type { TripDriverLocation } from "@/shared/types";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const ROUTE_SOURCE = "trip-route-preview";
const ROUTE_LAYER = "trip-route-preview-line";

function createMarkerElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "14px";
  el.style.height = "14px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  return el;
}

interface TripRouteMapboxProps {
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

export function TripRouteMapbox({
  fromCoords,
  toCoords,
  fromLabel,
  toLabel,
  driverLocation,
  driverLive = false,
  vehicleIconUrl,
  className = "",
  heightClass = "h-48",
}: TripRouteMapboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const endpointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMotionRef = useRef<DriverMotionMarker | null>(null);
  const driverRootRef = useRef<HTMLElement | null>(null);
  const didFitBoundsRef = useRef(false);
  const [ready, setReady] = useState(false);

  const from: LngLat = [fromCoords.lng, fromCoords.lat];
  const to: LngLat = [toCoords.lng, toCoords.lat];

  useEffect(() => {
    if (!env.mapboxToken || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: from,
      zoom: 12,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      if (driverMotionRef.current) {
        removeDriverMotion(driverMotionRef.current);
        driverMotionRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      driverRootRef.current = null;
      clearAllDriverMotions();
      endpointMarkersRef.current.forEach((m) => m.remove());
      endpointMarkersRef.current = [];
      didFitBoundsRef.current = false;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !env.mapboxToken) return;

    endpointMarkersRef.current.forEach((m) => m.remove());
    endpointMarkersRef.current = [];

    const fromMarker = new mapboxgl.Marker({
      element: createMarkerElement("#405189"),
      anchor: "center",
    })
      .setLngLat(from)
      .addTo(map);
    const toMarker = new mapboxgl.Marker({
      element: createMarkerElement("#0ab39c"),
      anchor: "center",
    })
      .setLngLat(to)
      .addTo(map);
    endpointMarkersRef.current = [fromMarker, toMarker];

    if (!didFitBoundsRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(from);
      bounds.extend(to);
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
      didFitBoundsRef.current = true;
    }

    let cancelled = false;

    fetchMapboxDrivingRoute(from, to, env.mapboxToken).then((coordinates) => {
      if (cancelled || !mapRef.current) return;

      const path = coordinates ?? [from, to];

      if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
      if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: path },
        },
      });
      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#0ab39c",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (!driverLocation) {
      if (driverMotionRef.current) {
        removeDriverMotion(driverMotionRef.current);
        driverMotionRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      driverRootRef.current = null;
      return;
    }

    const target: [number, number] = [driverLocation.lng, driverLocation.lat];

    if (!driverMarkerRef.current || !driverMotionRef.current || !driverRootRef.current) {
      const el = createTripDriverMarkerElement({
        vehicleIconUrl: vehicleIconUrl ?? undefined,
        pulse: true,
        pulseColor: liveMapPulseBackground("#166534"),
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(target)
        .addTo(map);
      driverMarkerRef.current = marker;
      driverRootRef.current = el;
      driverMotionRef.current = createMapboxDriverMotionMarker(marker);
      setDriverMotionTarget(
        driverMotionRef.current,
        el,
        target,
        driverLocation.heading,
        driverLocation.speed_kmh
      );
      return;
    }

    updateTripDriverMarkerElement(driverRootRef.current, {
      vehicleIconUrl: vehicleIconUrl ?? undefined,
      pulseColor: liveMapPulseBackground("#166534"),
    });
    setDriverMotionTarget(
      driverMotionRef.current,
      driverRootRef.current,
      target,
      driverLocation.heading,
      driverLocation.speed_kmh
    );
  }, [
    ready,
    driverLocation?.lat,
    driverLocation?.lng,
    driverLocation?.heading,
    driverLocation?.speed_kmh,
    vehicleIconUrl,
  ]);

  if (resolveMapEngine() !== "mapbox") {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border shadow-card ${heightClass} ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {driverLocation && (
        <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          Véhicule en course
          {driverLive ? (
            <span className="ml-1.5 inline-flex items-center gap-1 text-teal-dark">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
              Live
            </span>
          ) : null}
        </p>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-between gap-2 text-[10px]">
        <span className="max-w-[45%] truncate rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          {fromLabel}
        </span>
        <span className="max-w-[45%] truncate rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          {toLabel}
        </span>
      </div>
    </div>
  );
}
