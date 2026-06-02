import { apiClient } from "@/core/http/apiClient";
import type { Driver, Paginated } from "@/shared/types";

export interface DriversListParams {
  page?: number;
  search?: string;
}

export const driversService = {
  listAdmin: (params?: DriversListParams) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return apiClient.get<Paginated<Driver>>(
      `/admin/drivers${query ? `?${query}` : ""}`
    );
  },
};
