import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

/**
 * Flotte LOCATION dédiée (DB-RENT-10) — distincte de la flotte VTC.
 * Attributs propres à la location : catégorie engin, options activables,
 * documents avec dates d'expiration, statut d'exploitation.
 */

export type RentalVehicleStatus =
  | "disponible"
  | "reserve"
  | "en_cours"
  | "maintenance"
  | "indisponible";

export type RentalVehicleCategory =
  | "voiture"
  | "suv"
  | "utilitaire"
  | "bus"
  | "moto"
  | "engin";

export type RentalVehicleOption = "chauffeur" | "livraison" | "accessoires";

export type RentalVehicleTransmission = "manuelle" | "automatique";

export type RentalVehicleDocType = "assurance" | "carte_grise" | "visite_technique";

export interface RentalVehicleDocument {
  type: RentalVehicleDocType;
  /** ISO date — utilisé pour les alertes d'expiration (cahier §4.2). */
  expires_at?: string;
  file_url?: string;
}

export interface RentalVehicle {
  id: string;
  label?: string;
  brand?: string;
  model?: string;
  category: RentalVehicleCategory;
  plate?: string;
  year?: number;
  seats?: number;
  transmission?: RentalVehicleTransmission;
  status: RentalVehicleStatus;
  options?: RentalVehicleOption[];
  photos?: string[];
  documents?: RentalVehicleDocument[];
  /** Présence d'un barème de prix (DB-RENT-11) — renseigné au Lot 2. */
  has_pricing?: boolean;
  created_at?: string;
}

export interface CreateRentalVehiclePayload {
  brand: string;
  model: string;
  category: RentalVehicleCategory;
  plate?: string;
  year?: number;
  seats?: number;
  transmission?: RentalVehicleTransmission;
  options?: RentalVehicleOption[];
  photos?: string[];
  documents?: RentalVehicleDocument[];
}

export type UpdateRentalVehiclePayload = Partial<CreateRentalVehiclePayload>;

interface RentalVehicleApiResponse {
  status?: string;
  items?: RentalVehicle[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
}

function deriveLabel(raw: Record<string, unknown>): string | undefined {
  return (
    (raw.label as string) ??
    ([raw.brand, raw.model].filter(Boolean).join(" ") || undefined)
  );
}

function mapRentalVehicle(raw: Record<string, unknown>): RentalVehicle {
  return {
    ...(raw as unknown as RentalVehicle),
    label: deriveLabel(raw),
    status: (raw.status as RentalVehicleStatus) ?? "indisponible",
    category: (raw.category as RentalVehicleCategory) ?? "voiture",
  };
}

function mapResponse(
  response: RentalVehicleApiResponse | Paginated<RentalVehicle>
): Paginated<RentalVehicle> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items.map((v) =>
        mapRentalVehicle(v as unknown as Record<string, unknown>)
      ),
      meta: response.pagination
        ? {
            current_page: response.pagination.page,
            last_page: response.pagination.hasMore
              ? response.pagination.page + 1
              : response.pagination.page,
            per_page: response.pagination.limit,
            total: response.pagination.total,
          }
        : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return {
      ...(response as Paginated<RentalVehicle>),
      data: response.data.map((v) =>
        mapRentalVehicle(v as unknown as Record<string, unknown>)
      ),
    };
  }
  return response as Paginated<RentalVehicle>;
}

export const partnerRentalFleetService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<RentalVehicleApiResponse>(
      `${LINKS.partner.rental.vehicles.list(partnerId)}${buildListQuery(params)}`
    );
    return mapResponse(response);
  },

  getById: async (partnerId: string | number, vehicleId: string) => {
    try {
      const raw = await apiClient.get<RentalVehicle>(
        LINKS.partner.rental.vehicles.detail(partnerId, vehicleId)
      );
      if (raw && (raw as Partial<RentalVehicle>).id) {
        return mapRentalVehicle(raw as unknown as Record<string, unknown>);
      }
    } catch {
      // endpoint détail absent → fallback liste
    }
    const list = await partnerRentalFleetService.list(partnerId, { per_page: 200 });
    return list.data.find((v) => v.id === vehicleId) ?? null;
  },

  create: (partnerId: string | number, data: CreateRentalVehiclePayload) =>
    apiClient.post<RentalVehicle>(
      LINKS.partner.rental.vehicles.create(partnerId),
      data
    ),

  update: (
    partnerId: string | number,
    vehicleId: string,
    data: UpdateRentalVehiclePayload
  ) =>
    apiClient.patch<RentalVehicle>(
      LINKS.partner.rental.vehicles.update(partnerId, vehicleId),
      data
    ),

  setStatus: (
    partnerId: string | number,
    vehicleId: string,
    status: RentalVehicleStatus
  ) =>
    apiClient.patch<RentalVehicle>(
      LINKS.partner.rental.vehicles.status(partnerId, vehicleId),
      { status }
    ),

  delete: (partnerId: string | number, vehicleId: string) =>
    apiClient.delete<void>(
      LINKS.partner.rental.vehicles.delete(partnerId, vehicleId)
    ),
};

// ——— Helpers d'affichage partagés ———

export const RENTAL_VEHICLE_CATEGORY_LABELS: Record<RentalVehicleCategory, string> = {
  voiture: "Voiture",
  suv: "SUV",
  utilitaire: "Utilitaire",
  bus: "Bus",
  moto: "Moto",
  engin: "Engin",
};

export const RENTAL_VEHICLE_STATUS_CONFIG: Record<
  RentalVehicleStatus,
  { label: string; color: string }
> = {
  disponible: { label: "Disponible", color: "bg-green-100 text-green-700" },
  reserve: { label: "Réservé", color: "bg-blue-100 text-blue-700" },
  en_cours: { label: "En cours", color: "bg-teal-100 text-teal-700" },
  maintenance: { label: "Maintenance", color: "bg-amber-100 text-amber-700" },
  indisponible: { label: "Indisponible", color: "bg-gray-100 text-gray-600" },
};

export const RENTAL_VEHICLE_OPTION_LABELS: Record<RentalVehicleOption, string> = {
  chauffeur: "Avec chauffeur",
  livraison: "Livraison",
  accessoires: "Accessoires",
};

export const RENTAL_VEHICLE_DOC_LABELS: Record<RentalVehicleDocType, string> = {
  assurance: "Assurance",
  carte_grise: "Carte grise",
  visite_technique: "Visite technique",
};
