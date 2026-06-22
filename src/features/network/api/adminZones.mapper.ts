import type {
  LiveMapHotZone,
  Paginated,
  Zone,
  ZoneDetail,
  ZonePolygonGeoJson,
} from "@/shared/types";
import { getZonePolygonRings } from "@/shared/components/map/zonesMapGeoJson";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ZoneMapItem } from "../components/AbidjanZonesMap";
import type { ApiV1ZoneDemandResponse, ApiV1ZoneItem } from "./adminZones.api.types";

export interface ZoneLookupMaps {
  cityById: Map<string, string>;
  franchiseNameById: Map<string, string>;
  surgeByZoneId?: Map<string, number>;
}

function mapZoneType(item: ApiV1ZoneItem): Zone["type"] {
  const code = String(item.code ?? "").toUpperCase();
  const zoneType = String(item.zone_type ?? "").toUpperCase();
  if (code.includes("AIRPORT") || code.includes("AERO")) return "airport";
  if (zoneType.includes("SURGE") || (item.surge ?? 0) > 1.05) return "surge";
  return "standard";
}

function resolveSurgeMultiplier(
  item: ApiV1ZoneItem,
  surgeByZoneId?: Map<string, number>
): number | undefined {
  const fromHot = surgeByZoneId?.get(item.id) ?? item.surge;
  if (fromHot != null && fromHot > 1) return fromHot;
  return undefined;
}

export function geometryToZoneGeoJson(
  geometry?: ApiV1ZoneItem["geometry"] | null
): ZonePolygonGeoJson | undefined {
  if (!geometry?.type || !geometry.coordinates) return undefined;

  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates as number[][][];
    if (!Array.isArray(coords) || coords.length === 0) return undefined;
    return { type: "Polygon", coordinates: coords };
  }

  if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates as number[][][][];
    if (!Array.isArray(coords) || coords.length === 0) return undefined;
    return { type: "MultiPolygon", coordinates: coords };
  }

  return undefined;
}

/** @deprecated Utiliser geometryToZoneGeoJson */
export const geometryToPolygon = geometryToZoneGeoJson;

export function mapApiZoneToZone(
  item: ApiV1ZoneItem,
  lookups: ZoneLookupMaps
): Zone {
  const city =
    (item.city_id && lookups.cityById.get(item.city_id)) || "—";
  const franchiseName =
    (item.franchise_id &&
      lookups.franchiseNameById.get(String(item.franchise_id))) ||
    "—";

  return {
    id: item.id,
    name: item.label?.trim() || item.code?.trim() || `Zone ${item.id.slice(0, 8)}`,
    city,
    franchise_name: franchiseName,
    type: mapZoneType(item),
    drivers_active: item.demand?.total ?? 0,
    surge_multiplier: resolveSurgeMultiplier(item, lookups.surgeByZoneId),
  };
}

export function mapApiZoneToMapItem(
  item: ApiV1ZoneItem,
  lookups: ZoneLookupMaps
): ZoneMapItem {
  const base = mapApiZoneToZone(item, lookups);
  return {
    id: base.id,
    name: base.name,
    type: base.type,
    city: base.city,
    franchise_name: base.franchise_name,
    polygon_geojson: geometryToZoneGeoJson(item.geometry),
    center_lng: item.center_point?.coordinates?.[0],
    center_lat: item.center_point?.coordinates?.[1],
    heatLevel: item.heatLevel,
    surge_multiplier: resolveSurgeMultiplier(item, lookups.surgeByZoneId),
  };
}

/** Zone chaude — GET /v1/geo/hot-zones (centre + heatLevel / surge) */
export function mapApiHotZoneToMapItem(
  item: ApiV1ZoneItem,
  lookups: ZoneLookupMaps
): ZoneMapItem {
  const mapped = mapApiZoneToMapItem(item, lookups);
  const heat = item.heatLevel ?? 0;
  const surge = item.surge ?? mapped.surge_multiplier;
  return {
    ...mapped,
    type:
      heat >= 2 || (surge != null && surge > 1.05) ? "surge" : mapped.type,
    heatLevel: heat > 0 ? heat : mapped.heatLevel,
    surge_multiplier: surge,
  };
}

export function mapApiZoneToDetail(
  item: ApiV1ZoneItem,
  demand: ApiV1ZoneDemandResponse | null,
  lookups: ZoneLookupMaps
): ZoneDetail {
  const base = mapApiZoneToZone(item, lookups);
  const demandTotal = demand?.demand?.total ?? item.demand?.total ?? 0;

  return {
    ...base,
    franchise_id: (item.franchise_id ?? "") as unknown as number,
    status: item.active === false ? "inactive" : "active",
    stats: {
      drivers_active: 0,
      drivers_total: 0,
      trips_24h: demandTotal,
      trips_month: demandTotal,
      revenue_month_fcfa: 0,
      avg_fare_fcfa: 0,
    },
    polygon_geojson: geometryToZoneGeoJson(item.geometry),
    center_lng: item.center_point?.coordinates?.[0],
    center_lat: item.center_point?.coordinates?.[1],
    surge_rules:
      base.surge_multiplier && base.surge_multiplier > 1
        ? [
            {
              label: "Surge actif",
              multiplier: base.surge_multiplier,
              hours: "Données geo/hot-zones",
            },
          ]
        : [],
    partners_in_zone: [],
  };
}

export function mapApiZonesToPaginated(
  items: ApiV1ZoneItem[],
  params: ListParams | undefined,
  lookups: ZoneLookupMaps
): Paginated<Zone> {
  let rows = items.map((item) => mapApiZoneToZone(item, lookups));

  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.city.toLowerCase().includes(q) ||
        z.franchise_name.toLowerCase().includes(q)
    );
  }

  if (params?.type && params.type !== "all") {
    rows = rows.filter((z) => z.type === params.type);
  }

  return paginateClientList(rows, params);
}

export function filterZonesByFranchise(
  items: ApiV1ZoneItem[],
  franchiseId: string
): ApiV1ZoneItem[] {
  return items.filter((z) => String(z.franchise_id ?? "") === franchiseId);
}

function resolveZoneCenter(zone: ZoneMapItem): { lng: number; lat: number } | null {
  if (
    zone.center_lng != null &&
    zone.center_lat != null &&
    Number.isFinite(zone.center_lng) &&
    Number.isFinite(zone.center_lat)
  ) {
    return { lng: zone.center_lng, lat: zone.center_lat };
  }

  const ring = getZonePolygonRings(zone.polygon_geojson)[0];
  if (!ring?.length) return null;

  const lng = ring.reduce((sum, coord) => sum + coord[0]!, 0) / ring.length;
  const lat = ring.reduce((sum, coord) => sum + coord[1]!, 0) / ring.length;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

/** Halo « zone chaude » à partir des items carte (fallback mocks / enrichissement). */
export function buildHotZonesFromMapItems(items: ZoneMapItem[]): LiveMapHotZone[] {
  const rows: LiveMapHotZone[] = [];

  for (const zone of items) {
    const heatFromLevel = zone.heatLevel ?? 0;
    const heatFromSurge =
      zone.surge_multiplier != null && zone.surge_multiplier > 1.05 ? 2 : 0;
    const heatFromType = zone.type === "surge" ? 2 : 0;
    const heatLevel = Math.min(
      3,
      Math.max(1, heatFromLevel || heatFromSurge || heatFromType)
    );

    if (heatFromLevel < 1 && heatFromSurge < 2 && zone.type !== "surge") {
      continue;
    }

    const center = resolveZoneCenter(zone);
    if (!center) continue;

    rows.push({
      id: String(zone.id),
      name: zone.name,
      lng: center.lng,
      lat: center.lat,
      heatLevel,
      surge: zone.surge_multiplier,
      city: zone.city,
      polygon_geojson: zone.polygon_geojson,
    });
  }

  return rows;
}

export function enrichMapItemsWithHotZones(
  items: ZoneMapItem[],
  hotZones: LiveMapHotZone[]
): ZoneMapItem[] {
  if (hotZones.length === 0) return items;

  const hotById = new Map(hotZones.map((zone) => [String(zone.id), zone]));
  return items.map((item) => {
    const hot = hotById.get(String(item.id));
    if (!hot) return item;

    return {
      ...item,
      heatLevel: hot.heatLevel,
      surge_multiplier: hot.surge ?? item.surge_multiplier,
      type:
        hot.heatLevel >= 2 || (hot.surge != null && hot.surge > 1.05)
          ? "surge"
          : item.type,
      center_lng: item.center_lng ?? hot.lng,
      center_lat: item.center_lat ?? hot.lat,
    };
  });
}
