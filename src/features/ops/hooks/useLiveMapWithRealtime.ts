"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { env } from "@/core/config/env";
import { useLiveMap } from "../api/liveMap.queries";
import {
  collectUnknownLiveMapDriverIds,
  LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS,
  mergeLiveMapPositionDeltas,
} from "../api/liveMap.realtime";
import { useAdminLiveMapSocket } from "./useAdminLiveMapSocket";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import type { LiveMapSocketStatus } from "../api/liveMap.realtime.types";

function useLegacyLiveMap(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export function useLiveMapWithRealtime(filters?: LiveMapScopeFiltersValue) {
  const legacy = useLegacyLiveMap();
  const socketEnabled = !legacy && env.useRealAuth;
  const [httpPollActive, setHttpPollActive] = useState(true);
  const lastUnknownRefetchAtRef = useRef(0);

  const query = useLiveMap(filters, { pollSnapshot: httpPollActive });

  const { deltas, status, clearDeltas } = useAdminLiveMapSocket(
    query.data?.realtime,
    socketEnabled && Boolean(query.data)
  );

  useEffect(() => {
    const connected = socketEnabled && status === "connected";
    setHttpPollActive(!connected);
  }, [socketEnabled, status]);

  useEffect(() => {
    setHttpPollActive(true);
    lastUnknownRefetchAtRef.current = 0;
    clearDeltas();
  }, [filters?.franchiseId, filters?.partnerId, clearDeltas]);

  /** Option A — id socket inconnu → refetch snapshot (profil + couleur véhicule). */
  useEffect(() => {
    if (!socketEnabled || status !== "connected" || !query.data) return;

    const unknownIds = collectUnknownLiveMapDriverIds(query.data.drivers, deltas);
    if (unknownIds.length === 0) return;

    const now = Date.now();
    if (
      now - lastUnknownRefetchAtRef.current <
      LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS
    ) {
      return;
    }

    lastUnknownRefetchAtRef.current = now;
    void query.refetch();
  }, [deltas, query.data, query.refetch, socketEnabled, status]);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return mergeLiveMapPositionDeltas(query.data, deltas);
  }, [query.data, deltas]);

  const realtimeActive = socketEnabled && status === "connected";

  return {
    ...query,
    data,
    socketStatus: status as LiveMapSocketStatus,
    realtimeActive,
    httpPollingActive: httpPollActive,
    clearRealtimeDeltas: clearDeltas,
  };
}
