"use client";

import { useQuery } from "@tanstack/react-query";
import { liveMapKeys } from "./liveMap.keys";
import { liveMapService } from "./liveMap.service";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";

export function useLiveMap(filters?: LiveMapScopeFiltersValue) {
  return useQuery({
    queryKey: liveMapKeys.admin(filters),
    queryFn: () => liveMapService.getAdmin(filters),
    refetchInterval: 30_000,
  });
}
