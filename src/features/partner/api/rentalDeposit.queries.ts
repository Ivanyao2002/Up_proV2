"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalDepositService,
  type RentalDepositWithholdPayload,
} from "./rentalDeposit.service";
import { partnerRentalKeys } from "./rental.queries";

function useInvalidateOffer() {
  const qc = useQueryClient();
  return (offerId: string) => {
    void qc.invalidateQueries({ queryKey: partnerRentalKeys.detail(offerId) });
    void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
  };
}

export function useReleaseDeposit() {
  const { ownerId } = useScope();
  const invalidate = useInvalidateOffer();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalDepositService.release(ownerId, offerId);
    },
    onSuccess: (_res, { offerId }) => invalidate(offerId),
  });
}

export function useWithholdDeposit() {
  const { ownerId } = useScope();
  const invalidate = useInvalidateOffer();
  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string;
      data: RentalDepositWithholdPayload;
    }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalDepositService.withhold(ownerId, offerId, data);
    },
    onSuccess: (_res, { offerId }) => invalidate(offerId),
  });
}
