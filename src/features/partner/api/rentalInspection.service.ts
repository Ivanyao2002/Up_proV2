import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { RentalOffer, RentalExtras } from "./rental.service";

/**
 * États des lieux renforcés (DB-RENT-13) + clôture/facture (DB-RENT-14).
 * Les photos sont obligatoires au check-in et au check-out (cahier §3.6).
 * Le calcul des extras (retard, dépassement km, dommages) est fait
 * **côté serveur** et renvoyé par le check-out.
 */

export interface RentalCheckInPayload {
  km_start: number;
  /** Niveau carburant en % (0-100). */
  fuel_start: number;
  accessories?: string[];
  comment?: string;
  signature?: boolean;
  /** Références/noms des photos d'état de départ (obligatoires). */
  photos: string[];
}

export interface RentalCheckOutPayload {
  km_end: number;
  fuel_end: number;
  damages?: string[];
  comment?: string;
  photos: string[];
}

export interface RentalCheckOutResult {
  extras: RentalExtras;
  offer?: RentalOffer;
}

export type RentalDocumentKind = "contract" | "receipt" | "invoice" | "pod";

export interface RentalDocument {
  kind: RentalDocumentKind;
  label: string;
  url?: string;
  created_at?: string;
}

export const partnerRentalInspectionService = {
  checkIn: (
    partnerId: string | number,
    offerId: string,
    data: RentalCheckInPayload
  ) =>
    apiClient.post<RentalOffer>(
      LINKS.partner.rental.checkIn(partnerId, offerId),
      data
    ),

  checkOut: (
    partnerId: string | number,
    offerId: string,
    data: RentalCheckOutPayload
  ) =>
    apiClient.post<RentalCheckOutResult>(
      LINKS.partner.rental.checkOut(partnerId, offerId),
      data
    ),

  close: (partnerId: string | number, offerId: string) =>
    apiClient.post<RentalOffer>(LINKS.partner.rental.close(partnerId, offerId)),

  documents: async (partnerId: string | number, offerId: string) => {
    try {
      const raw = await apiClient.get<{ documents?: RentalDocument[] } | RentalDocument[]>(
        LINKS.partner.rental.documents(partnerId, offerId)
      );
      if (Array.isArray(raw)) return raw;
      return raw?.documents ?? [];
    } catch {
      return [] as RentalDocument[];
    }
  },
};

export const RENTAL_DOCUMENT_LABELS: Record<RentalDocumentKind, string> = {
  contract: "Contrat de location",
  receipt: "Reçu",
  invoice: "Facture finale",
  pod: "État des lieux",
};
