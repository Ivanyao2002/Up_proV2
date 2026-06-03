import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Zone } from "@/shared/types";
import type { ZoneMapItem } from "../components/AbidjanZonesMap";

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
}

export const zonesService = {
  listAdmin: () => apiClient.get<Paginated<Zone>>("/admin/network/zones"),

  mapOverview: () =>
    apiClient.get<ZonesMapOverview>("/admin/network/zones/map-overview"),

  create: (payload: ZoneCreatePayload) =>
    apiClient.post<Zone>("/admin/network/zones", payload),
};
