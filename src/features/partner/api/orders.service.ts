import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  type BookingsApiResponse,
  type PartnerBooking,
  mapApiBookingItemToPartnerBooking,
} from "./bookings.service";
import {
  mapPartnerOrderDetailResponse,
  type PartnerOrderDetailApiResponse,
  type PartnerTripDetail,
} from "./partnerOrderDetail.mapper";

export interface PartnerOrdersListResponse extends Paginated<PartnerBooking> {
  counters?: {
    total: number;
    completed: number;
    cancelled: number;
    in_progress: number;
    requested: number;
  };
}

function mapOrdersResponse(
  response: BookingsApiResponse | Paginated<PartnerBooking>
): PartnerOrdersListResponse {
  if ("status" in response && response.status === "ok") {
    const rawItems = response.items ?? response.data ?? [];
    const items = rawItems.map(mapApiBookingItemToPartnerBooking);
    const counters = response.counters
      ? {
          total: response.counters.total ?? response.pagination?.total ?? items.length,
          completed: response.counters.completed ?? 0,
          cancelled: response.counters.cancelled ?? 0,
          in_progress: response.counters.in_progress ?? 0,
          requested: response.counters.requested ?? 0,
        }
      : undefined;

    return {
      data: items,
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            // `last_page` se déduit de total/limit — `hasMore ? page + 1` ne
            // donnait que « page courante + 1 » (affichage « 1 / 2 » au lieu de
            // « 1 / 5 » et impossible de sauter à la dernière page).
            last_page: Math.max(
              1,
              Math.ceil(
                response.pagination.total / (response.pagination.limit || 1)
              )
            ),
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : { current_page: 1, last_page: 1, per_page: 20, total: items.length },
      counters,
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return response as Paginated<PartnerBooking>;
  }
  return response as Paginated<PartnerBooking>;
}

export const partnerOrdersService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<BookingsApiResponse>(
      `${LINKS.partner.trips.list(partnerId)}${buildListQuery(params)}`
    );
    return mapOrdersResponse(response);
  },

  getById: async (partnerId: string | number, id: string): Promise<PartnerTripDetail> => {
    const response = await apiClient.get<
      PartnerOrderDetailApiResponse & Record<string, unknown>
    >(LINKS.partner.trips.getById(partnerId, id));
    return mapPartnerOrderDetailResponse(response);
  },
};
