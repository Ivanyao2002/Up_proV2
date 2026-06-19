"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { PricingCountryCode } from "./pricingConfig.api.types";
import type { CreateHolidayPayload, PatchHolidayPayload } from "./holidays.api.types";
import { holidaysKeys } from "./holidays.keys";
import { holidaysService } from "./holidays.service";

export function useHolidays(countryCode: PricingCountryCode) {
  return useQuery({
    queryKey: holidaysKeys.list(countryCode),
    queryFn: () => holidaysService.list(countryCode),
  });
}

export function useCreateHoliday(countryCode: PricingCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHolidayPayload) => holidaysService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidaysKeys.list(countryCode) });
      notificationService.success("Jour férié ajouté");
    },
    onError: () => notificationService.error("Impossible d'ajouter le jour férié"),
  });
}

export function usePatchHoliday(countryCode: PricingCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchHolidayPayload }) =>
      holidaysService.patch(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidaysKeys.list(countryCode) });
      notificationService.success("Jour férié mis à jour");
    },
    onError: () => notificationService.error("Mise à jour du jour férié impossible"),
  });
}

export function useDeactivateHoliday(countryCode: PricingCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysService.deactivate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidaysKeys.list(countryCode) });
      notificationService.success("Jour férié désactivé");
    },
    onError: () => notificationService.error("Désactivation impossible"),
  });
}
