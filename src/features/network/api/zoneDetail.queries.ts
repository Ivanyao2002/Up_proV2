"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { ZoneDetail } from "@/shared/types";
import { zonesKeys } from "./zones.keys";
import { zoneDetailService } from "./zoneDetail.service";

export function useZoneDetail(id: string) {
  return useQuery({
    queryKey: [...zonesKeys.all, "detail", id],
    queryFn: () => zoneDetailService.getById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateZonePolygon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ring: number[][]) => {
      const closedRing = [...ring, ring[0]];
      const polygon: NonNullable<ZoneDetail["polygon_geojson"]> = {
        type: "Polygon",
        coordinates: [closedRing],
      };
      return zoneDetailService.updatePolygon(id, polygon);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...zonesKeys.all, "detail", id] });
      void qc.invalidateQueries({ queryKey: [...zonesKeys.all, "map-overview"] });
      notificationService.success("Polygone mis à jour");
    },
  });
}
