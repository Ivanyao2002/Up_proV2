import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  type ApiBookingItem,
  type BookingsApiResponse,
  type PartnerBooking,
  mapApiBookingItemToPartnerBooking,
} from "./bookings.service";

function mapOrdersResponse(response: BookingsApiResponse | Paginated<PartnerBooking>): Paginated<PartnerBooking> {
  if ("status" in response && response.status === "ok") {
    const rawItems = response.items ?? response.data ?? [];
    const items = rawItems.map(mapApiBookingItemToPartnerBooking);
    return {
      data: items,
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : { current_page: 1, last_page: 1, per_page: 20, total: items.length },
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

  getById: async (partnerId: string | number, id: string) => {
    const response = await apiClient.get<{ order?: ApiBookingItem }>(
      LINKS.partner.trips.getById(partnerId, id)
    );
    if (response.order) {
      return mapApiBookingItemToPartnerBooking(response.order);
    }
    throw new Error("Commande introuvable.");
  },
};
