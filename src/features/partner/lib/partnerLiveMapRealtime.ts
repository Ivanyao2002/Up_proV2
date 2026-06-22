import { env } from "@/core/config/env";
import type { LiveMapRealtimeConfig } from "@/shared/types";

/** Config Socket.IO partenaire — room `partner:live-map:{partnerId}`. */
export function buildPartnerLiveMapRealtime(
  partnerId: string
): LiveMapRealtimeConfig | null {
  if (!env.useRealAuth) return null;
  const base = env.apiUrl.replace(/\/$/, "");
  const room = `partner:live-map:${partnerId}`;
  return {
    transport: "socket.io",
    url: base,
    room,
    event: "partner:live:locations",
    joinPayload: { room },
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

export function resolvePartnerLiveMapRealtime(
  apiRealtime: LiveMapRealtimeConfig | null | undefined,
  partnerId: string
): LiveMapRealtimeConfig | null {
  if (apiRealtime?.url && apiRealtime.event) {
    return apiRealtime;
  }
  return buildPartnerLiveMapRealtime(partnerId);
}
