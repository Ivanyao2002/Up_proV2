"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalAvailabilityService,
  type CreateRentalBlockPayload,
} from "./rentalAvailability.service";

export const partnerRentalAvailabilityKeys = {
  all: ["partner", "rental-availability"] as const,
  detail: (vehicleId: string) =>
    [...partnerRentalAvailabilityKeys.all, vehicleId] as const,
};

export function usePartnerRentalAvailability(vehicleId: string | undefined) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalAvailabilityKeys.detail(vehicleId ?? ""),
    queryFn: () => partnerRentalAvailabilityService.get(ownerId!, vehicleId!),
    enabled: ownerId != null && !!vehicleId,
  });
}

export function useAddRentalBlock() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({
      vehicleId,
      data,
    }: {
      vehicleId: string;
      data: CreateRentalBlockPayload;
    }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalAvailabilityService.addBlock(ownerId, vehicleId, data);
    },
    onSuccess: (_res, { vehicleId }) => {
      void qc.invalidateQueries({
        queryKey: partnerRentalAvailabilityKeys.detail(vehicleId),
      });
    },
  });
}

export function useRemoveRentalBlock() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({ vehicleId, blockId }: { vehicleId: string; blockId: string }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalAvailabilityService.removeBlock(ownerId, vehicleId, blockId);
    },
    onSuccess: (_res, { vehicleId }) => {
      void qc.invalidateQueries({
        queryKey: partnerRentalAvailabilityKeys.detail(vehicleId),
      });
    },
  });
}
