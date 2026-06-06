"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { fetchAdminLiveMap } from "@/features/admin/api/adminEntityLookup.service";
import type { TripDriverLocation } from "@/shared/types";
import { useAdminLiveMapSocket } from "./useAdminLiveMapSocket";
import type {
  AdminLiveMapLocationDelta,
  LiveMapSocketStatus,
} from "../api/liveMap.realtime.types";

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

/** Position chauffeur temps réel (socket admin) + polling HTTP de secours. */
export function useTripDriverLiveLocation({
  driverId,
  initial,
  enabled,
}: {
  driverId?: string | number | null;
  initial?: TripDriverLocation;
  enabled: boolean;
}) {
  const legacy = useLegacyPortalApi();
  const id = driverId != null ? String(driverId) : "";
  const socketEnabled = enabled && !legacy && env.useRealAuth && Boolean(id);

  const { deltas, status } = useAdminLiveMapSocket(undefined, socketEnabled);
  const pollFallback = socketEnabled && status !== "connected";

  const polled = useQuery({
    queryKey: ["trip-driver-live", id],
    queryFn: async (): Promise<TripDriverLocation | undefined> => {
      const liveMap = await fetchAdminLiveMap();
      const driver = (liveMap.drivers ?? []).find((d) => d.id === id);
      const loc = driver?.location;
      if (!loc) return undefined;
      const lat = loc.lat ?? loc.latitude;
      const lng = loc.lng ?? loc.longitude;
      if (lat == null || lng == null) return undefined;
      return {
        lat: Number(lat),
        lng: Number(lng),
        heading: loc.heading ?? undefined,
        speed_kmh: loc.speedKmh ?? undefined,
        recorded_at: loc.recordedAt,
      };
    },
    enabled: pollFallback && Boolean(id),
    refetchInterval: pollFallback ? DRIVER_POLL_MS : false,
    staleTime: 0,
  });

  const delta = id ? deltas.get(id) : undefined;

  const location = useMemo(() => {
    if (delta) return deltaToLocation(delta);
    if (polled.data) return polled.data;
    return initial;
  }, [delta, polled.data, initial]);

  return {
    location,
    socketStatus: status as LiveMapSocketStatus,
    isRealtime: status === "connected",
  };
}
