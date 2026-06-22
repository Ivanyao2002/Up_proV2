"use client";

import { useQuery } from "@tanstack/react-query";
import { liveMapKeys } from "./liveMap.keys";
import { liveMapService } from "./liveMap.service";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";

/** Intervalle de secours quand le socket temps réel est indisponible. */
export const LIVE_MAP_HTTP_POLL_MS = 30_000;

export type UseLiveMapOptions = {
  /**
   * Si false, pas de GET périodique sur /live-map (positions via socket).
   * Le premier chargement (queryKey / filtres) reste actif.
   */
  pollSnapshot?: boolean;
  /** Intervalle de resync liste chauffeurs (défaut : LIVE_MAP_HTTP_POLL_MS). */
  refetchIntervalMs?: number;
};

export function useLiveMap(
  filters?: LiveMapScopeFiltersValue,
  options?: UseLiveMapOptions
) {
  const pollSnapshot = options?.pollSnapshot !== false;
  const refetchIntervalMs = options?.refetchIntervalMs ?? LIVE_MAP_HTTP_POLL_MS;

  return useQuery({
    queryKey: liveMapKeys.admin(filters),
    queryFn: () => liveMapService.getAdmin(filters),
    staleTime: pollSnapshot ? 0 : Number.POSITIVE_INFINITY,
    refetchInterval: pollSnapshot ? refetchIntervalMs : false,
    refetchOnWindowFocus: pollSnapshot,
    refetchOnReconnect: pollSnapshot,
  });
}
