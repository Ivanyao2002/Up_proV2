import type { ZoneMapItem } from "@/features/network/components/AbidjanZonesMap";
import type { MapBounds } from "@/shared/lib/mapProjection";

export const ZONE_FILL_COLORS = [
  "rgba(10,179,156,0.35)",
  "rgba(64,81,137,0.28)",
  "rgba(245,158,11,0.28)",
  "rgba(99,102,241,0.25)",
  "rgba(236,72,153,0.22)",
];

export const IVORY_COAST_CENTER: [number, number] = [-5.5, 7.5];
export const DEFAULT_MAP_ZOOM = 6;

export function isValidCoord(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export function zonesToGeoJson(
  zones: ZoneMapItem[],
  selectedZoneId?: number | string | null,
  interactive = true
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  zones.forEach((zone, index) => {
    const selected = String(selectedZoneId) === String(zone.id);
    const props = {
      id: String(zone.id),
      name: zone.name,
      selected,
      colorIndex: index % ZONE_FILL_COLORS.length,
      interactive,
    };

    const ring = zone.polygon_geojson?.coordinates?.[0];
    if (ring?.length) {
      features.push({
        type: "Feature",
        properties: props,
        geometry: {
          type: "Polygon",
          coordinates: zone.polygon_geojson!.coordinates,
        },
      });
      return;
    }

    if (
      zone.center_lng != null &&
      zone.center_lat != null &&
      isValidCoord(zone.center_lng, zone.center_lat)
    ) {
      features.push({
        type: "Feature",
        properties: props,
        geometry: {
          type: "Point",
          coordinates: [zone.center_lng, zone.center_lat],
        },
      });
    }
  });

  return { type: "FeatureCollection", features };
}

export function draftToGeoJson(draftRing: number[][]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  if (draftRing.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: draftRing,
      },
    });
  }
  if (draftRing.length >= 3) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[...draftRing, draftRing[0]!]],
      },
    });
    for (const [lng, lat] of draftRing) {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [lng, lat] },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

export function collectZoneLatLngs(zones: ZoneMapItem[]): [number, number][] {
  const points: [number, number][] = [];

  for (const zone of zones) {
    const ring = zone.polygon_geojson?.coordinates?.[0];
    if (ring?.length) {
      for (const [lng, lat] of ring) {
        if (isValidCoord(lng, lat)) points.push([lat, lng]);
      }
    } else if (
      zone.center_lng != null &&
      zone.center_lat != null &&
      isValidCoord(zone.center_lng, zone.center_lat)
    ) {
      points.push([zone.center_lat, zone.center_lng]);
    }
  }

  return points;
}

export function mapBoundsToLeafletBounds(
  bounds: MapBounds
): [[number, number], [number, number]] {
  return [
    [bounds.lat_min, bounds.lng_min],
    [bounds.lat_max, bounds.lng_max],
  ];
}

export function zoneFillColor(colorIndex: number, selected: boolean): string {
  if (selected) return "rgba(10,179,156,0.45)";
  return ZONE_FILL_COLORS[colorIndex % ZONE_FILL_COLORS.length] ?? ZONE_FILL_COLORS[0]!;
}

export function zoneStrokeColor(selected: boolean): string {
  return selected ? "#0ab39c" : "#405189";
}
