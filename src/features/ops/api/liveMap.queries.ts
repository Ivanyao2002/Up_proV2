"use client";

import { useQuery } from "@tanstack/react-query";
import { liveMapKeys } from "./liveMap.keys";
import { liveMapService } from "./liveMap.service";

export function useLiveMap() {
  return useQuery({
    queryKey: liveMapKeys.admin(),
    queryFn: () => liveMapService.getAdmin(),
    refetchInterval: 30_000,
  });
}
