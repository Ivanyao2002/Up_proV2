import type { LiveMapData } from "@/shared/types";
import type { ApiAdminLiveMapResponse } from "./liveMap.api.types";

function readStatNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * KPI carte alignés sur le snapshot HTTP (meta + payload), pas sur `stats.*` globaux plateforme.
 * Voir LM-STATS-01 — `stats.online` peut valoir 788 alors que `meta.withRecentLocation` vaut 51.
 */
export function mapApiLiveMapStats(
  response: ApiAdminLiveMapResponse,
  snapshot: LiveMapData["stats"]
): LiveMapData["stats"] {
  const raw = response.stats as Record<string, unknown> | undefined;

  return {
    drivers_online: snapshot.drivers_online,
    drivers_on_trip: snapshot.drivers_on_trip,
    active_trips: snapshot.active_trips,
    avg_wait_min:
      readStatNumber(raw?.avgWaitMin) ??
      readStatNumber(raw?.avg_wait_min) ??
      readStatNumber(raw?.avgWaitMinutes) ??
      snapshot.avg_wait_min,
  };
}
