"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  settingsExtendedService,
  type GeneralSettings,
} from "./settingsExtended.service";

export function useIntegrationsList() {
  return useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: () => settingsExtendedService.integrations(),
  });
}

export function useToggleIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, connected }: { id: string; connected: boolean }) =>
      settingsExtendedService.toggleIntegration(id, connected),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings", "integrations"] });
      notificationService.success("Intégration mise à jour");
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["settings", "audit"],
    queryFn: () => settingsExtendedService.auditLog(),
  });
}

export function useGeneralSettings() {
  return useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => settingsExtendedService.general(),
  });
}

export function useUpdateGeneralSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<GeneralSettings>) =>
      settingsExtendedService.updateGeneral(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings", "general"] });
      notificationService.success("Paramètres enregistrés");
    },
  });
}
