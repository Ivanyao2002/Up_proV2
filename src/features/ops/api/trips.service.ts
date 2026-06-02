import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Trip } from "@/shared/types";

export const tripsService = {
  listAdmin: () => apiClient.get<Paginated<Trip>>("/admin/ops/trips"),
};
