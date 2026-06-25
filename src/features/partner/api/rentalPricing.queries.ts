"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalPricingService,
  type SaveRentalPricingPayload,
} from "./rentalPricing.service";
import { partnerRentalFleetKeys } from "./rentalFleet.queries";

export const partnerRentalPricingKeys = {
  all: ["partner", "rental-pricing"] as const,
  detail: (vehicleId: string) =>
    [...partnerRentalPricingKeys.all, vehicleId] as const,
};

export function usePartnerRentalPricing(vehicleId: string | undefined) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalPricingKeys.detail(vehicleId ?? ""),
    queryFn: () => partnerRentalPricingService.get(ownerId!, vehicleId!),
    enabled: ownerId != null && !!vehicleId,
  });
}

export function useSaveRentalPricing() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({
      vehicleId,
      data,
    }: {
      vehicleId: string;
      data: SaveRentalPricingPayload;
    }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalPricingService.save(ownerId, vehicleId, data);
    },
    onSuccess: (_res, { vehicleId }) => {
      void qc.invalidateQueries({ queryKey: partnerRentalPricingKeys.detail(vehicleId) });
      // has_pricing peut changer → rafraîchir la flotte.
      void qc.invalidateQueries({ queryKey: partnerRentalFleetKeys.all });
    },
  });
}
