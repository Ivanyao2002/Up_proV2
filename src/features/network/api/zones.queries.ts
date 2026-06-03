"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { zonesKeys } from "./zones.keys";
import { zonesService, type ZoneCreatePayload } from "./zones.service";

export function useZonesList() {
  return useQuery({
    queryKey: zonesKeys.list(),
    queryFn: () => zonesService.listAdmin(),
  });
}

export function useZonesMapOverview() {
  return useQuery({
    queryKey: [...zonesKeys.all, "map-overview"] as const,
    queryFn: () => zonesService.mapOverview(),
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
