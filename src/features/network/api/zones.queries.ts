"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { useAuthStore } from "@/core/auth/authStore";
import { zonesKeys } from "./zones.keys";
import { zonesService, type ZoneCreatePayload } from "./zones.service";
import type { ListParams } from "@/shared/types/listParams";

export function useZonesList(params?: ListParams) {
  return useQuery({
    queryKey: zonesKeys.list(params),
    queryFn: () => zonesService.listAdmin(params),
  });
}

export function useZonesMapOverview() {
  return useQuery({
    queryKey: [...zonesKeys.all, "map-overview"] as const,
    queryFn: () => zonesService.mapOverview(),
  });
}

export function useZonesByFranchise(franchiseId: string, enabled = true) {
  return useQuery({
    queryKey: [...zonesKeys.all, "franchise", franchiseId] as const,
    queryFn: () => zonesService.listByFranchise(franchiseId),
    enabled: Boolean(franchiseId) && enabled,
  });
}

export function useZonesByFranchiseCtx() {
  const franchiseId = String(useAuthStore((s) => s.user?.franchise_id ?? ""));
  return useZonesByFranchise(franchiseId, Boolean(franchiseId));
}

export function useZonesMapOverviewByFranchise() {
  const franchiseId = String(useAuthStore((s) => s.user?.franchise_id ?? ""));
  return useQuery({
    queryKey: [...zonesKeys.all, "map-overview-franchise", franchiseId] as const,
    queryFn: () => zonesService.franchiseMapOverview(franchiseId),
    enabled: Boolean(franchiseId),
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ZoneCreatePayload) => zonesService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: zonesKeys.all });
      notificationService.success("Zone créée");
    },
    onError: () => notificationService.error("Création impossible"),
  });
}
