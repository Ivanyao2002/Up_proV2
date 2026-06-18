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
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
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

  getById: async (partnerId: string | number, id: string) => {
    const response = await apiClient.get<
      { order?: ApiBookingItem; trip?: ApiBookingItem } & Partial<ApiBookingItem>
    >(LINKS.partner.trips.getById(partnerId, id));
    const raw = response.order ?? response.trip ?? (response.id ? (response as unknown as ApiBookingItem) : null);
    if (raw) {
      return mapApiBookingItemToPartnerBooking(raw);
    }
    throw new Error("Commande introuvable.");
  },
};
