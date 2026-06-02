import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData } from "@/shared/types";

export const liveMapService = {
  getAdmin: () => apiClient.get<LiveMapData>("/admin/ops/map"),
};
