/**
 * Gammes RIDE (VTC) pour la montée en gamme d'un chauffeur (back-office).
 * Voir docs/MONTEE-EN-GAMME-CHAUFFEUR.md.
 *
 * Hiérarchie : ECO < CONFORT < CONFORT+ < PREMIUM.
 * Monter = gardé (peut nécessiter `force`) ; descendre = toujours autorisé.
 */

/** Gammes VTC ordonnées (cas d'usage « montée en gamme »). */
export const RIDE_TIERS = ["ECO", "CONFORT", "CONFORT+", "PREMIUM"] as const;

export type RideTier = (typeof RIDE_TIERS)[number];

export const RIDE_TIER_OPTIONS: { value: RideTier; label: string }[] = [
  { value: "ECO", label: "ECO — économique" },
  { value: "CONFORT", label: "CONFORT" },
  { value: "CONFORT+", label: "CONFORT+" },
  { value: "PREMIUM", label: "PREMIUM" },
];

/** Normalise une valeur de gamme (le backend accepte `CONFORT_PLUS`). */
export function normalizeRideTier(code: string | null | undefined): string {
  if (!code) return "";
  return code.trim().toUpperCase().replace("CONFORT_PLUS", "CONFORT+");
}

/** Rang d'une gamme (1..4), 0 si inconnue / hors VTC. */
export function rideTierRank(code: string | null | undefined): number {
  const normalized = normalizeRideTier(code);
  const idx = RIDE_TIERS.indexOf(normalized as RideTier);
  return idx >= 0 ? idx + 1 : 0;
}

/** La cible est-elle une montée par rapport à la gamme courante ? */
export function isRideTierUpgrade(
  current: string | null | undefined,
  target: string | null | undefined
): boolean {
  const c = rideTierRank(current);
  const t = rideTierRank(target);
  return c > 0 && t > 0 && t > c;
}

/** Libellé court d'une gamme (le code, normalisé), `—` si vide. */
export function rideTierLabel(code: string | null | undefined): string {
  return normalizeRideTier(code) || "—";
}
