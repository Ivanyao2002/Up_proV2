export type LiveMapProvider = "mapbox" | "osm";

function parseLiveMapProvider(raw: string | undefined): LiveMapProvider {
  const value = (raw ?? "mapbox").trim().toLowerCase();
  if (value === "osm" || value === "openstreetmap" || value === "open_street_map") {
    return "osm";
  }
  return "mapbox";
}

export const env = {
  /** Base API sans suffixe version (ex. https://api.upjunoo-dev.tech) */
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech",
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === "true",
  /** Auth Supabase /v1 — activé si true ou si les mocks sont désactivés */
  useRealAuth:
    process.env.NEXT_PUBLIC_USE_REAL_AUTH === "true" ||
    process.env.NEXT_PUBLIC_USE_MOCKS !== "true",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "UpJunoo Pro",
  /**
   * Fournisseur cartes (live map, zones, SOS, itinéraires…) : `mapbox` ou `osm`.
   * Variable : NEXT_PUBLIC_LIVE_MAP_PROVIDER
   */
  liveMapProvider: parseLiveMapProvider(
    process.env.NEXT_PUBLIC_LIVE_MAP_PROVIDER
  ),
  /** Token public Mapbox (pk.) — requis si liveMapProvider=mapbox */
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  /** Tuiles OpenStreetMap (Leaflet) */
  osmTileUrl:
    process.env.NEXT_PUBLIC_OSM_TILE_URL ??
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  /** OSRM — itinéraires routiers pour la carte OSM */
  osrmUrl:
    process.env.NEXT_PUBLIC_OSRM_URL ?? "https://router.project-osrm.org",
} as const;
