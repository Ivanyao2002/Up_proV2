export type IvorianPlateVariant = "siv" | "legacy";

// SIV : 2 lettres + 1-4 chiffres + 2 lettres, avec suffixe région optionnel (« -01 ») : AA-378-VT-01.
const SIV_PATTERN = /^([A-Z]{2})[\s.-]?(\d{1,4})[\s.-]?([A-Z]{2})(?:[\s.-]?(\d{1,2}))?$/i;
const LEGACY_PATTERN = /^(\d{1,4})[\s.-]?([A-Z]{1,3}\d{0,2})$/i;

export interface ParsedSivPlate {
  variant: "siv";
  letters1: string;
  numbers: string;
  letters2: string;
  /** Suffixe région (ex. « 01 » pour Abidjan), affiché dans la bande bleue. */
  region?: string;
  display: string;
}

export interface ParsedLegacyPlate {
  variant: "legacy";
  numbers: string;
  letters: string;
  display: string;
}

export type ParsedIvorianPlate = ParsedSivPlate | ParsedLegacyPlate;

export function normalizePlateRaw(plate: string): string {
  return plate.trim().replace(/\s+/g, " ").toUpperCase();
}

// Format SIV (nouvelles plaques) = 2 lettres + 1-4 chiffres + 2 lettres + suffixe région
// optionnel (AA-345-AF, AB-564-AQ, AA-378-VT-01…). La 2e lettre incrémente (AA, AB, AC…) :
// on détecte le motif, pas le préfixe « AA ».
const SIV_COMPACT_PATTERN = /^[A-Z]{2}\d{1,4}[A-Z]{2}\d{0,2}$/i;

export function getPlateVariant(plate: string): IvorianPlateVariant {
  const compact = plate.replace(/[\s.-]/g, "").toUpperCase();
  return SIV_COMPACT_PATTERN.test(compact) ? "siv" : "legacy";
}

export function parseIvorianPlate(plate: string): ParsedIvorianPlate | null {
  const raw = normalizePlateRaw(plate);
  if (!raw) return null;

  const variant = getPlateVariant(raw);

  if (variant === "siv") {
    const compact = raw.replace(/[\s.-]/g, "");
    const match = compact.match(/^([A-Z]{2})(\d{1,4})([A-Z]{2})(\d{1,2})?$/i);
    if (match) {
      const [, l1, num, l2, region] = match;
      const head = `${l1.toUpperCase()}-${num}-${l2.toUpperCase()}`;
      return {
        variant: "siv",
        letters1: l1.toUpperCase(),
        numbers: num,
        letters2: l2.toUpperCase(),
        region: region || undefined,
        display: region ? `${head}-${region}` : head,
      };
    }
    const loose = raw.match(SIV_PATTERN);
    if (loose) {
      const [, l1, num, l2, region] = loose;
      const head = `${l1.toUpperCase()}-${num}-${l2.toUpperCase()}`;
      return {
        variant: "siv",
        letters1: l1.toUpperCase(),
        numbers: num,
        letters2: l2.toUpperCase(),
        region: region || undefined,
        display: region ? `${head}-${region}` : head,
      };
    }
  }

  const legacyMatch = raw.match(LEGACY_PATTERN);
  if (legacyMatch) {
    const [, num, letters] = legacyMatch;
    return {
      variant: "legacy",
      numbers: num,
      letters: letters.toUpperCase(),
      display: `${num} ${letters.toUpperCase()}`,
    };
  }

  return null;
}
