"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/core/config/env";
import { resolveMapEngine } from "@/core/config/mapProvider";
import L from "leaflet";
import {
  createMapPinElement,
  initLeafletMap,
  lngLatToLeaflet,
  pathLngLatToLeaflet,
} from "@/shared/components/map/leafletMapCore";
import { formatDateTime } from "@/shared/lib/format";
import { latLngToPercent } from "@/shared/lib/mapProjection";

export interface GpsTracePoint {
  at: string;
  lat: number;
  lng: number;
  speed_kmh: number;
}

interface TripForensicMapProps {
  trace: GpsTracePoint[];
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
}

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const TRACE_SOURCE = "forensic-trace-line";
const TRACE_LAYER = "forensic-trace-line";
const POINTS_SOURCE = "forensic-trace-points";
const POINTS_LAYER = "forensic-trace-points";

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

function TripForensicMapFallback({
  trace,
  fromCoords,
  toCoords,
}: TripForensicMapProps) {
  const points = trace.map((p) => latLngToPercent(p.lat, p.lng));
  const from = latLngToPercent(fromCoords.lat, fromCoords.lng);
  const to = latLngToPercent(toCoords.lat, toCoords.lng);

  const polyline = points
    .map((p) => {
      const x = parseFloat(p.left);
      const y = parseFloat(p.top);
      return `${x},${y}`;
    })
    .join(" ");

  const maxSpeed = Math.max(...trace.map((p) => p.speed_kmh), 0);
  const anomalyIdx = trace.findIndex((p) => p.speed_kmh >= 80);

  return (
    <div className="relative h-[min(420px,55vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(64,81,137,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(64,81,137,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <p className="absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        Trace GPS · {trace.length} points · max {maxSpeed} km/h
      </p>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {polyline && (
          <polyline
            points={polyline}
            fill="none"
            stroke="#405189"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        )}
        {points.map((pos, i) => {
          const x = parseFloat(pos.left);
          const y = parseFloat(pos.top);
          const isAnomaly = i === anomalyIdx;
          return (
            <circle
              key={trace[i].at}
              cx={x}
              cy={y}
              r={isAnomaly ? "1.4" : "0.8"}
              fill={isAnomaly ? "#ef4444" : "#0ab39c"}
              stroke="#fff"
              strokeWidth="0.2"
            />
          );
        })}
        <circle
          cx={parseFloat(from.left)}
          cy={parseFloat(from.top)}
          r="1.5"
          fill="#405189"
          stroke="#fff"
          strokeWidth="0.3"
        />
        <circle
          cx={parseFloat(to.left)}
          cy={parseFloat(to.top)}
          r="1.5"
          fill="#0ab39c"
          stroke="#fff"
          strokeWidth="0.3"
        />
      </svg>

      <div className="absolute bottom-3 left-3 flex gap-2 text-[10px]">
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">Départ</span>
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">Arrivée</span>
        {anomalyIdx >= 0 && (
          <span className="rounded bg-red-100 px-2 py-1 text-red-700 shadow-sm">
            Anomalie {formatDateTime(trace[anomalyIdx].at)}
          </span>
        )}
      </div>
    </div>
  );
}

function TripForensicMapbox({
  trace,
  fromCoords,
  toCoords,
}: TripForensicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  const anomalyIdx = useMemo(
    () => trace.findIndex((p) => p.speed_kmh >= 80),
    [trace]
  );
  const maxSpeed = useMemo(
    () => Math.max(...trace.map((p) => p.speed_kmh), 0),
    [trace]
  );

  const lineCoordinates = useMemo(
    () => trace.map((p) => [p.lng, p.lat] as [number, number]),
    [trace]
  );

  useEffect(() => {
    if (!env.mapboxToken || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.mapboxToken;

    const center = trace[0]
      ? ([trace[0].lng, trace[0].lat] as [number, number])
      : ([fromCoords.lng, fromCoords.lat] as [number, number]);

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom: 13,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [trace, fromCoords, toCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const fromMarker = new mapboxgl.Marker({
      element: createMarkerElement("#405189"),
      anchor: "center",
    })
      .setLngLat([fromCoords.lng, fromCoords.lat])
      .addTo(map);
    const toMarker = new mapboxgl.Marker({
      element: createMarkerElement("#0ab39c"),
      anchor: "center",
    })
      .setLngLat([toCoords.lng, toCoords.lat])
      .addTo(map);
    markersRef.current = [fromMarker, toMarker];

    if (map.getLayer(POINTS_LAYER)) map.removeLayer(POINTS_LAYER);
    if (map.getSource(POINTS_SOURCE)) map.removeSource(POINTS_SOURCE);
    if (map.getLayer(TRACE_LAYER)) map.removeLayer(TRACE_LAYER);
    if (map.getSource(TRACE_SOURCE)) map.removeSource(TRACE_SOURCE);

    if (lineCoordinates.length >= 2) {
      map.addSource(TRACE_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: lineCoordinates },
        },
      });
      map.addLayer({
        id: TRACE_LAYER,
        type: "line",
        source: TRACE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#405189",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
    }

    map.addSource(POINTS_SOURCE, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: trace.map((p, i) => ({
          type: "Feature" as const,
          properties: {
            speed: p.speed_kmh,
            anomaly: i === anomalyIdx,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [p.lng, p.lat],
          },
        })),
      },
    });
    map.addLayer({
      id: POINTS_LAYER,
      type: "circle",
      source: POINTS_SOURCE,
      paint: {
        "circle-radius": ["case", ["get", "anomaly"], 7, 4],
        "circle-color": [
          "case",
          ["get", "anomaly"],
          "#ef4444",
          "#0ab39c",
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([fromCoords.lng, fromCoords.lat]);
    bounds.extend([toCoords.lng, toCoords.lat]);
    for (const p of trace) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
  }, [
    ready,
    trace,
    lineCoordinates,
    fromCoords,
    toCoords,
    anomalyIdx,
  ]);

  return (
    <div className="relative h-[min(420px,55vh)] overflow-hidden rounded-card border border-border shadow-card">
      <div ref={containerRef} className="h-full w-full" />
      <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        Trace GPS · {trace.length} points · max {maxSpeed} km/h
      </p>
      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 text-[10px]">
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          Départ
        </span>
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          Arrivée
        </span>
        {anomalyIdx >= 0 && (
          <span className="rounded bg-red-100 px-2 py-1 text-red-700 shadow-sm">
            Anomalie {formatDateTime(trace[anomalyIdx].at)}
          </span>
        )}
      </div>
    </div>
  );
}

function TripForensicMapOsm({
  trace,
  fromCoords,
  toCoords,
}: TripForensicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const anomalyIdx = useMemo(
    () => trace.findIndex((p) => p.speed_kmh >= 80),
    [trace]
  );
  const maxSpeed = useMemo(
    () => Math.max(...trace.map((p) => p.speed_kmh), 0),
    [trace]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const center = trace[0]
      ? lngLatToLeaflet(trace[0].lat, trace[0].lng)
      : lngLatToLeaflet(fromCoords.lat, fromCoords.lng);

    const map = initLeafletMap(containerRef.current, {
      center,
      zoom: 13,
    });

    L.marker(lngLatToLeaflet(fromCoords.lat, fromCoords.lng), {
      icon: L.divIcon({
        className: "leaflet-live-marker-icon",
        html: createMapPinElement("#405189").outerHTML,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(map);

    L.marker(lngLatToLeaflet(toCoords.lat, toCoords.lng), {
      icon: L.divIcon({
        className: "leaflet-live-marker-icon",
        html: createMapPinElement("#0ab39c").outerHTML,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(map);

    if (trace.length >= 2) {
      L.polyline(
        pathLngLatToLeaflet(trace.map((p) => [p.lng, p.lat] as [number, number])),
        { color: "#405189", weight: 4, opacity: 0.85 }
      ).addTo(map);
    }

    for (const [i, point] of trace.entries()) {
      const isAnomaly = i === anomalyIdx;
      L.circleMarker(lngLatToLeaflet(point.lat, point.lng), {
        radius: isAnomaly ? 7 : 4,
        color: "#ffffff",
        weight: 1.5,
        fillColor: isAnomaly ? "#ef4444" : "#0ab39c",
        fillOpacity: 1,
      }).addTo(map);
    }

    const bounds = L.latLngBounds([
      lngLatToLeaflet(fromCoords.lat, fromCoords.lng),
      lngLatToLeaflet(toCoords.lat, toCoords.lng),
      ...trace.map((p) => lngLatToLeaflet(p.lat, p.lng)),
    ]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });

    return () => {
      map.remove();
    };
  }, [trace, fromCoords, toCoords, anomalyIdx]);

  return (
    <div className="relative h-[min(420px,55vh)] overflow-hidden rounded-card border border-border shadow-card">
      <div ref={containerRef} className="leaflet-live-map h-full w-full" />
      <p className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
        Trace GPS · {trace.length} points · max {maxSpeed} km/h
      </p>
      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 text-[10px]">
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          Départ
        </span>
        <span className="rounded bg-surface/90 px-2 py-1 text-foreground shadow-sm">
          Arrivée
        </span>
        {anomalyIdx >= 0 && (
          <span className="rounded bg-red-100 px-2 py-1 text-red-700 shadow-sm">
            Anomalie {formatDateTime(trace[anomalyIdx].at)}
          </span>
        )}
      </div>
    </div>
  );
}

export function TripForensicMap(props: TripForensicMapProps) {
  const engine = resolveMapEngine();

  if (engine === "osm") {
    return <TripForensicMapOsm {...props} />;
  }

  if (engine === "mapbox") {
    return <TripForensicMapbox {...props} />;
  }

  return <TripForensicMapFallback {...props} />;
}
