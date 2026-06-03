import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData } from "@/shared/types";

export const franchiseLiveMapService = {
  get: () => apiClient.get<LiveMapData>("/franchise/ops/map"),
};
