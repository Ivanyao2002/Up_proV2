import { apiClient } from "@/core/http/apiClient";
import type { Franchise, Paginated } from "@/shared/types";

export const franchisesService = {
  listAdmin: () => apiClient.get<Paginated<Franchise>>("/admin/network/franchises"),
};
