import type { LngLat } from "./mapboxDirections";

const routeCache = new Map<string, LngLat[]>();

function cacheKey(from: LngLat, to: LngLat): string {
  return `${from[0].toFixed(5)},${from[1].toFixed(5)}_${to[0].toFixed(5)},${to[1].toFixed(5)}`;
}

interface OsrmRouteResponse {
  routes?: Array<{
    geometry?: { coordinates?: LngLat[] };
  }>;
}

/**
 * Itinéraire routier via OSRM (OpenStreetMap).
 * Retourne null si échec — l’appelant garde alors le segment droit.
 */
export async function fetchOsmDrivingRoute(
  from: LngLat,
  to: LngLat,
  osrmBaseUrl: string
): Promise<LngLat[] | null> {
  const key = cacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const base = osrmBaseUrl.replace(/\/$/, "");
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
  const url = `${base}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as OsrmRouteResponse;
    const coordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!coordinates?.length) return null;

    routeCache.set(key, coordinates);
    return coordinates;
  } catch {
    return null;
  }
}

export async function resolveOsmTripRoutesGeometry(
  segments: { order_id: string; from: LngLat; to: LngLat; fallback: LngLat[] }[],
  osrmBaseUrl: string
): Promise<Map<string, LngLat[]>> {
  const result = new Map<string, LngLat[]>();
  const batchSize = 4;

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (seg) => {
        const path =
          (await fetchOsmDrivingRoute(seg.from, seg.to, osrmBaseUrl)) ??
          seg.fallback;
        result.set(seg.order_id, path);
      })
    );
  }

  return result;
}
