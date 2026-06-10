import { LIVE_MAP_AVAILABILITY_COLORS } from "@/features/ops/lib/liveMapAvailabilityColors";
import {
  formatLiveMapVehicleLine,
  getLiveMapVehicleColorLabel,
} from "@/features/ops/lib/liveMapDriverDisplay";
import type { LiveMapData, LiveMapDriver, LiveMapOrderMarker } from "@/shared/types";
import {
  buildDriverPopupHtml,
  buildOrderMarkerPopupHtml,
} from "./liveMapPopup";

export interface MapboxPointFeature {
  id: string;
  lng: number;
  lat: number;
  kind: "driver" | "pickup" | "dropoff";
  color: string;
  label: string;
  sublabel?: string;
  pulse?: boolean;
  heading?: number;
  speedKmh?: number;
  vehicleIconUrl?: string;
  popupHtml: string;
}

export function mapLiveMapDriverToFeature(driver: LiveMapDriver): MapboxPointFeature {
  const tripLine = driver.active_trip
    ? `${driver.active_trip.ref} · ${driver.active_trip.from_label} → ${driver.active_trip.to_label}`
    : undefined;
  const colorLabel = getLiveMapVehicleColorLabel(driver);
  const vehicleInfo = [
    formatLiveMapVehicleLine(driver),
    colorLabel ? `Couleur : ${colorLabel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: `driver-${driver.id}`,
    lng: driver.lng,
    lat: driver.lat,
    kind: "driver",
    color: LIVE_MAP_AVAILABILITY_COLORS[driver.availability],
    label: driver.name,
    sublabel:
      tripLine ?? [driver.partner_name, vehicleInfo].filter(Boolean).join(" · "),
    pulse: driver.availability === "online" || driver.availability === "on_trip",
    heading: driver.heading,
    speedKmh: driver.speed_kmh,
    vehicleIconUrl: driver.vehicle_icon_url,
    popupHtml: buildDriverPopupHtml(driver),
  };
}

export function liveMapDataToMapFeatures(data: LiveMapData): MapboxPointFeature[] {
  const driverFeatures: MapboxPointFeature[] = data.drivers.map((d) =>
    mapLiveMapDriverToFeature(d)
  );

  const orderFeatures: MapboxPointFeature[] = (data.order_markers ?? []).map(
    (m: LiveMapOrderMarker) => ({
      id: m.id,
      lng: m.lng,
      lat: m.lat,
      kind: m.kind,
      color: m.kind === "pickup" ? "#f59e0b" : "#6366f1",
      label: m.ref,
      sublabel: `${m.status_label} · ${m.label}`,
      pulse: m.kind === "pickup" && !m.driver_id,
      popupHtml: buildOrderMarkerPopupHtml(m),
    })
  );

  return [...driverFeatures, ...orderFeatures];
}

export function boundsToMapboxLngLatBounds(
  bounds: LiveMapData["bounds"]
): [[number, number], [number, number]] {
  return [
    [bounds.lng_min, bounds.lat_min],
    [bounds.lng_max, bounds.lat_max],
  ];
}

/** Bounds Leaflet : [[latMin, lngMin], [latMax, lngMax]] */
export function boundsToLeafletLatLngBounds(
  bounds: LiveMapData["bounds"]
): [[number, number], [number, number]] {
  return [
    [bounds.lat_min, bounds.lng_min],
    [bounds.lat_max, bounds.lng_max],
  ];
}

export type LiveMapPointFeature = MapboxPointFeature;
