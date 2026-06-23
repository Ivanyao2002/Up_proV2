"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { driverDetailKeys } from "./driverDetail.keys";
import {
  driverBonusSettingsService,
  type DriverBonusSettings,
} from "./driverBonusSettings.service";
import type { BonusWeekStartDow } from "../lib/bonusWeekStart.labels";

export const driverBonusSettingsKeys = {
  all: ["fleet", "driver-bonus-settings"] as const,
  detail: (driverId: string) =>
    [...driverBonusSettingsKeys.all, driverId] as const,
};

export function useDriverBonusSettings(driverId: string) {
  return useQuery({
    queryKey: driverBonusSettingsKeys.detail(driverId),
    queryFn: () => driverBonusSettingsService.get(driverId),
    enabled: Boolean(driverId),
  });
}

export function useUpdateDriverBonusSettings(driverId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (weekStartDow: BonusWeekStartDow) =>
      driverBonusSettingsService.update(driverId, weekStartDow),
    onSuccess: (data: DriverBonusSettings) => {
      qc.setQueryData(driverBonusSettingsKeys.detail(driverId), data);
      void qc.invalidateQueries({ queryKey: driverDetailKeys.detail(driverId) });
      notificationService.success("Jour de début de semaine bonus enregistré");
    },
    onError: (error: Error) => {
      notificationService.error(
        error.message || "Impossible d'enregistrer le paramètre bonus"
      );
    },
  });
}
