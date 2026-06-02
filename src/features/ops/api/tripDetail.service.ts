import { apiClient } from "@/core/http/apiClient";
import type { TripDetail } from "@/shared/types";

export const tripDetailService = {
  getById: (id: string) => apiClient.get<TripDetail>(`/admin/ops/trips/${id}`),
};
