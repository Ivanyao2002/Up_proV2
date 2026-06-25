import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { RentalOffer } from "./rental.service";

/**
 * Caution : restitution / retenue (DB-RENT-15).
 * La restitution automatique (check-out validé + absence de litige) est gérée
 * côté serveur ; ces actions sont les décisions manuelles du loueur.
 */

export interface RentalDepositWithholdPayload {
  amount_fcfa: number;
  /** Motif obligatoire (cahier §2.9). */
  reason: string;
  /** Références/noms des preuves (photos, rapport). */
  proofs?: string[];
}

export const partnerRentalDepositService = {
  release: (partnerId: string | number, offerId: string) =>
    apiClient.post<RentalOffer>(
      LINKS.partner.rental.deposit.release(partnerId, offerId)
    ),

  withhold: (
    partnerId: string | number,
    offerId: string,
    data: RentalDepositWithholdPayload
  ) =>
    apiClient.post<RentalOffer>(
      LINKS.partner.rental.deposit.withhold(partnerId, offerId),
      data
    ),
};
