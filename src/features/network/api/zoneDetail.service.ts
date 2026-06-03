import { apiClient } from "@/core/http/apiClient";
import type { ZoneDetail } from "@/shared/types";

export const zoneDetailService = {
  getById: (id: string | number) =>
    apiClient.get<ZoneDetail>(`/admin/network/zones/${id}`),

  updatePolygon: (
    id: string | number,
    polygon_geojson: NonNullable<ZoneDetail["polygon_geojson"]>
  ) =>
    apiClient.put<ZoneDetail>(`/admin/network/zones/${id}/polygon`, {
      polygon_geojson,
    }),
};
