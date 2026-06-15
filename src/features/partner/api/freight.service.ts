import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type FreightOfferStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

// Structure API brute (nouveau format backend)
interface FreightApiResponse {
  status: string;
  items?: FreightOffer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapFreightResponse(response: FreightApiResponse | Paginated<FreightOffer>): Paginated<FreightOffer> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return response as Paginated<FreightOffer>;
  }
  return response as Paginated<FreightOffer>;
}

export interface FreightOffer {
  id: string;
  ref: string;
  origin_label: string;
  destination_label: string;
  distance_km: number;
  weight_kg?: number;
  volume_m3?: number;
  price_fcfa: number;
  status: FreightOfferStatus;
  goods_type: string;
  pickup_date?: string;
  requested_at: string;
  client_name: string;
  client_phone?: string;
}

export interface CreateFreightOfferPayload {
  origin_label: string;
  origin_lat: number;
  origin_lng: number;
  destination_label: string;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  weight_kg?: number;
  volume_m3?: number;
  price_fcfa: number;
  goods_type: string;
  pickup_date?: string;
  client_name: string;
  client_phone?: string;
  notes?: string;
}


export interface UpdateFreightOfferPayload {
  status: "accepted" | "rejected";
  rejection_reason?: string;
}

export const partnerFreightService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<FreightApiResponse>(
      `${LINKS.partner.freight.list(partnerId)}${buildListQuery(params)}`
    );
    return mapFreightResponse(response);
  },

  create: (partnerId: string | number, data: CreateFreightOfferPayload) =>
    apiClient.post<FreightOffer>(LINKS.partner.freight.create(partnerId), data),


  update: (partnerId: string | number, offerId: string, data: UpdateFreightOfferPayload) =>
    apiClient.patch<FreightOffer>(
      LINKS.partner.freight.update(partnerId, offerId),
      data
    ),

  delete: (partnerId: string | number, offerId: string) =>
    apiClient.delete<void>(LINKS.partner.freight.delete(partnerId, offerId)),
};
