"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { TripDriverLocation } from "@/shared/types";
import {
  partnerDriverDetailService,
  partnerLiveMapService,
} from "../api/partnerDriverDetail.service";
import { resolvePartnerLiveMapRealtime } from "../lib/partnerLiveMapRealtime";
import { usePartnerLiveMapSocket } from "./usePartnerLiveMapSocket";
import type {
  AdminLiveMapLocationDelta,
  LiveMapSocketStatus,
} from "@/features/ops/api/liveMap.realtime.types";

const DRIVER_POLL_MS = 15_000;

function deltaToLocation(delta: AdminLiveMapLocationDelta): TripDriverLocation {
  return {
    lat: delta.latitude,
    lng: delta.longitude,
    heading: delta.heading ?? undefined,
    speed_kmh: delta.speedKmh ?? undefined,
    recorded_at: delta.recordedAt,
  };
}

/** Position chauffeur temps réel (socket partenaire) + polling HTTP de secours. */
export function usePartnerTripDriverLiveLocation({
  partnerId,
  driverId,
  initial,
  enabled,
}: {
  partnerId?: string | number | null;
  driverId?: string | number | null;
  initial?: TripDriverLocation;
  enabled: boolean;
}) {
  const legacy = useLegacyPortalApi();
  const partnerKey = partnerId != null ? String(partnerId) : "";
  const id = driverId != null ? String(driverId) : "";
  const socketEnabled =
    enabled && !legacy && env.useRealAuth && Boolean(partnerKey) && Boolean(id);

  const mapQuery = useQuery({
    queryKey: ["partner-ops-map", partnerKey],
    queryFn: () => partnerLiveMapService.get(partnerKey),
    enabled: socketEnabled,
    staleTime: 30_000,
  });

  const realtimeConfig = resolvePartnerLiveMapRealtime(
    mapQuery.data?.realtime,
    partnerKey
  );

  const { deltas, status } = usePartnerLiveMapSocket(realtimeConfig, socketEnabled);
  const pollFallback = socketEnabled && status !== "connected";

  const polledDriver = useQuery({
    queryKey: ["partner-trip-driver-live", partnerKey, id],
    queryFn: async (): Promise<TripDriverLocation | undefined> => {
      try {
        const live = await partnerDriverDetailService.getLivePosition(partnerKey, id);
        const driver = live.driver;
        if (!Number.isFinite(driver.lat) || !Number.isFinite(driver.lng)) {
          return undefined;
        }
        return {
          lat: driver.lat,
          lng: driver.lng,
          heading: driver.heading ?? undefined,
          speed_kmh: driver.speed_kmh ?? undefined,
          recorded_at: live.updated_at,
        };
      } catch {
        const liveMap = await partnerLiveMapService.get(partnerKey);
        const driver = liveMap.drivers.find((d) => String(d.id) === id);
        if (!driver) return undefined;
        return {
          lat: driver.lat,
          lng: driver.lng,
          heading: driver.heading ?? undefined,
          speed_kmh: driver.speed_kmh ?? undefined,
        };
      }
    },
    enabled: pollFallback && Boolean(id) && Boolean(partnerKey),
    refetchInterval: pollFallback ? DRIVER_POLL_MS : false,
    staleTime: 0,
  });

  const delta = id ? deltas.get(id) : undefined;
  const snapshotDriver = mapQuery.data?.drivers.find((d) => String(d.id) === id);

  const location = useMemo(() => {
    if (delta) return deltaToLocation(delta);
    if (polledDriver.data) return polledDriver.data;
    if (snapshotDriver) {
      return {
        lat: snapshotDriver.lat,
        lng: snapshotDriver.lng,
        heading: snapshotDriver.heading ?? undefined,
        speed_kmh: snapshotDriver.speed_kmh ?? undefined,
      };
    }
    return initial;
  }, [delta, polledDriver.data, snapshotDriver, initial]);

  return {
    location,
    socketStatus: status as LiveMapSocketStatus,
    isRealtime: status === "connected",
  };
}
