import { useQuery } from "@tanstack/react-query";
import { franchiseLiveMapService } from "./liveMap.service";
import type { FranchiseLiveMapFiltersValue } from "./liveMap.types";

export const FRANCHISE_LIVE_MAP_HTTP_POLL_MS = 30_000;

export type UseFranchiseLiveMapOptions = {
  pollSnapshot?: boolean;
};

export const franchiseLiveMapKeys = {
  all: ["franchise", "live-map"] as const,
  map: (filters?: FranchiseLiveMapFiltersValue) =>
    [...franchiseLiveMapKeys.all, filters?.partnerId ?? null] as const,
};

export function useFranchiseLiveMap(
  filters?: FranchiseLiveMapFiltersValue,
  options?: UseFranchiseLiveMapOptions
) {
  const pollSnapshot = options?.pollSnapshot !== false;

  return useQuery({
    queryKey: franchiseLiveMapKeys.map(filters),
    queryFn: () => franchiseLiveMapService.get(filters),
    staleTime: pollSnapshot ? 0 : Number.POSITIVE_INFINITY,
    refetchInterval: pollSnapshot ? FRANCHISE_LIVE_MAP_HTTP_POLL_MS : false,
    refetchOnWindowFocus: pollSnapshot,
    refetchOnReconnect: pollSnapshot,
  });
}
