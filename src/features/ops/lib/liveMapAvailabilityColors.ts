import type { LiveMapDriver } from "@/shared/types";

/**
 * Couleurs de pulsation carte live — alignées sur la palette sémantique
 * (info / succès / avertissement / neutre).
 *
 * NB: Mapbox (paint properties, `fill` SVG) et la concaténation alpha
 * `${color}99` exigent des hex 6 chiffres littéraux ; les `var(--color-*)`
 * ne sont pas résolus dans ce contexte. On garde donc les hex centralisés
 * ici comme source unique, en miroir des tokens sémantiques foncés.
 */
const SEMANTIC_MAP_HEX = {
  /** info — chauffeur en ligne */
  info: "#1e40af",
  /** success — chauffeur en course */
  success: "#166534",
  /** warning — chauffeur en pause */
  warning: "#b45309",
  /** neutral — chauffeur hors ligne */
  neutral: "#4b5563",
} as const;

export const LIVE_MAP_AVAILABILITY_COLORS: Record<
  LiveMapDriver["availability"],
  string
> = {
  online: SEMANTIC_MAP_HEX.info,
  on_trip: SEMANTIC_MAP_HEX.success,
  paused: SEMANTIC_MAP_HEX.warning,
  offline: SEMANTIC_MAP_HEX.neutral,
};

/** Fond semi-opaque pour l’anneau de pulsation Mapbox (alpha hex ~60 %). */
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
