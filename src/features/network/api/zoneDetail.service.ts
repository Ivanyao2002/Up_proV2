import { apiClient } from "@/core/http/apiClient";
import type { ZoneDetail } from "@/shared/types";

export const zoneDetailService = {
  getById: (id: string | number) =>
    apiClient.get<ZoneDetail>(`/admin/network/zones/${id}`),
};
