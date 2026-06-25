"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalInspectionService,
  type RentalCheckInPayload,
  type RentalCheckOutPayload,
} from "./rentalInspection.service";
import { partnerRentalKeys } from "./rental.queries";

export const partnerRentalDocumentsKeys = {
  all: ["partner", "rental-documents"] as const,
  detail: (offerId: string) => [...partnerRentalDocumentsKeys.all, offerId] as const,
};

function useInvalidateOffer() {
  const qc = useQueryClient();
  return (offerId: string) => {
    void qc.invalidateQueries({ queryKey: partnerRentalKeys.detail(offerId) });
    void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    void qc.invalidateQueries({ queryKey: partnerRentalDocumentsKeys.detail(offerId) });
  };
}

export function useRentalCheckIn() {
  const { ownerId } = useScope();
  const invalidate = useInvalidateOffer();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: RentalCheckInPayload }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalInspectionService.checkIn(ownerId, offerId, data);
    },
    onSuccess: (_res, { offerId }) => invalidate(offerId),
  });
}

export function useRentalCheckOut() {
  const { ownerId } = useScope();
  const invalidate = useInvalidateOffer();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: RentalCheckOutPayload }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalInspectionService.checkOut(ownerId, offerId, data);
    },
    onSuccess: (_res, { offerId }) => invalidate(offerId),
  });
}

export function useRentalClose() {
  const { ownerId } = useScope();
  const invalidate = useInvalidateOffer();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalInspectionService.close(ownerId, offerId);
    },
    onSuccess: (_res, { offerId }) => invalidate(offerId),
  });
}

export function usePartnerRentalDocuments(offerId: string | undefined) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalDocumentsKeys.detail(offerId ?? ""),
    queryFn: () => partnerRentalInspectionService.documents(ownerId!, offerId!),
    enabled: ownerId != null && !!offerId,
  });
}
