"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "@/core/config/env";
import { useScope } from "@/core/auth/useScope";
import {
  collectUnknownLiveMapDriverIds,
  LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS,
  mergeLiveMapPositionDeltas,
} from "@/features/ops/api/liveMap.realtime";
import type { LiveMapSocketStatus } from "@/features/ops/api/liveMap.realtime.types";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { usePartnerLiveMap } from "../api/partnerDriverDetail.queries";
import { resolvePartnerLiveMapRealtime } from "../lib/partnerLiveMapRealtime";
import { usePartnerLiveMapSocket } from "./usePartnerLiveMapSocket";

export function usePartnerLiveMapWithRealtime() {
  const { ownerId } = useScope();
  const partnerId = ownerId != null ? String(ownerId) : "";
  const legacy = useLegacyPortalApi();
  const socketEnabled = !legacy && env.useRealAuth && Boolean(partnerId);
  const [httpPollActive, setHttpPollActive] = useState(true);
  const lastUnknownRefetchAtRef = useRef(0);

  const query = usePartnerLiveMap({ pollSnapshot: httpPollActive });
  const realtimeConfig = resolvePartnerLiveMapRealtime(
    query.data?.realtime,
    partnerId
  );

  const { deltas, status, clearDeltas } = usePartnerLiveMapSocket(
    realtimeConfig,
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
  }, [partnerId, clearDeltas]);

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
