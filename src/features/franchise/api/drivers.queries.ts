"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { Driver } from "@/shared/types";
import { franchiseDashboardKeys } from "./dashboard.queries";
import { franchiseDriversService } from "./drivers.service";
import type { ListParams } from "@/shared/types/listParams";
import {
  runBulkActivateDrivers,
  runBulkDriverAvailability,
  runBulkSuspendDrivers,
  type DriverAvailabilityAction,
} from "./driverFranchiseActions.service";

export const franchiseDriversKeys = {
  all: ["franchise", "drivers"] as const,
  list: (filters?: ListParams) => [...franchiseDriversKeys.all, "list", filters] as const,
  kycQueue: (filters?: ListParams) =>
    [...franchiseDriversKeys.all, "kyc-queue", filters] as const,
  detail: (id: string) => [...franchiseDriversKeys.all, "detail", id] as const,
};

export function useFranchiseDriversList(params?: ListParams) {
  return useQuery({
    queryKey: franchiseDriversKeys.list(params),
    queryFn: () => franchiseDriversService.list(params),
  });
}

export function useFranchiseKycQueue(params?: ListParams) {
  return useQuery({
    queryKey: franchiseDriversKeys.kycQueue(params),
    queryFn: () => franchiseDriversService.kycQueue(params),
  });
}

export function useFranchiseDriverDetail(id: string) {
  return useQuery({
    queryKey: franchiseDriversKeys.detail(id),
    queryFn: () => franchiseDriversService.getById(id),
    enabled: Boolean(id),
  });
}

function invalidateFranchiseDriverQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
  void qc.invalidateQueries({ queryKey: franchiseDashboardKeys.all });
}

export function useApproveFranchiseDriverKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => franchiseDriversService.approveKyc(driverId),
    onSuccess: (data) => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success(data.message);
    },
    onError: () => notificationService.error("Approbation impossible"),
  });
}

export function useRejectFranchiseDriverKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, reason }: { driverId: string; reason: string }) =>
      franchiseDriversService.rejectKyc(driverId, reason),
    onSuccess: (data) => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success(data.message);
    },
    onError: () => notificationService.error("Rejet impossible"),
  });
}

export function useApproveFranchiseDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      franchiseDriversService.approveDocument(driverId, docId),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Document validé");
    },
  });
}

export function useRejectFranchiseDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: string; reason: string }) =>
      franchiseDriversService.rejectDocument(driverId, docId, reason),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.warning("Document rejeté");
    },
  });
}

export function useCreateFranchiseDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof franchiseDriversService.create>[0]) =>
      franchiseDriversService.create(payload),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Chauffeur créé");
    },
    onError: () => notificationService.error("Création impossible"),
  });
}

export function useSuspendFranchiseDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      franchiseDriversService.suspend(id, reason),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Chauffeur suspendu");
    },
    onError: () => notificationService.error("Suspension impossible"),
  });
}

export function useUnsuspendFranchiseDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchiseDriversService.unsuspend(id),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Chauffeur réactivé");
    },
    onError: () => notificationService.error("Réactivation impossible"),
  });
}

export function useUpdateFranchiseDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof franchiseDriversService.update>[1] }) =>
      franchiseDriversService.update(id, payload),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Chauffeur mis à jour");
    },
    onError: () => notificationService.error("Mise à jour impossible"),
  });
}

export function useDeleteFranchiseDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => franchiseDriversService.delete(id),
    onSuccess: () => {
      invalidateFranchiseDriverQueries(qc);
      notificationService.success("Chauffeur supprimé");
    },
    onError: () => notificationService.error("Suppression impossible"),
  });
}

export function useBulkDriverAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      drivers,
      ids,
      availability,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
      availability: DriverAvailabilityAction;
    }) => runBulkDriverAvailability(drivers, ids, availability),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
      if (result.count === 0) {
        notificationService.warning("Aucun chauffeur éligible (compte approuvé requis).");
        return;
      }
      notificationService.success(result.message);
    },
  });
}

export function useBulkSuspendDrivers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      drivers,
      ids,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
    }) => runBulkSuspendDrivers(drivers, ids),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
      if (result.count === 0) {
        notificationService.warning("Aucun chauffeur éligible (compte approuvé requis).");
        return;
      }
      notificationService.success(result.message);
    },
  });
}

export function useBulkActivateDrivers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      drivers,
      ids,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
    }) => runBulkActivateDrivers(drivers, ids),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: franchiseDriversKeys.all });
      if (result.count === 0) {
        notificationService.warning("Aucun chauffeur suspendu sélectionné.");
        return;
      }
      notificationService.success(result.message);
    },
  });
}
