import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Partner } from "@/shared/types";

export const partnersService = {
  listAdmin: () => apiClient.get<Paginated<Partner>>("/admin/network/partners"),
};
