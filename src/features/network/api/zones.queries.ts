"use client";

import { useQuery } from "@tanstack/react-query";
import { zonesKeys } from "./zones.keys";
import { zonesService } from "./zones.service";

export function useZonesList() {
  return useQuery({
    queryKey: zonesKeys.list(),
    queryFn: () => zonesService.listAdmin(),
  });
}
