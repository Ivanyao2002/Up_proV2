import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Zone } from "@/shared/types";

export const zonesService = {
  listAdmin: () => apiClient.get<Paginated<Zone>>("/admin/network/zones"),
};
