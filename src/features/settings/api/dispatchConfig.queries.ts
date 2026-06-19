"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { DispatchCountryCode, DispatchCountryPatch } from "./dispatchConfig.api.types";
import { dispatchConfigKeys } from "./dispatchConfig.keys";
import { dispatchConfigService } from "./dispatchConfig.service";

export function useDispatchConfig(countryCode: DispatchCountryCode = "CI") {
  return useQuery({
    queryKey: dispatchConfigKeys.detail(countryCode),
    queryFn: () => dispatchConfigService.get(countryCode),
  });
}

export function useDispatchCapacity(countryCode: DispatchCountryCode = "CI") {
  return useQuery({
    queryKey: dispatchConfigKeys.capacity(countryCode),
    queryFn: () => dispatchConfigService.getCapacity(countryCode),
  });
}

export function usePatchDispatchCountry(countryCode: DispatchCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: DispatchCountryPatch) =>
      dispatchConfigService.patchCountry(countryCode, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchConfigKeys.detail(countryCode) });
      notificationService.success(
        `Calibration dispatch (${countryCode}) enregistrée — propagation ≤ 60 s`
      );
    },
    onError: () =>
      notificationService.error("Enregistrement calibration dispatch impossible"),
  });
}

export function useResetDispatchCountry(countryCode: DispatchCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dispatchConfigService.resetCountryFromSeed(countryCode),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchConfigKeys.detail(countryCode) });
      notificationService.success(`Dispatch ${countryCode} réinitialisé`);
    },
    onError: () => notificationService.error("Réinitialisation dispatch impossible"),
  });
}
