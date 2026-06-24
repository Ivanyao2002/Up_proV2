import type { LiveMapData } from "@/shared/types";
import type { AdminLiveMapLocationDelta } from "./liveMap.realtime.types";

/** Délai minimum entre deux GET live-map déclenchés par un id socket inconnu. */
export const LIVE_MAP_UNKNOWN_DRIVER_REFETCH_COOLDOWN_MS = 10_000;

/**
 * Resynchronise la liste des chauffeurs (online/offline) pendant que le socket
 * ne diffuse que les deltas GPS.
 */
export const LIVE_MAP_ROSTER_SYNC_MS = 20_000;

/** Ids présents dans les deltas socket mais absents du snapshot HTTP. */
export function collectUnknownLiveMapDriverIds(
  knownDrivers: Array<{ id: string | number }>,
  deltas: Map<string, AdminLiveMapLocationDelta>
): string[] {
  if (deltas.size === 0) return [];

  const known = new Set(knownDrivers.map((d) => String(d.id)));
  const unknown: string[] = [];

  for (const id of deltas.keys()) {
    if (!known.has(id)) unknown.push(id);
  }

  return unknown;
}

/** Retire les deltas GPS des chauffeurs absents du snapshot (hors ligne). */
export function pruneLiveMapDeltaMap(
  deltas: Map<string, AdminLiveMapLocationDelta>,
  keepIds: Set<string>
): Map<string, AdminLiveMapLocationDelta> {
  let changed = false;
  const next = new Map(deltas);
  for (const id of next.keys()) {
    if (!keepIds.has(id)) {
      next.delete(id);
      changed = true;
    }
  }
  return changed ? next : deltas;
}

/** Fusionne les deltas GPS socket sur le snapshot HTTP. */
export function mergeLiveMapPositionDeltas(
  data: LiveMapData,
  deltas: Map<string, AdminLiveMapLocationDelta>
): LiveMapData {
  const visibleDrivers = data.drivers.filter(
    (driver) => driver.availability !== "offline"
  );

  if (deltas.size === 0) {
    return visibleDrivers.length === data.drivers.length
      ? data
      : { ...data, drivers: visibleDrivers };
  }

  return {
    ...data,
    drivers: visibleDrivers.map((driver) => {
      const delta = deltas.get(String(driver.id));
      if (!delta) return driver;
      const { latitude, longitude } = delta;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return driver;
      }
      return {
        ...driver,
        lat: latitude,
        lng: longitude,
        heading: delta.heading ?? undefined,
        speed_kmh: delta.speedKmh ?? undefined,
      };
    }),
  };
}

/** Socket.IO attend une URL HTTP(S) ; l’API peut renvoyer wss://. */
export function normalizeSocketIoUrl(url: string): string {
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}
