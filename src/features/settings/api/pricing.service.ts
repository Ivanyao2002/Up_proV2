import { apiClient } from "@/core/http/apiClient";

import type { Paginated, PricingRule } from "@/shared/types";



export interface CreatePricingPayload {

  zone_name: string;

  service?: PricingRule["service"];

  base_fare_fcfa?: number;

  per_km_fcfa?: number;

  min_fare_fcfa?: number;

  surge_multiplier?: number;

  status?: PricingRule["status"];

}

export type UpdatePricingPayload = Omit<CreatePricingPayload, "zone_name"> & {
  service?: PricingRule["service"];
};



export const pricingService = {

  list: () => apiClient.get<Paginated<PricingRule>>("/admin/settings/pricing"),

  get: (id: string) => apiClient.get<PricingRule>(`/admin/settings/pricing/${id}`),

  create: (payload: CreatePricingPayload) =>

    apiClient.post<PricingRule>("/admin/settings/pricing", payload),

  update: (id: string, payload: UpdatePricingPayload) =>

    apiClient.put<PricingRule>(`/admin/settings/pricing/${id}`, payload),

};

