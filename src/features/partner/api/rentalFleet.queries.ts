"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRentalFleetService,
  type CreateRentalVehiclePayload,
  type UpdateRentalVehiclePayload,
  type RentalVehicleStatus,
} from "./rentalFleet.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerRentalFleetKeys = {
  all: ["partner", "rental-fleet"] as const,
  list: (filters?: ListParams) =>
    [...partnerRentalFleetKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerRentalFleetKeys.all, "detail", id] as const,
};

export function usePartnerRentalVehicles(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalFleetKeys.list(params),
    queryFn: () => partnerRentalFleetService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerRentalVehicleDetail(vehicleId: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalFleetKeys.detail(vehicleId),
    queryFn: () => partnerRentalFleetService.getById(ownerId!, vehicleId),
    enabled: ownerId != null && !!vehicleId,
  });
}

export function useCreateRentalVehicle() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreateRentalVehiclePayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalFleetService.create(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalFleetKeys.all });
    },
  });
}

export function useUpdateRentalVehicle() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRentalVehiclePayload }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalFleetService.update(ownerId, id, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalFleetKeys.all });
    },
  });
}

export function useSetRentalVehicleStatus() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RentalVehicleStatus }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalFleetService.setStatus(ownerId, id, status);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalFleetKeys.all });
    },
  });
}

export function useDeleteRentalVehicle() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (vehicleId: string) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerRentalFleetService.delete(ownerId, vehicleId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerRentalFleetKeys.all });
    },
  });
}
