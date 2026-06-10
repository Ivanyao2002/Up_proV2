import { env } from "@/core/config/env";
import { fetchMapboxDrivingRoute, type LngLat } from "./mapboxDirections";
import { fetchOsmDrivingRoute } from "./osmDirections";

/** Itinéraire routier selon le fournisseur carte live (Mapbox ou OSRM). */
export async function fetchDrivingRouteForLiveMap(
  from: LngLat,
  to: LngLat
): Promise<LngLat[] | null> {
  if (env.liveMapProvider === "osm") {
    return fetchOsmDrivingRoute(from, to, env.osrmUrl);
  }
  if (env.mapboxToken) {
    return fetchMapboxDrivingRoute(from, to, env.mapboxToken);
  }
  return null;
}
