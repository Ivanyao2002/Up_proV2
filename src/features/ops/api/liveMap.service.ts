import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData } from "@/shared/types";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";

export const liveMapService = {
  getAdmin: (filters?: LiveMapScopeFiltersValue) => {
    const params = new URLSearchParams();
    if (filters?.franchiseId != null) {
      params.set("franchise_id", String(filters.franchiseId));
    }
    if (filters?.partnerId != null) {
      params.set("partner_id", String(filters.partnerId));
    }
    const qs = params.toString();
    return apiClient.get<LiveMapData>(
      `/admin/ops/map${qs ? `?${qs}` : ""}`
    );
  },
};
