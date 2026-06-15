import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { LiveMapHotZone, Paginated, Zone } from "@/shared/types";
import { fetchLiveMapHotZones } from "@/features/ops/api/liveMapHotZones.service";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ZoneMapItem } from "../components/AbidjanZonesMap";
import type {
  ApiGeoHotZonesResponse,
  ApiV1ZonesListResponse,
} from "./adminZones.api.types";
import {
  buildHotZonesFromMapItems,
  enrichMapItemsWithHotZones,
  filterZonesByFranchise,
  mapApiZoneToMapItem,
  mapApiZonesToPaginated,
  type ZoneLookupMaps,
} from "./adminZones.mapper";

export type ZoneCreatePayload = {
  name: string;
  city: string;
  franchise_id: number;
  type: Zone["type"];
  surge_multiplier: number;
  polygon_geojson?: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

export interface ZonesMapOverview {
  city: string;
  zones: ZoneMapItem[];
  hotZones: LiveMapHotZone[];
}

export async function fetchZoneSurgeById(): Promise<Map<string, number>> {
  try {
    const hot = await apiClient.get<ApiGeoHotZonesResponse>(LINKS.admin.zones.geoHot);
    const map = new Map<string, number>();
    for (const item of hot.items ?? []) {
      if (item.id && item.surge != null && item.surge > 1) {
        map.set(item.id, item.surge);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchV1Zones(params?: ListParams): Promise<ApiV1ZonesListResponse> {
  const qs = buildV1ListQuery(params);
  const extra = new URLSearchParams();
  if (params?.franchise_id != null) {
    extra.set("franchise_id", String(params.franchise_id));
  }
  if (params?.zone_id != null) {
    extra.set("city_id", String(params.zone_id));
  }
  const extraStr = extra.toString();
  const url =
    extraStr.length > 0
      ? `${LINKS.admin.zones.list}${qs ? `${qs}&${extraStr}` : `?${extraStr}`}`
      : `${LINKS.admin.zones.list}${qs}`;
  return apiClient.get<ApiV1ZonesListResponse>(url);
}

async function resolveZoneLookups(): Promise<ZoneLookupMaps> {
  const [{ cityById, franchiseNameById }, surgeByZoneId] = await Promise.all([
    fetchNetworkLookups(),
    fetchZoneSurgeById(),
  ]);
  return { cityById, franchiseNameById, surgeByZoneId };
}

export const zonesService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Zone>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Zone>>(
        `/admin/network/zones${buildListQuery(params)}`
      );
    }

    const [response, lookups] = await Promise.all([
      fetchV1Zones(params),
      resolveZoneLookups(),
    ]);
    return mapApiZonesToPaginated(response.zones ?? [], params, lookups);
  },

  listByFranchise: async (franchiseId: string): Promise<ZoneMapItem[]> => {
    if (useLegacyAdminApi()) {
      const page = await apiClient.get<Paginated<Zone>>(
        `/admin/network/zones${buildListQuery({ per_page: 200 })}`
      );
      return (page.data ?? [])
        .filter((z) => String(z.franchise_name) !== "—")
        .map((z) => ({
          id: z.id,
          name: z.name,
          type: z.type,
          city: z.city,
          franchise_name: z.franchise_name,
        }));
    }

    const [response, lookups] = await Promise.all([
      fetchV1Zones({ franchise_id: franchiseId, per_page: 200 }),
      resolveZoneLookups(),
    ]);
    const items = filterZonesByFranchise(response.zones ?? [], franchiseId);
    return items.map((item) => mapApiZoneToMapItem(item, lookups));
  },

  mapOverview: async (): Promise<ZonesMapOverview> => {
    if (useLegacyAdminApi()) {
      const overview = await apiClient.get<Omit<ZonesMapOverview, "hotZones">>(
        "/admin/network/zones/map-overview"
      );
      const zones = overview.zones ?? [];
      return {
        ...overview,
        zones,
        hotZones: buildHotZonesFromMapItems(zones),
      };
    }

    const [response, lookups, hotZones] = await Promise.all([
      fetchV1Zones({ per_page: 200 }),
      resolveZoneLookups(),
      fetchLiveMapHotZones().catch(() => [] as LiveMapHotZone[]),
    ]);
    const zones = enrichMapItemsWithHotZones(
      (response.zones ?? []).map((item) => mapApiZoneToMapItem(item, lookups)),
      hotZones
    );
    const cities = [...new Set(zones.map((z) => z.city).filter((c) => c && c !== "—"))];
    return {
      city: cities.length === 1 ? cities[0]! : "Côte d'Ivoire",
      zones,
      hotZones,
    };
  },

  franchiseMapOverview: async (franchiseId: string): Promise<ZonesMapOverview> => {
    const [response, lookups, hotZones] = await Promise.all([
      fetchV1Zones({ franchise_id: franchiseId, per_page: 200 }),
      resolveZoneLookups(),
      fetchLiveMapHotZones().catch(() => [] as LiveMapHotZone[]),
    ]);
    const filtered = filterZonesByFranchise(response.zones ?? [], franchiseId);
    const zones = enrichMapItemsWithHotZones(
      filtered.map((item) => mapApiZoneToMapItem(item, lookups)),
      hotZones.filter((hz) => !hz.franchise_id || String(hz.franchise_id) === franchiseId)
    );
    const cities = [...new Set(zones.map((z) => z.city).filter((c) => c && c !== "—"))];
    return {
      city: cities.length === 1 ? cities[0]! : "Territoire",
      zones,
      hotZones: hotZones.filter((hz) => !hz.franchise_id || String(hz.franchise_id) === franchiseId),
    };
  },

  create: (payload: ZoneCreatePayload) =>
    apiClient.post<Zone>("/admin/network/zones", payload),
};
