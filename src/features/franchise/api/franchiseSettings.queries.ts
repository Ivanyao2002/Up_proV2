"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { WeatherConfigDocument } from "@/features/settings/api/adminPlatformConfig.api.types";
import type { GeneralSettings } from "@/features/settings/api/settingsExtended.service";
import { franchiseSettingsService } from "./franchiseSettings.service";

export const franchiseSettingsKeys = {
  all: ["franchise", "settings"] as const,
  weather: () => [...franchiseSettingsKeys.all, "weather"] as const,
  general: () => [...franchiseSettingsKeys.all, "general"] as const,
};

// Weather / Météo
export function useFranchiseWeatherConfig() {
  return useQuery({
    queryKey: franchiseSettingsKeys.weather(),
    queryFn: () => franchiseSettingsService.getWeather(),
  });
}

export function useUpdateFranchiseWeatherConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (document: WeatherConfigDocument) =>
      franchiseSettingsService.updateWeather(document),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseSettingsKeys.weather() });
      notificationService.success("Configuration météo enregistrée");
    },
    onError: () => notificationService.error("Enregistrement météo impossible"),
  });
}

export function useRefreshFranchiseWeather() {
  return useMutation({
    mutationFn: () => franchiseSettingsService.refreshWeather(),
    onSuccess: (data) => {
      notificationService.success(
        data.queued
          ? `Refresh météo planifié (${data.jobId ?? "job"})`
          : "Refresh météo lancé"
      );
    },
    onError: () => notificationService.error("Refresh météo impossible"),
  });
}

// General / Paramètres généraux
export function useFranchiseGeneralSettings() {
  return useQuery({
    queryKey: franchiseSettingsKeys.general(),
    queryFn: () => franchiseSettingsService.getGeneral(),
  });
}

export function useUpdateFranchiseGeneralSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (document: GeneralSettings) =>
      franchiseSettingsService.updateGeneral(document),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseSettingsKeys.general() });
      notificationService.success("Paramètres généraux enregistrés");
    },
    onError: () => notificationService.error("Enregistrement impossible"),
  });
}
