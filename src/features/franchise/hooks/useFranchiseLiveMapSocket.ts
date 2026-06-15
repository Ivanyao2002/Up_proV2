"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/core/auth/authStore";
import { env } from "@/core/config/env";
import { normalizeSocketIoUrl } from "@/features/ops/api/liveMap.realtime";
import type {
  AdminLiveMapLocationDelta,
  AdminLiveMapLocationsPayload,
  LiveMapSocketStatus,
} from "@/features/ops/api/liveMap.realtime.types";
import type { LiveMapRealtimeConfig } from "@/shared/types";

function buildFallbackFranchiseRealtime(): LiveMapRealtimeConfig | null {
  if (!env.useRealAuth) return null;
  const base = env.apiUrl.replace(/\/$/, "");
  return {
    transport: "socket.io",
    url: base,
    room: "franchise:live-map",
    event: "franchise:live:locations",
    joinPayload: { room: "franchise:live-map" },
    clientOptions: {
      reconnection: true,
      reconnectionAttempts: null,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 45000,
      transports: ["websocket", "polling"],
    },
  };
}

export function useFranchiseLiveMapSocket(
  config: LiveMapRealtimeConfig | null | undefined,
  enabled: boolean
) {
  const token = useAuthStore((s) => s.token);
  const [deltas, setDeltas] = useState<Map<string, AdminLiveMapLocationDelta>>(
    () => new Map()
  );
  const [status, setStatus] = useState<LiveMapSocketStatus>("idle");
  const socketRef = useRef<Socket | null>(null);

  const clearDeltas = useCallback(() => {
    setDeltas(new Map());
  }, []);

  useEffect(() => {
    if (!enabled || !token) {
      setStatus("idle");
      return;
    }

    const rt = config ?? buildFallbackFranchiseRealtime();
    if (!rt?.url || !rt.event) {
      setStatus("idle");
      return;
    }

    const socketUrl = normalizeSocketIoUrl(rt.url);
    const { clientOptions } = rt;
    const socket = io(socketUrl, {
      reconnection: clientOptions?.reconnection ?? true,
      reconnectionDelay: clientOptions?.reconnectionDelay ?? 1000,
      reconnectionDelayMax: clientOptions?.reconnectionDelayMax ?? 10000,
      timeout: clientOptions?.timeout ?? 45000,
      transports: clientOptions?.transports ?? ["websocket", "polling"],
      ...(clientOptions?.reconnectionAttempts != null
        ? { reconnectionAttempts: clientOptions.reconnectionAttempts }
        : {}),
      auth: { token },
    });
    socketRef.current = socket;
    setStatus("connecting");

    const onConnect = () => {
      setStatus("connected");
      if (rt.joinPayload) {
        socket.emit("join", rt.joinPayload);
      }
    };

    const onDisconnect = () => {
      setStatus("disconnected");
    };

    const onLocations = (payload: AdminLiveMapLocationsPayload) => {
      if (!payload?.drivers?.length) return;
      setDeltas((prev) => {
        const next = new Map(prev);
        for (const delta of payload.drivers) {
          next.set(delta.id, delta);
        }
        return next;
      });
    };

    const onJoinDenied = () => {
      setStatus("error");
    };

    const onConnectError = () => {
      setStatus("error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(rt.event, onLocations);
    socket.on("join_denied", onJoinDenied);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(rt.event, onLocations);
      socket.off("join_denied", onJoinDenied);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
      socketRef.current = null;
      setStatus("idle");
    };
  }, [enabled, token, config?.url, config?.event, config?.room]);

  return { deltas, status, clearDeltas };
}
