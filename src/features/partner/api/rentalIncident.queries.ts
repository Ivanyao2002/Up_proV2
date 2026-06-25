"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalIncidentService,
  type CreateRentalIncidentPayload,
} from "./rentalIncident.service";
import { partnerRentalKeys } from "./rental.queries";

export function useCreateRentalIncident() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string;
      data: CreateRentalIncidentPayload;
    }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalIncidentService.create(ownerId, offerId, data);
    },
    onSuccess: (_res, { offerId }) => {
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.detail(offerId) });
      void qc.invalidateQueries({ queryKey: partnerRentalKeys.all });
    },
  });
}
