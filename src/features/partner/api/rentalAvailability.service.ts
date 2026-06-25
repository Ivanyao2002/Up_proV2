import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";

/**
 * Disponibilités & calendrier d'un véhicule de location (DB-RENT-12).
 * Le serveur reste seul juge des chevauchements (refus d'une réservation
 * sur une période bloquée/réservée).
 */

export type RentalBlockReason = "maintenance" | "indisponibilite";

export interface RentalBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason: RentalBlockReason;
  note?: string;
}

export interface RentalReservedPeriod {
  ref?: string;
  start_date: string;
  end_date: string;
}

export interface RentalAvailability {
  blocks: RentalBlock[];
  reservations: RentalReservedPeriod[];
}

export interface CreateRentalBlockPayload {
  start_date: string;
  end_date: string;
  reason: RentalBlockReason;
  note?: string;
}

const EMPTY: RentalAvailability = { blocks: [], reservations: [] };

export const partnerRentalAvailabilityService = {
  get: async (partnerId: string | number, vehicleId: string) => {
    try {
      const raw = await apiClient.get<Partial<RentalAvailability>>(
        LINKS.partner.rental.vehicles.availability(partnerId, vehicleId)
      );
      return {
        blocks: raw?.blocks ?? [],
        reservations: raw?.reservations ?? [],
      } satisfies RentalAvailability;
    } catch {
      return EMPTY;
    }
  },

  addBlock: (
    partnerId: string | number,
    vehicleId: string,
    data: CreateRentalBlockPayload
  ) =>
    apiClient.post<RentalBlock>(
      LINKS.partner.rental.vehicles.blocks(partnerId, vehicleId),
      data
    ),

  removeBlock: (
    partnerId: string | number,
    vehicleId: string,
    blockId: string
  ) =>
    apiClient.delete<void>(
      `${LINKS.partner.rental.vehicles.blocks(partnerId, vehicleId)}/${blockId}`
    ),
};

export const RENTAL_BLOCK_REASON_LABELS: Record<RentalBlockReason, string> = {
  maintenance: "Maintenance",
  indisponibilite: "Indisponibilité",
};
