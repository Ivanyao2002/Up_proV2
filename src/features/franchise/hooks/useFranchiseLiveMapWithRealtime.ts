"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { env } from "@/core/config/env";
import {
  collectUnknownLiveMapDriverIds,
  LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS,
  mergeLiveMapPositionDeltas,
} from "@/features/ops/api/liveMap.realtime";
import type { LiveMapSocketStatus } from "@/features/ops/api/liveMap.realtime.types";
import { useFranchiseLiveMap } from "../api/liveMap.queries";
import { useFranchiseLiveMapSocket } from "./useFranchiseLiveMapSocket";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";

function useLegacyFranchiseLiveMap(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export function useFranchiseLiveMapWithRealtime(
  filters?: FranchiseLiveMapFiltersValue
) {
  const legacy = useLegacyFranchiseLiveMap();
  const socketEnabled = !legacy && env.useRealAuth;
  const [httpPollActive, setHttpPollActive] = useState(true);
  const lastUnknownRefetchAtRef = useRef(0);

  const query = useFranchiseLiveMap(filters, { pollSnapshot: httpPollActive });

  const { deltas, status, clearDeltas } = useFranchiseLiveMapSocket(
    query.data?.realtime ?? null,
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
  }, [filters?.partnerId, clearDeltas]);

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
