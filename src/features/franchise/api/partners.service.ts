import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Partner } from "@/shared/types";

export interface FranchisePartner extends Partner {
  revenue_month_fcfa?: number;
}

export interface FranchisePartnerDetail extends FranchisePartner {
  legal_name: string;
  address: string;
  created_at: string;
  vehicles_count: number;
}

export const franchisePartnersService = {
  list: () => apiClient.get<Paginated<FranchisePartner>>("/franchise/partners"),
  getById: (id: string) =>
    apiClient.get<FranchisePartnerDetail>(`/franchise/partners/${id}`),
};
