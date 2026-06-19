import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import type { LiveMapHotZone } from "@/shared/types";
import type {
  ApiGeoHotZonesResponse,
  ApiV1ZoneItem,
} from "@/features/network/api/adminZones.api.types";
import { mapApiHotZoneToMapItem } from "@/features/network/api/adminZones.mapper";

/** Évite les doublons OPERATIONAL / SERVICE (même commune, ex. Plateau / ABJ_PLATEAU). */
function dedupeHotZoneItems(items: ApiV1ZoneItem[]): ApiV1ZoneItem[] {
  const byKey = new Map<string, ApiV1ZoneItem>();

  for (const item of items) {
    const key = `${item.city_id ?? ""}:${(item.label ?? item.code ?? item.id).toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    const score = (zone: ApiV1ZoneItem) =>
      (zone.priority ?? 0) * 10 +
      (zone.zone_type === "OPERATIONAL" ? 5 : 0) +
      (zone.heatLevel ?? 0);

    if (score(item) > score(existing)) {
      byKey.set(key, item);
    }
  }

  return [...byKey.values()];
}

export async function fetchLiveMapHotZones(): Promise<LiveMapHotZone[]> {
  const [response, lookups] = await Promise.all([
    apiClient.get<ApiGeoHotZonesResponse>(LINKS.admin.zones.geoHot),
    fetchNetworkLookups(),
  ]);

  const rows: LiveMapHotZone[] = [];

  for (const item of dedupeHotZoneItems(response.items ?? [])) {
    const mapped = mapApiHotZoneToMapItem(item, lookups);
    const lng = mapped.center_lng;
    const lat = mapped.center_lat;
    if (lng == null || lat == null || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      continue;
    }

    rows.push({
      id: String(mapped.id),
      name: mapped.name,
      lng,
      lat,
      heatLevel: item.heatLevel ?? mapped.heatLevel ?? 1,
      surge: item.surge ?? mapped.surge_multiplier,
      franchise_id: item.franchise_id ?? null,
      city: mapped.city,
      polygon_geojson: mapped.polygon_geojson,
    });
  }

  return rows;
}

export function filterHotZonesByFranchise(
  zones: LiveMapHotZone[],
  franchiseId: string | number | null | undefined
): LiveMapHotZone[] {
  if (franchiseId == null) return zones;
  return zones.filter((z) => String(z.franchise_id ?? "") === String(franchiseId));
}
