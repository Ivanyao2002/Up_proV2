import { env } from "./env";

export type MapEngine = "mapbox" | "osm" | "legacy";

/** Moteur carte effectif selon `NEXT_PUBLIC_LIVE_MAP_PROVIDER` et le token Mapbox. */
export function resolveMapEngine(): MapEngine {
  if (env.liveMapProvider === "osm") return "osm";

  if (env.liveMapProvider === "mapbox") {
    return env.mapboxToken ? "mapbox" : "legacy";
  }

  return "legacy";
}

export function isMapOsm(): boolean {
  return resolveMapEngine() === "osm";
}

export function isMapMapbox(): boolean {
  return resolveMapEngine() === "mapbox";
}

/** @deprecated Alias — préférer `resolveMapEngine` */
export const resolveLiveMapEngine = resolveMapEngine;

/** @deprecated Alias — préférer `isMapOsm` */
export const isLiveMapOsm = isMapOsm;

/** @deprecated Alias — préférer `isMapMapbox` */
export const isLiveMapMapbox = isMapMapbox;
