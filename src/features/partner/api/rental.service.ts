import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type RentalOfferStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled";

interface RentalApiResponse {
  status: string;
  items?: RentalOffer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/** Normalise une offre brute : dérive vehicle_label / driver_name d'éventuels objets inline. */
function mapRentalOffer(raw: Record<string, unknown>): RentalOffer {
  const vehicle = raw.vehicle as Record<string, unknown> | null | undefined;
  const driver = raw.driver as Record<string, unknown> | null | undefined;
  const vehicleLabel =
    (raw.vehicle_label as string) ??
    (vehicle
      ? (vehicle.label as string) ??
        [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ??
        (vehicle.plate_number as string)
      : undefined);
  const driverName =
    (raw.driver_name as string) ??
    (driver
      ? (driver.displayName as string) ??
        (driver.name as string) ??
        [
          (driver.first_name as string) ?? (driver.firstName as string),
          (driver.last_name as string) ?? (driver.lastName as string),
        ]
          .filter(Boolean)
          .join(" ")
      : undefined);

  return {
    ...(raw as unknown as RentalOffer),
    vehicle_label: vehicleLabel || undefined,
    vehicle_plate:
      (raw.vehicle_plate as string) ?? (vehicle?.plate_number as string) ?? undefined,
    driver_name: driverName || undefined,
  };
}

function mapRentalResponse(
  response: RentalApiResponse | Paginated<RentalOffer>
): Paginated<RentalOffer> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items.map((o) => mapRentalOffer(o as unknown as Record<string, unknown>)),
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: response.items.length,
          },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return {
      ...(response as Paginated<RentalOffer>),
      data: response.data.map((o) => mapRentalOffer(o as unknown as Record<string, unknown>)),
    };
  }
  return response as Paginated<RentalOffer>;
}

export interface RentalOffer {
  id: string;
  ref: string;
  vehicle_id?: string;
  vehicle_label?: string;
  vehicle_plate?: string;
  driver_id?: string;
  driver_name?: string;
  client_name: string;
  client_phone?: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location?: string;
  price_fcfa: number;
  deposit_fcfa?: number;
  status: RentalOfferStatus;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface CreateRentalOfferPayload {
  vehicle_id?: string;
  client_name: string;
  client_phone?: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location?: string;
  price_fcfa: number;
  deposit_fcfa?: number;
  notes?: string;
}

export interface UpdateRentalOfferPayload {
  status?: RentalOfferStatus;
  vehicle_id?: string;
  driver_id?: string;
  rejection_reason?: string;
  notes?: string;
}

export const partnerRentalService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<RentalApiResponse>(
      `${LINKS.partner.rental.list(partnerId)}${buildListQuery(params)}`
    );
    return mapRentalResponse(response);
  },

  // Pas d'endpoint GET détail côté backend : on dérive l'offre depuis la liste.
  getById: async (partnerId: string | number, offerId: string) => {
    const response = await apiClient.get<RentalApiResponse>(
      `${LINKS.partner.rental.list(partnerId)}${buildListQuery({ per_page: 200 })}`
    );
    const list = mapRentalResponse(response).data;
    return list.find((o) => o.id === offerId || o.ref === offerId) ?? null;
  },

  create: (partnerId: string | number, data: CreateRentalOfferPayload) =>
    apiClient.post<RentalOffer>(LINKS.partner.rental.create(partnerId), data),

  update: (
    partnerId: string | number,
    offerId: string,
    data: UpdateRentalOfferPayload
  ) =>
    apiClient.patch<RentalOffer>(
      LINKS.partner.rental.update(partnerId, offerId),
      data
    ),

  delete: (partnerId: string | number, offerId: string) =>
    apiClient.delete<void>(LINKS.partner.rental.delete(partnerId, offerId)),
};
