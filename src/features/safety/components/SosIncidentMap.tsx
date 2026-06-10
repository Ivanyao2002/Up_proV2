"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import L from "leaflet";
import { env } from "@/core/config/env";
import { resolveMapEngine } from "@/core/config/mapProvider";
import { initLeafletMap, lngLatToLeaflet, pathLngLatToLeaflet } from "@/shared/components/map/leafletMapCore";
import type { SosLocationPoint } from "../api/sos.types";

interface SosIncidentMapProps {
  latitude: number;
  longitude: number;
  locations?: SosLocationPoint[];
  className?: string;
}

function SosMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg";
  el.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 2.82 17a2 2 0 0 0 1.71 3h14.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';
  return el;
}

function SosIncidentMapOsm({
  latitude,
  longitude,
  locations = [],
  className = "",
}: SosIncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const map = initLeafletMap(containerRef.current, {
      center: lngLatToLeaflet(latitude, longitude),
      zoom: 14,
      attributionControl: false,
    });

    const trail = locations
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    if (trail.length >= 2) {
      L.polyline(
        pathLngLatToLeaflet(
          trail.map((p) => [p.longitude, p.latitude] as [number, number])
        ),
        { color: "#f8bb10", weight: 3, opacity: 0.85 }
      ).addTo(map);
    }

    const el = SosMarkerElement();
    L.marker(lngLatToLeaflet(latitude, longitude), {
      icon: L.divIcon({
        className: "leaflet-live-marker-icon",
        html: el.outerHTML,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [latitude, longitude, locations]);

  return (
    <div
      ref={containerRef}
      className={`leaflet-live-map overflow-hidden rounded-card border border-border shadow-card ${className}`}
      style={{ minHeight: 280 }}
    />
  );
}

function SosIncidentMapbox({
  latitude,
  longitude,
  locations = [],
  className = "",
}: SosIncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !env.mapboxToken) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    mapboxgl.accessToken = env.mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const trail = locations
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

    if (trail.length >= 2) {
      map.on("load", () => {
        map.addSource("sos-trail", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: trail.map((p) => [p.longitude, p.latitude]),
            },
          },
        });
        map.addLayer({
          id: "sos-trail-line",
          type: "line",
          source: "sos-trail",
          paint: {
            "line-color": "#f8bb10",
            "line-width": 3,
            "line-opacity": 0.85,
          },
        });
      });
    }

    new mapboxgl.Marker({ element: SosMarkerElement() })
      .setLngLat([longitude, latitude])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, locations]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden rounded-card border border-border shadow-card ${className}`}
      style={{ minHeight: 280 }}
    />
  );
}

export function SosIncidentMap(props: SosIncidentMapProps) {
  const engine = resolveMapEngine();

  if (engine === "osm") {
    return <SosIncidentMapOsm {...props} />;
  }

  if (engine === "mapbox") {
    return <SosIncidentMapbox {...props} />;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-card border border-border bg-navy/5 p-8 text-sm text-muted ${props.className ?? ""}`}
    >
      Carte indisponible — configurez OSM ou Mapbox.
    </div>
  );
}
