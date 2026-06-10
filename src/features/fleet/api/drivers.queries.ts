"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import type { Driver } from "@/shared/types";
import {
  runBulkActivateDrivers,
  runBulkDriverAvailability,
  runBulkSuspendDrivers,
  type DriverAvailabilityAction,
} from "./driverAdminActions.service";
import { driversKeys } from "./drivers.keys";
import { driversService, type DriversListParams } from "./drivers.service";

export function useDriversList(params?: DriversListParams) {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: driversKeys.list(params, scopeKey),
    queryFn: () => driversService.listAdmin(params),
  });
}

export function useBulkDriverAvailability() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();

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
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      if (result.count === 0) {
        notificationService.warning(
          "Aucun chauffeur éligible (compte approuvé requis)."
        );
        return;
      }
      notificationService.success(result.message);
    },
  });
}

export function useBulkSuspendDrivers() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();

  return useMutation({
    mutationFn: ({
      drivers,
      ids,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
    }) => runBulkSuspendDrivers(drivers, ids),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      if (result.count === 0) {
        notificationService.warning(
          "Aucun chauffeur approuvé à suspendre dans la sélection."
        );
        return;
      }
      notificationService.success(result.message);
    },
  });
}

export function useBulkActivateDrivers() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();

  return useMutation({
    mutationFn: ({
      drivers,
      ids,
    }: {
      drivers: Driver[];
      ids: Array<string | number>;
    }) => runBulkActivateDrivers(drivers, ids),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: driversKeys.all(scopeKey) });
      if (result.count === 0) {
        notificationService.warning(
          "Aucun chauffeur suspendu à réactiver dans la sélection."
        );
        return;
      }
      notificationService.success(result.message);
    },
  });
}
