"use client";

import { useMemo, useEffect, useRef } from "react";
import { env } from "@/core/config/env";
import {
  collectUnknownLiveMapDriverIds,
  LIVE_MAP_ROSTER_SYNC_MS,
  LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS,
  mergeLiveMapPositionDeltas,
} from "@/features/ops/api/liveMap.realtime";
import type { LiveMapSocketStatus } from "@/features/ops/api/liveMap.realtime.types";
import {
  useFranchiseLiveMap,
} from "../api/liveMap.queries";
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
  const lastUnknownRefetchAtRef = useRef(0);

  const query = useFranchiseLiveMap(filters, {
    pollSnapshot: legacy || !socketEnabled,
  });

  const { deltas, status, clearDeltas, pruneDeltas } = useFranchiseLiveMapSocket(
    query.data?.realtime ?? null,
    socketEnabled && Boolean(query.data)
  );

  const socketConnected = socketEnabled && status === "connected";

  useEffect(() => {
    if (!socketConnected) return;
    const id = window.setInterval(() => {
      void query.refetch();
    }, LIVE_MAP_ROSTER_SYNC_MS);
    return () => window.clearInterval(id);
  }, [socketConnected, query.refetch]);

  useEffect(() => {
    lastUnknownRefetchAtRef.current = 0;
    clearDeltas();
  }, [filters?.partnerId, clearDeltas]);

  useEffect(() => {
    if (!query.data) return;
    const rosterIds = new Set(query.data.drivers.map((driver) => String(driver.id)));
    pruneDeltas(rosterIds);
  }, [query.data, query.dataUpdatedAt, pruneDeltas]);

  useEffect(() => {
    if (!socketConnected || !query.data) return;

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
  }, [deltas, query.data, query.refetch, socketConnected]);

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return mergeLiveMapPositionDeltas(query.data, deltas);
  }, [query.data, deltas]);

  return {
    ...query,
    data,
    socketStatus: status as LiveMapSocketStatus,
    realtimeActive: socketConnected,
    httpPollingActive: legacy || !socketEnabled || !socketConnected,
    clearRealtimeDeltas: clearDeltas,
  };
}
