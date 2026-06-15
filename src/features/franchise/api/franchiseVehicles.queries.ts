"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchiseVehiclesService } from "./franchiseVehicles.service";
import type { FranchiseVehicleFilters } from "./franchiseVehicles.service";

export type { FranchiseVehicleFilters };

export const franchiseVehiclesKeys = {
  all: ["franchise", "fleet", "vehicles"] as const,
  list: (filters?: FranchiseVehicleFilters) =>
    [...franchiseVehiclesKeys.all, "list", filters] as const,
  detail: (id: string | number) =>
    [...franchiseVehiclesKeys.all, "detail", id] as const,
};

export function useFranchiseVehiclesList(filters?: FranchiseVehicleFilters) {
  return useQuery({
    queryKey: franchiseVehiclesKeys.list(filters),
    queryFn: () => franchiseVehiclesService.list(filters),
  });
}

export function useFranchiseVehicleDetail(id: string | number) {
  return useQuery({
    queryKey: franchiseVehiclesKeys.detail(id),
    queryFn: () => franchiseVehiclesService.getById(id),
    enabled: Boolean(id),
  });
}

export function useFranchiseVehicleApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string | number; notes?: string }) =>
      franchiseVehiclesService.approve(id, notes),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: franchiseVehiclesKeys.all });
      void qc.invalidateQueries({
        queryKey: franchiseVehiclesKeys.detail(variables.id),
      });
      notificationService.success("Véhicule approuvé");
    },
    onError: () => notificationService.error("Impossible d'approuver le véhicule"),
  });
}

export function useFranchiseVehicleReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason?: string }) =>
      franchiseVehiclesService.reject(id, reason),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: franchiseVehiclesKeys.all });
      void qc.invalidateQueries({
        queryKey: franchiseVehiclesKeys.detail(variables.id),
      });
      notificationService.success("Véhicule rejeté");
    },
    onError: () => notificationService.error("Impossible de rejeter le véhicule"),
  });
}
