"use client";

import { useQuery } from "@tanstack/react-query";
import { zonesKeys } from "./zones.keys";
import { zoneDetailService } from "./zoneDetail.service";

export function useZoneDetail(id: string) {
  return useQuery({
    queryKey: [...zonesKeys.all, "detail", id],
    queryFn: () => zoneDetailService.getById(id),
    enabled: Boolean(id),
  });
}
