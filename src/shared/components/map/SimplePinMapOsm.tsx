"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  ABIDJAN_MAP_BOUNDS,
  type MapBounds,
} from "@/shared/lib/mapProjection";
import {
  createMapPinElement,
  initLeafletMap,
  lngLatToLeaflet,
} from "./leafletMapCore";

export interface SimpleMapPin {
  lat: number;
  lng: number;
  color: string;
  label?: string;
  pulse?: boolean;
  title?: string;
}

interface SimplePinMapOsmProps {
  pins: SimpleMapPin[];
  bounds?: MapBounds;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  overlayLabel?: string;
  cursorCrosshair?: boolean;
}

function boundsToLeaflet(bounds: MapBounds): L.LatLngBoundsExpression {
  return [
    [bounds.lat_min, bounds.lng_min],
    [bounds.lat_max, bounds.lng_max],
  ];
}

export function SimplePinMapOsm({
  pins,
  bounds = ABIDJAN_MAP_BOUNDS,
  center,
  zoom = 12,
  onMapClick,
  className = "h-[min(380px,50vh)]",
  overlayLabel,
  cursorCrosshair = false,
}: SimplePinMapOsmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onClickRef = useRef(onMapClick);

  useEffect(() => {
    onClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapCenter = center
      ? lngLatToLeaflet(center.lat, center.lng)
      : lngLatToLeaflet(
          (bounds.lat_min + bounds.lat_max) / 2,
          (bounds.lng_min + bounds.lng_max) / 2
        );

    const map = initLeafletMap(containerRef.current, {
      center: mapCenter,
      zoom,
    });
    map.fitBounds(boundsToLeaflet(bounds), { padding: [24, 24] });
    mapRef.current = map;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onClickRef.current?.(e.latlng.lat, e.latlng.lng);
    };
    if (onMapClick) {
      map.on("click", handleClick);
      map.getContainer().style.cursor = "crosshair";
    } else if (cursorCrosshair) {
      map.getContainer().style.cursor = "crosshair";
    }

    return () => {
      map.off("click", handleClick);
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init carte une fois
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const pin of pins) {
      const el = createMapPinElement(pin.color, pin.pulse ? 16 : 14);
      if (pin.pulse) {
        el.style.boxShadow = `0 0 0 4px ${pin.color}55`;
      }
      const marker = L.marker(lngLatToLeaflet(pin.lat, pin.lng), {
        icon: L.divIcon({
          className: "leaflet-live-marker-icon",
          html: el.outerHTML,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      });
      if (pin.title || pin.label) {
        marker.bindTooltip(pin.label ?? pin.title ?? "", {
          permanent: !!pin.label,
          direction: "top",
          offset: [0, -10],
          className: "leaflet-live-tooltip",
        });
      }
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [pins]);

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-map shadow-card ${className}`}
    >
      {overlayLabel && (
        <p className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg bg-surface/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {overlayLabel}
        </p>
      )}
      <div ref={containerRef} className="leaflet-live-map h-full w-full" />
    </div>
  );
}
