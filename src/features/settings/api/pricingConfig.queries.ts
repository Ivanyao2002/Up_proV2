"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type {
  PricingCountryCode,
  PricingCountryLayer,
} from "./pricingConfig.api.types";
import { pricingConfigKeys } from "./pricingConfig.keys";
import {
  isLegacyPricingConfig,
  pricingConfigService,
} from "./pricingConfig.service";

export function usePricingConfig(countryCode: PricingCountryCode = "CI") {
  return useQuery({
    queryKey: pricingConfigKeys.detail(countryCode),
    queryFn: () => pricingConfigService.get(countryCode),
    enabled: !isLegacyPricingConfig(),
  });
}

export function usePatchPricingCountry(countryCode: PricingCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (layer: Partial<PricingCountryLayer>) =>
      pricingConfigService.patchCountry(countryCode, layer),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pricingConfigKeys.detail(countryCode) });
      notificationService.success(
        `Calibration tarifaire (${countryCode}) enregistrée — propagation ≤ 60 s`
      );
    },
    onError: () =>
      notificationService.error("Enregistrement calibration tarifaire impossible"),
  });
}

export function useResetPricingCountry(countryCode: PricingCountryCode) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => pricingConfigService.resetCountryFromSeed(countryCode),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pricingConfigKeys.detail(countryCode) });
      notificationService.success(`Pays ${countryCode} réinitialisé depuis le gabarit`);
    },
    onError: () =>
      notificationService.error("Réinitialisation calibration impossible"),
  });
}
