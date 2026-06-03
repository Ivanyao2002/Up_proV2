import { apiClient } from "@/core/http/apiClient";
import type { Franchise, Paginated } from "@/shared/types";

export type FranchiseCreatePayload = {
  name: string;
  city: string;
  status: Franchise["status"];
  contact_email: string;
  contact_phone: string;
};

export const franchisesService = {
  listAdmin: () => apiClient.get<Paginated<Franchise>>("/admin/network/franchises"),

  create: (payload: FranchiseCreatePayload) =>
    apiClient.post<Franchise>("/admin/network/franchises", payload),
};
