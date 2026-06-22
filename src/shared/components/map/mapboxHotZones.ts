import type mapboxgl from "mapbox-gl";
import type { LiveMapHotZone } from "@/shared/types";
import { getZonePolygonRings } from "./zonesMapGeoJson";

export const HOT_ZONES_SOURCE = "live-map-hot-zones";
export const HOT_ZONES_FILL = "live-map-hot-zones-fill";
export const HOT_ZONES_OUTLINE = "live-map-hot-zones-outline";
export const HOT_ZONES_GLOW = "live-map-hot-zones-glow";
export const HOT_ZONES_CORE = "live-map-hot-zones-core";

const POLYGON_FILTER: mapboxgl.Expression = [
  "in",
  ["geometry-type"],
  ["literal", ["Polygon", "MultiPolygon"]],
];

const POINT_FILTER: mapboxgl.Expression = ["==", ["geometry-type"], "Point"];

export function hotZoneFillColor(heatLevel: number): string {
  const heat = Math.min(3, Math.max(1, heatLevel));
  if (heat >= 3) return "rgba(239,68,68,0.28)";
  if (heat >= 2) return "rgba(249,115,22,0.24)";
  return "rgba(245,158,11,0.2)";
}

export function hotZoneFillOpacity(heatLevel: number): number {
  const heat = Math.min(3, Math.max(1, heatLevel));
  if (heat >= 3) return 0.28;
  if (heat >= 2) return 0.24;
  return 0.2;
}

export function hotZoneStrokeColor(heatLevel: number): string {
  const heat = Math.min(3, Math.max(1, heatLevel));
  if (heat >= 3) return "#ef4444";
  if (heat >= 2) return "#f97316";
  return "#f59e0b";
}

function zoneGeometry(zone: LiveMapHotZone): GeoJSON.Geometry {
  const geo = zone.polygon_geojson;
  if (geo && getZonePolygonRings(geo).length > 0) {
    return geo as GeoJSON.Geometry;
  }
  return { type: "Point", coordinates: [zone.lng, zone.lat] };
}

export function hotZonesToGeoJson(zones: LiveMapHotZone[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      properties: {
        id: zone.id,
        name: zone.name,
        heatLevel: zone.heatLevel,
        surge: zone.surge ?? 1,
        city: zone.city ?? "",
      },
      geometry: zoneGeometry(zone),
    })),
  };
}

export function hotZonePopupHtml(zone: LiveMapHotZone): string {
  const surge =
    zone.surge != null && zone.surge > 1
      ? `<p class="mt-1 text-xs text-amber-700">Surge ×${zone.surge.toFixed(2)}</p>`
      : "";
  const city =
    zone.city && zone.city !== "—"
      ? `<p class="text-xs text-muted">${zone.city}</p>`
      : "";
  return `
    <div class="p-1">
      <p class="font-semibold text-sm">${zone.name}</p>
      ${city}
      <p class="mt-1 text-xs text-muted">Chaleur niveau ${zone.heatLevel}</p>
      ${surge}
    </div>
  `;
}

export function syncHotZonesLayers(
  map: mapboxgl.Map,
  zones: LiveMapHotZone[]
): void {
  const removeLayer = (id: string) => {
    if (map.getLayer(id)) map.removeLayer(id);
  };
  removeLayer(HOT_ZONES_CORE);
  removeLayer(HOT_ZONES_GLOW);
  removeLayer(HOT_ZONES_OUTLINE);
  removeLayer(HOT_ZONES_FILL);
  if (map.getSource(HOT_ZONES_SOURCE)) map.removeSource(HOT_ZONES_SOURCE);

  if (zones.length === 0) return;

  map.addSource(HOT_ZONES_SOURCE, {
    type: "geojson",
    data: hotZonesToGeoJson(zones),
  });

  map.addLayer({
    id: HOT_ZONES_FILL,
    type: "fill",
    source: HOT_ZONES_SOURCE,
    filter: POLYGON_FILTER,
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        "rgba(245,158,11,0.2)",
        2,
        "rgba(249,115,22,0.24)",
        3,
        "rgba(239,68,68,0.28)",
      ],
      "fill-opacity": 0.95,
    },
  });

  map.addLayer({
    id: HOT_ZONES_OUTLINE,
    type: "line",
    source: HOT_ZONES_SOURCE,
    filter: POLYGON_FILTER,
    paint: {
      "line-color": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        "#f59e0b",
        2,
        "#f97316",
        3,
        "#ef4444",
      ],
      "line-width": 2,
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: HOT_ZONES_GLOW,
    type: "circle",
    source: HOT_ZONES_SOURCE,
    filter: POINT_FILTER,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        36,
        2,
        52,
        3,
        68,
      ],
      "circle-color": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        "rgba(245,158,11,0.22)",
        2,
        "rgba(249,115,22,0.28)",
        3,
        "rgba(239,68,68,0.32)",
      ],
      "circle-blur": 0.6,
    },
  });

  map.addLayer({
    id: HOT_ZONES_CORE,
    type: "circle",
    source: HOT_ZONES_SOURCE,
    filter: POINT_FILTER,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        10,
        2,
        14,
        3,
        18,
      ],
      "circle-color": [
        "interpolate",
        ["linear"],
        ["get", "heatLevel"],
        1,
        "#f59e0b",
        2,
        "#f97316",
        3,
        "#ef4444",
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.5,
      "circle-opacity": 0.9,
    },
  });
}
