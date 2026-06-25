import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import { RENTAL_STATUS_CONFIG, type RentalStatus } from "../lib/rentalStatus";

/**
 * Statut d'une réservation. Le modèle canonique (12 états) vit dans
 * lib/rentalStatus.ts ; `RentalOfferStatus` en est un alias conservé pour la
 * compatibilité des imports existants.
 */
export type RentalOfferStatus = RentalStatus;

/** Statuts legacy (ancien backend 6 états) → modèle canonique. */
const LEGACY_STATUS_MAP: Record<string, RentalStatus> = {
  pending: "awaiting_confirmation",
  rejected: "cancelled",
};

function normalizeRentalStatus(raw: unknown): RentalStatus {
  const v = typeof raw === "string" ? raw : "";
  if (v in RENTAL_STATUS_CONFIG) return v as RentalStatus;
  return LEGACY_STATUS_MAP[v] ?? "draft";
}

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
    status: normalizeRentalStatus(raw.status),
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

/** État de la caution (cf. DB-RENT-15). */
export type RentalDepositStatus = "none" | "held" | "released" | "withheld";

/** Extras calculés au check-out (DB-RENT-13). Le calcul est fait côté serveur. */
export interface RentalExtras {
  late_fcfa?: number;
  km_extra_fcfa?: number;
  damages_fcfa?: number;
  total_fcfa: number;
}

export interface RentalOffer {
  id: string;
  ref: string;
  vehicle_id?: string;
  /** Véhicule de la flotte LOCATION dédiée (DB-RENT-10), distinct du véhicule VTC. */
  rental_vehicle_id?: string;
  vehicle_label?: string;
  vehicle_plate?: string;
  driver_id?: string;
  driver_name?: string;
  /** Location avec chauffeur (option activable). */
  with_driver?: boolean;
  client_name: string;
  client_phone?: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location?: string;
  /** Prix total (legacy, conservé). Le détail est dans le breakdown ci-dessous. */
  price_fcfa: number;
  base_price_fcfa?: number;
  options_total_fcfa?: number;
  /** Extras calculés au check-out (retard, dépassement km, dommages) — DB-RENT-13. */
  extras_total_fcfa?: number;
  deposit_fcfa?: number;
  deposit_status?: RentalDepositStatus;
  /** Options sélectionnées (chauffeur, livraison, accessoires…). */
  options?: string[];
  /** Statut métier (modèle canonique 12 états, cf. lib/rentalStatus.ts). */
  status: RentalOfferStatus;
  notes?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  // États des lieux (DB-RENT-13)
  check_in_at?: string;
  check_out_at?: string;
  km_start?: number;
  km_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  damages?: string[];
  extras?: RentalExtras;
  created_at: string;
}

export interface CreateRentalOfferPayload {
  vehicle_id?: string;
  rental_vehicle_id?: string;
  with_driver?: boolean;
  options?: string[];
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
  rental_vehicle_id?: string;
  driver_id?: string;
  /** Obligatoire côté serveur lors d'un refus (DB-RENT-05). */
  rejection_reason?: string;
  cancellation_reason?: string;
  notes?: string;
}

export interface RentalReschedulePayload {
  pickup_date: string;
  return_date: string;
  reason?: string;
}

/** Compteurs + agrégats financiers (DB-RENT-02). */
export interface RentalStats {
  counters: Partial<Record<RentalOfferStatus | "total", number>>;
  revenue_fcfa: number;
  deposits_held_fcfa: number;
}

export const partnerRentalService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<RentalApiResponse>(
      `${LINKS.partner.rental.list(partnerId)}${buildListQuery(params)}`
    );
    return mapRentalResponse(response);
  },

  // Détail direct (DB-RENT-01). Fallback historique : dérivation depuis la liste
  // tant que l'endpoint détail n'est pas livré côté backend.
  getById: async (partnerId: string | number, offerId: string) => {
    try {
      const offer = await apiClient.get<RentalOffer>(
        LINKS.partner.rental.detail(partnerId, offerId)
      );
      if (offer && (offer as Partial<RentalOffer>).id) {
        return mapRentalOffer(offer as unknown as Record<string, unknown>);
      }
    } catch {
      // endpoint détail absent → fallback liste
    }
    const response = await apiClient.get<RentalApiResponse>(
      `${LINKS.partner.rental.list(partnerId)}${buildListQuery({ per_page: 200 })}`
    );
    const list = mapRentalResponse(response).data;
    return list.find((o) => o.id === offerId || o.ref === offerId) ?? null;
  },

  // Compteurs + agrégats (DB-RENT-02).
  stats: (partnerId: string | number) =>
    apiClient.get<RentalStats>(LINKS.partner.rental.stats(partnerId)),

  create: (partnerId: string | number, data: CreateRentalOfferPayload) =>
    apiClient.post<RentalOffer>(LINKS.partner.rental.create(partnerId), data),

  reschedule: (
    partnerId: string | number,
    offerId: string,
    data: RentalReschedulePayload
  ) =>
    apiClient.post<RentalOffer>(
      LINKS.partner.rental.reschedule(partnerId, offerId),
      data
    ),

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
