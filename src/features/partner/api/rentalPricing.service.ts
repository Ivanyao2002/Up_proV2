import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";

/**
 * Tarification & conditions d'un véhicule de location (DB-RENT-11).
 * Le calcul du prix d'une réservation reste **côté serveur** (offre §4.2) ;
 * ce barème n'est que la configuration de référence saisie par le loueur.
 */

export type RentalFuelPolicy = "full_to_full" | "other";

export interface RentalSeasonRule {
  label: string;
  start_date: string;
  end_date: string;
  /** Modificateur de prix en % (ex. +20 en haute saison, -10 en basse). */
  modifier_percent: number;
}

export interface RentalPenalties {
  late_per_hour_fcfa?: number;
  late_per_day_fcfa?: number;
  cancellation_fcfa?: number;
  damage_note?: string;
}

export interface RentalOptionFees {
  chauffeur_fcfa?: number;
  livraison_fcfa?: number;
  accessoires_fcfa?: number;
}

export interface RentalPromo {
  code?: string;
  percent?: number;
}

export interface RentalPricing {
  vehicle_id: string;
  price_day_fcfa: number;
  price_week_fcfa?: number;
  price_month_fcfa?: number;
  deposit_fcfa: number;
  /** Kilométrage inclus par jour. `null`/undefined = illimité. */
  km_included?: number | null;
  km_extra_fcfa?: number;
  fuel_policy: RentalFuelPolicy;
  insurance_included: boolean;
  insurance_franchise_fcfa?: number;
  penalties?: RentalPenalties;
  option_fees?: RentalOptionFees;
  restrictions?: string;
  promo?: RentalPromo;
  seasons?: RentalSeasonRule[];
}

export type SaveRentalPricingPayload = Omit<RentalPricing, "vehicle_id">;

export const partnerRentalPricingService = {
  get: async (partnerId: string | number, vehicleId: string) => {
    try {
      const raw = await apiClient.get<RentalPricing>(
        LINKS.partner.rental.vehicles.pricing(partnerId, vehicleId)
      );
      return raw ?? null;
    } catch {
      // Barème non encore défini / endpoint absent.
      return null;
    }
  },

  save: (
    partnerId: string | number,
    vehicleId: string,
    data: SaveRentalPricingPayload
  ) =>
    apiClient.put<RentalPricing>(
      LINKS.partner.rental.vehicles.pricing(partnerId, vehicleId),
      data
    ),
};

export const RENTAL_FUEL_POLICY_LABELS: Record<RentalFuelPolicy, string> = {
  full_to_full: "Plein / plein",
  other: "Autre règle",
};
