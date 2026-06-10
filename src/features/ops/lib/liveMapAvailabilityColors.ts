import type { LiveMapDriver } from "@/shared/types";

/** Couleurs de pulsation carte live — teintes foncées pour meilleure lisibilité. */
export const LIVE_MAP_AVAILABILITY_COLORS: Record<
  LiveMapDriver["availability"],
  string
> = {
  online: "#1e40af",
  on_trip: "#166534",
  paused: "#b45309",
  offline: "#4b5563",
};

/** Fond semi-opaque pour l’anneau de pulsation Mapbox. */
export function liveMapPulseBackground(color: string): string {
  return `${color}99`;
}

/** Classes Tailwind pour la carte CSS (fallback sans Mapbox). */
export const LIVE_MAP_AVAILABILITY_PULSE_CLASS: Record<
  LiveMapDriver["availability"],
  string
> = {
  online: "bg-blue-800",
  on_trip: "bg-green-800",
  paused: "bg-amber-600",
  offline: "bg-gray-600",
};
