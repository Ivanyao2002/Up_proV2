import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";

/**
 * Incidents & litiges liés à une réservation de location (DB-RENT-18).
 * La création ouvre automatiquement un ticket côté serveur (cahier §3.7).
 */

export type RentalIncidentType =
  | "panne"
  | "accident"
  | "dommage"
  | "non_retour"
  | "retard";

export interface CreateRentalIncidentPayload {
  type: RentalIncidentType;
  description: string;
  attachments?: string[];
}

export interface RentalIncidentResult {
  status?: string;
  ticket_id?: string;
}

export const partnerRentalIncidentService = {
  create: (
    partnerId: string | number,
    offerId: string,
    data: CreateRentalIncidentPayload
  ) =>
    apiClient.post<RentalIncidentResult>(
      LINKS.partner.rental.incidents(partnerId, offerId),
      data
    ),
};

export const RENTAL_INCIDENT_TYPE_LABELS: Record<RentalIncidentType, string> = {
  panne: "Panne",
  accident: "Accident",
  dommage: "Dommage",
  non_retour: "Non-retour",
  retard: "Retard",
};
