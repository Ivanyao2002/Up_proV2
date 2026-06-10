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

/** Mappe `stats` de GET /v1/admin/live-map vers le modèle front. */
export function mapApiLiveMapStats(
  response: ApiAdminLiveMapResponse,
  fallback: LiveMapData["stats"]
): LiveMapData["stats"] {
  const raw = response.stats;
  if (!raw) return fallback;

  const block = raw as Record<string, unknown>;

  return {
    drivers_online:
      readStatNumber(block.online) ??
      readStatNumber(block.drivers_online) ??
      readStatNumber(block.driversOnline) ??
      fallback.drivers_online,
    drivers_on_trip:
      readStatNumber(block.onTrip) ??
      readStatNumber(block.on_trip) ??
      readStatNumber(block.drivers_on_trip) ??
      readStatNumber(block.driversOnTrip) ??
      fallback.drivers_on_trip,
    active_trips:
      readStatNumber(block.activeTrips) ??
      readStatNumber(block.active_trips) ??
      readStatNumber(block.activeTripsCount) ??
      fallback.active_trips,
    avg_wait_min:
      readStatNumber(block.avgWaitMin) ??
      readStatNumber(block.avg_wait_min) ??
      readStatNumber(block.avgWaitMinutes) ??
      fallback.avg_wait_min,
  };
}
