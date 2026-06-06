import type { TripStatus } from "@/shared/types";

const ASSIGNED_DRIVER_STATUSES: TripStatus[] = [
  "assigned",
  "arrived",
  "in_progress",
  "completed",
];

const LIVE_MAP_STATUSES: TripStatus[] = ["assigned", "arrived", "in_progress"];

/** Course avec chauffeur assigné (acceptée ou au-delà). */
export function isTripWithAssignedDriver(status: TripStatus): boolean {
  return ASSIGNED_DRIVER_STATUSES.includes(status);
}

/** Course en cours côté terrain — position chauffeur pertinente sur la carte. */
export function isTripLiveOnMap(status: TripStatus): boolean {
  return LIVE_MAP_STATUSES.includes(status);
}
