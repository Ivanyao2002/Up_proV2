"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { LngLat } from "./mapboxDirections";
import { fetchDrivingRouteForLiveMap } from "./liveMapRouteFetch";
import {
  createMapPinElement,
  initLeafletMap,
  lngLatToLeaflet,
  pathLngLatToLeaflet,
} from "./leafletMapCore";
import {
  createTripDriverMarkerElement,
  updateTripDriverMarkerElement,
} from "./mapboxMarkerElement";
import { liveMapPulseBackground } from "@/features/ops/lib/liveMapAvailabilityColors";
import {
  clearAllDriverMotions,
  createLeafletDriverMotionMarker,
  removeDriverMotion,
  setDriverMotionTarget,
  type DriverMotionMarker,
} from "./mapboxDriverMotion";
import { getLeafletMarkerRoot } from "./leafletLiveMapMarker";
import type { TripDriverLocation } from "@/shared/types";

interface TripRouteOsmMapProps {
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

export function TripRouteOsmMap({
  fromCoords,
  toCoords,
  fromLabel,
  toLabel,
  driverLocation,
  driverLive,
  vehicleIconUrl,
  className = "",
  heightClass = "h-48",
}: TripRouteOsmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const endpointMarkersRef = useRef<L.Marker[]>([]);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const driverMotionRef = useRef<DriverMotionMarker | null>(null);
  const driverRootRef = useRef<HTMLElement | null>(null);
  const didFitBoundsRef = useRef(false);
  const [ready, setReady] = useState(false);

  const from: LngLat = [fromCoords.lng, fromCoords.lat];
  const to: LngLat = [toCoords.lng, toCoords.lat];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = initLeafletMap(containerRef.current, {
      center: lngLatToLeaflet(fromCoords.lat, fromCoords.lng),
      zoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;
    setReady(true);

    return () => {
      if (driverMotionRef.current) {
        removeDriverMotion(driverMotionRef.current);
        driverMotionRef.current = null;
      }
      clearAllDriverMotions();
      driverMarkerRef.current = null;
      driverRootRef.current = null;
      endpointMarkersRef.current.forEach((m) => m.remove());
      endpointMarkersRef.current = [];
      routeLayerRef.current = null;
      didFitBoundsRef.current = false;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    endpointMarkersRef.current.forEach((m) => m.remove());
    endpointMarkersRef.current = [];

    const fromMarker = L.marker(lngLatToLeaflet(fromCoords.lat, fromCoords.lng), {
      icon: L.divIcon({
        className: "leaflet-live-marker-icon",
        html: createMapPinElement("#405189").outerHTML,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(map);

    const toMarker = L.marker(lngLatToLeaflet(toCoords.lat, toCoords.lng), {
      icon: L.divIcon({
        className: "leaflet-live-marker-icon",
        html: createMapPinElement("#0ab39c").outerHTML,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(map);

    endpointMarkersRef.current = [fromMarker, toMarker];

    if (!didFitBoundsRef.current) {
      const bounds = L.latLngBounds([
        lngLatToLeaflet(fromCoords.lat, fromCoords.lng),
        lngLatToLeaflet(toCoords.lat, toCoords.lng),
      ]);
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
      didFitBoundsRef.current = true;
    }

    let cancelled = false;

    fetchDrivingRouteForLiveMap(from, to).then((coordinates) => {
      if (cancelled || !mapRef.current) return;
      const path = coordinates ?? [from, to];
      routeLayerRef.current?.remove();
      routeLayerRef.current = L.polyline(pathLngLatToLeaflet(path), {
        color: "#0ab39c",
        weight: 4,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
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
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      driverRootRef.current = null;
      return;
    }

    const target: [number, number] = [driverLocation.lng, driverLocation.lat];

    if (!driverMarkerRef.current || !driverMotionRef.current || !driverRootRef.current) {
      const root = createTripDriverMarkerElement({
        vehicleIconUrl: vehicleIconUrl ?? undefined,
        pulse: true,
        pulseColor: liveMapPulseBackground("#166534"),
      });

      const marker = L.marker(lngLatToLeaflet(driverLocation.lat, driverLocation.lng), {
        icon: L.divIcon({
          className: "leaflet-live-marker-icon",
          html: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(map);

      const iconEl = marker.getElement();
      if (iconEl) {
        iconEl.innerHTML = "";
        iconEl.appendChild(root);
      }

      driverMarkerRef.current = marker;
      driverRootRef.current = root;
      driverMotionRef.current = createLeafletDriverMotionMarker(marker, map);
      setDriverMotionTarget(
        driverMotionRef.current,
        root,
        target,
        driverLocation.heading,
        driverLocation.speed_kmh
      );
      return;
    }

    const mountedRoot = getLeafletMarkerRoot(driverMarkerRef.current) ?? driverRootRef.current;
    driverRootRef.current = mountedRoot;
    updateTripDriverMarkerElement(mountedRoot, {
      vehicleIconUrl: vehicleIconUrl ?? undefined,
      pulseColor: liveMapPulseBackground("#166534"),
    });
    setDriverMotionTarget(
      driverMotionRef.current,
      mountedRoot,
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

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border shadow-card ${heightClass} ${className}`}
    >
      <div ref={containerRef} className="leaflet-live-map h-full w-full" />
      {driverLocation && (
        <p className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
          Véhicule en course
          {driverLive ? (
            <span className="ml-1.5 inline-flex items-center gap-1 text-teal-dark">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
              Live
            </span>
          ) : null}
        </p>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] flex justify-between gap-2 text-[10px]">
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
