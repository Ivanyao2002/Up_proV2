"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import L from "leaflet";
import { env } from "@/core/config/env";
import { resolveMapEngine } from "@/core/config/mapProvider";
import { formatDateTime } from "@/shared/lib/format";
import {
  initLeafletMap,
  lngLatToLeaflet,
  pathLngLatToLeaflet,
} from "@/shared/components/map/leafletMapCore";
import type { SosLocationPoint } from "../api/sos.types";

interface SosIncidentMapProps {
  latitude: number;
  longitude: number;
  locations?: SosLocationPoint[];
  className?: string;
}

interface PreparedTrailPoint extends SosLocationPoint {
  index: number;
  displayLat: number;
  displayLng: number;
  isFirst: boolean;
  isLast: boolean;
}

function prepareTrail(locations: SosLocationPoint[]): PreparedTrailPoint[] {
  const sorted = locations
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

  const groups = new Map<string, number[]>();
  sorted.forEach((point, index) => {
    const key = `${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(index);
    groups.set(key, bucket);
  });

  return sorted.map((point, index) => {
    const key = `${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}`;
    const group = groups.get(key) ?? [index];
    const positionInGroup = group.indexOf(index);
    const groupSize = group.length;
    const spreadRadius = 0.00006;
    const angle = (Math.PI * 2 * positionInGroup) / Math.max(groupSize, 1);

    return {
      ...point,
      index: index + 1,
      displayLat:
        groupSize > 1
          ? point.latitude + Math.cos(angle) * spreadRadius
          : point.latitude,
      displayLng:
        groupSize > 1
          ? point.longitude + Math.sin(angle) * spreadRadius
          : point.longitude,
      isFirst: index === 0,
      isLast: index === sorted.length - 1,
    };
  });
}

function popupHtml(point: PreparedTrailPoint): string {
  return [
    `<strong>Position ${point.index}</strong>`,
    formatDateTime(point.recorded_at),
    point.accuracy_meters != null ? `Précision ±${point.accuracy_meters} m` : null,
  ]
    .filter(Boolean)
    .join("<br/>");
}

function SosMarkerElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg";
  el.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 2.82 17a2 2 0 0 0 1.71 3h14.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>';
  return el;
}

function HistoryMarkerElement(point: PreparedTrailPoint): HTMLDivElement {
  const el = document.createElement("div");
  const color = point.isLast ? "#dc2626" : point.isFirst ? "#0d9488" : "#64748b";
  el.className =
    "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-md";
  el.style.backgroundColor = color;
  el.textContent = String(point.index);
  return el;
}

function fitLeafletBounds(map: L.Map, trail: PreparedTrailPoint[], lat: number, lng: number) {
  const bounds = L.latLngBounds([]);
  bounds.extend(lngLatToLeaflet(lat, lng));
  trail.forEach((point) => bounds.extend([point.displayLat, point.displayLng]));
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }
}

function fitMapboxBounds(
  map: mapboxgl.Map,
  trail: PreparedTrailPoint[],
  lat: number,
  lng: number
) {
  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend([lng, lat]);
  trail.forEach((point) => bounds.extend([point.displayLng, point.displayLat]));
  map.fitBounds(bounds, { padding: 56, maxZoom: 16, duration: 0 });
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

    const trail = prepareTrail(locations);
    const map = initLeafletMap(containerRef.current, {
      center: lngLatToLeaflet(latitude, longitude),
      zoom: 14,
      attributionControl: false,
    });

    if (trail.length >= 2) {
      L.polyline(
        pathLngLatToLeaflet(
          trail.map((p) => [p.displayLng, p.displayLat] as [number, number])
        ),
        { color: "#f8bb10", weight: 3, opacity: 0.85 }
      ).addTo(map);
    }

    trail.forEach((point) => {
      const marker = L.marker(lngLatToLeaflet(point.displayLat, point.displayLng), {
        icon: L.divIcon({
          className: "leaflet-live-marker-icon",
          html: HistoryMarkerElement(point).outerHTML,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);
      marker.bindPopup(popupHtml(point));
    });

    if (trail.length === 0) {
      const el = SosMarkerElement();
      L.marker(lngLatToLeaflet(latitude, longitude), {
        icon: L.divIcon({
          className: "leaflet-live-marker-icon",
          html: el.outerHTML,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).addTo(map);
    } else if (trail[trail.length - 1]) {
      const last = trail[trail.length - 1];
      const el = SosMarkerElement();
      L.marker(lngLatToLeaflet(last.displayLat, last.displayLng), {
        icon: L.divIcon({
          className: "leaflet-live-marker-icon",
          html: el.outerHTML,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(popupHtml(last));
    }

    fitLeafletBounds(map, trail, latitude, longitude);

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

    const trail = prepareTrail(locations);

    mapboxgl.accessToken = env.mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (trail.length >= 2) {
        map.addSource("sos-trail", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: trail.map((p) => [p.displayLng, p.displayLat]),
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
      }

      trail.forEach((point) => {
        const marker = new mapboxgl.Marker({ element: HistoryMarkerElement(point) })
          .setLngLat([point.displayLng, point.displayLat])
          .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml(point)))
          .addTo(map);
        marker.getElement().style.zIndex = point.isLast ? "20" : "10";
      });

      if (trail.length === 0) {
        new mapboxgl.Marker({ element: SosMarkerElement() })
          .setLngLat([longitude, latitude])
          .addTo(map);
      } else {
        const last = trail[trail.length - 1];
        new mapboxgl.Marker({ element: SosMarkerElement() })
          .setLngLat([last.displayLng, last.displayLat])
          .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml(last)))
          .addTo(map);
      }

      fitMapboxBounds(map, trail, latitude, longitude);
    });

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

export function SosIncidentMapLegend({ locations = [] }: { locations?: SosLocationPoint[] }) {
  const trail = prepareTrail(locations);
  if (trail.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[9px] font-semibold text-white">
          1
        </span>
        Départ
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-[9px] font-semibold text-white">
          n
        </span>
        Intermédiaire
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-semibold text-white">
          !
        </span>
        Dernière position
      </span>
      <span>
        {trail.length} point{trail.length > 1 ? "s" : ""} sur la carte — cliquez pour l&apos;horodatage
      </span>
    </div>
  );
}
