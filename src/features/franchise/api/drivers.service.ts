import { apiClient } from "@/core/http/apiClient";
import type { Driver, DriverDetail, Paginated } from "@/shared/types";

export const franchiseDriversService = {
  list: () => apiClient.get<Paginated<Driver>>("/franchise/drivers"),
  getById: (id: string) => apiClient.get<DriverDetail>(`/franchise/drivers/${id}`),
};
