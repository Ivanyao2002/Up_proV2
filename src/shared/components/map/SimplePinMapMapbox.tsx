"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/core/config/env";
import {
  ABIDJAN_MAP_BOUNDS,
  type MapBounds,
} from "@/shared/lib/mapProjection";
import { resolveMapEngine } from "@/core/config/mapProvider";
import type { SimpleMapPin } from "./SimplePinMapOsm";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

interface SimplePinMapMapboxProps {
  pins: SimpleMapPin[];
  bounds?: MapBounds;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  overlayLabel?: string;
  cursorCrosshair?: boolean;
}

function createPinElement(pin: SimpleMapPin): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = pin.pulse ? "16px" : "14px";
  el.style.height = pin.pulse ? "16px" : "14px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = pin.color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = pin.pulse
    ? `0 0 0 4px ${pin.color}55, 0 1px 4px rgba(0,0,0,0.35)`
    : "0 1px 4px rgba(0,0,0,0.35)";
  return el;
}

export function SimplePinMapMapbox({
  pins,
  bounds = ABIDJAN_MAP_BOUNDS,
  center,
  zoom = 12,
  onMapClick,
  className = "h-[min(380px,50vh)]",
  overlayLabel,
  cursorCrosshair = false,
}: SimplePinMapMapboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onClickRef = useRef(onMapClick);

  useEffect(() => {
    onClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!env.mapboxToken || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.mapboxToken;

    const mapCenter: [number, number] = center
      ? [center.lng, center.lat]
      : [
          (bounds.lng_min + bounds.lng_max) / 2,
          (bounds.lat_min + bounds.lat_max) / 2,
        ];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: mapCenter,
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.fitBounds(
      [
        [bounds.lng_min, bounds.lat_min],
        [bounds.lng_max, bounds.lat_max],
      ],
      { padding: 24 }
    );
    mapRef.current = map;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      onClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
    };
    if (onMapClick || cursorCrosshair) {
      map.getCanvas().style.cursor = "crosshair";
    }
    if (onMapClick) {
      map.on("click", handleClick);
    }

    return () => {
      map.off("click", handleClick);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init carte une fois
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const pin of pins) {
      const marker = new mapboxgl.Marker({
        element: createPinElement(pin),
        anchor: "center",
      })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [pins]);

  if (resolveMapEngine() !== "mapbox") {
    return null;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-map shadow-card ${className}`}
    >
      {overlayLabel && (
        <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-surface/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {overlayLabel}
        </p>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
