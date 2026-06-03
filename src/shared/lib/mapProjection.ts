/** Zone cartographique Abidjan pour projection lat/lng ↔ % */
export const ABIDJAN_MAP_BOUNDS = {
  lat_min: 5.25,
  lat_max: 5.43,
  lng_min: -4.1,
  lng_max: -3.88,
};

export interface MapCoords {
  lat: number;
  lng: number;
}

export interface MapPosition {
  left: string;
  top: string;
}

export function latLngToPercent(
  lat: number,
  lng: number,
  bounds = ABIDJAN_MAP_BOUNDS
): MapPosition {
  const latPct =
    ((lat - bounds.lat_min) / (bounds.lat_max - bounds.lat_min)) * 100;
  const lngPct =
    ((lng - bounds.lng_min) / (bounds.lng_max - bounds.lng_min)) * 100;
  return {
    left: `${Math.min(96, Math.max(4, lngPct))}%`,
    top: `${Math.min(92, Math.max(8, 100 - latPct))}%`,
  };
}

export function percentToLatLng(
  leftPct: number,
  topPct: number,
  bounds = ABIDJAN_MAP_BOUNDS
): MapCoords {
  const lat = bounds.lat_max - (topPct / 100) * (bounds.lat_max - bounds.lat_min);
  const lng = bounds.lng_min + (leftPct / 100) * (bounds.lng_max - bounds.lng_min);
  return { lat, lng };
}

export function clampCoordsToBounds(
  lat: number,
  lng: number,
  bounds = ABIDJAN_MAP_BOUNDS
): MapCoords {
  return {
    lat: Math.min(bounds.lat_max, Math.max(bounds.lat_min, lat)),
    lng: Math.min(bounds.lng_max, Math.max(bounds.lng_min, lng)),
  };
}

/** Ring GeoJSON [lng, lat][] → attribut points SVG (viewBox 0–100) */
export function ringLngLatToSvgPoints(
  ring: number[][],
  bounds = ABIDJAN_MAP_BOUNDS
): string {
  return ring
    .map(([lng, lat]) => {
      const x =
        ((lng - bounds.lng_min) / (bounds.lng_max - bounds.lng_min)) * 100;
      const y =
        (1 - (lat - bounds.lat_min) / (bounds.lat_max - bounds.lat_min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

/** Clic sur la carte (viewBox 0–100) → coordonnées géo */
export function svgPointToLatLng(
  xPct: number,
  yPct: number,
  bounds = ABIDJAN_MAP_BOUNDS
): MapCoords {
  const lat =
    bounds.lat_max - (yPct / 100) * (bounds.lat_max - bounds.lat_min);
  const lng =
    bounds.lng_min + (xPct / 100) * (bounds.lng_max - bounds.lng_min);
  return clampCoordsToBounds(lat, lng);
}
