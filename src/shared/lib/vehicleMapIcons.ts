/** Icône par défaut — même asset que la carte live actuelle. */
export const LIVE_MAP_DEFAULT_VEHICLE_ICON = "/assets/icon/gps-navigation.png";

const ICON_BASE = "/assets/icon";

/** Slugs correspondant aux fichiers dans `public/assets/icon/`. */
const COLOR_SLUGS = new Set([
  "blanc",
  "noir",
  "gris",
  "argent",
  "rouge",
  "bleu",
  "vert",
  "jaune",
  "orange",
  "marron",
  "maron",
]);

const COLOR_ALIASES: Record<string, string> = {
  blanc: "blanc",
  white: "blanc",
  noir: "noir",
  black: "noir",
  gris: "gris",
  gray: "gris",
  grey: "gris",
  argent: "argent",
  silver: "argent",
  rouge: "rouge",
  red: "rouge",
  bleu: "bleu",
  blue: "bleu",
  vert: "vert",
  green: "vert",
  jaune: "jaune",
  yellow: "jaune",
  orange: "orange",
  marron: "marron",
  maron: "maron",
  brown: "marron",
};

function normalizeColorToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function slugFromToken(token: string): string | null {
  if (!token || token.startsWith("#")) return null;
  if (COLOR_ALIASES[token]) return COLOR_ALIASES[token]!;
  const first = token.split(/[\s_/|-]+/)[0] ?? token;
  if (COLOR_ALIASES[first]) return COLOR_ALIASES[first]!;
  if (COLOR_SLUGS.has(token)) return token;
  if (COLOR_SLUGS.has(first)) return first;
  return null;
}

/**
 * Résout l’URL de l’icône véhicule pour la carte live.
 * Accepte code catalogue (BLANC), libellé (« Blanc ») ou slug fichier.
 */
export function resolveVehicleMapIconUrl(color?: string | null): string {
  if (!color?.trim()) return LIVE_MAP_DEFAULT_VEHICLE_ICON;

  const raw = color.trim();
  if (raw.startsWith("/assets/icon/")) return raw;
  if (raw.endsWith(".png")) return `${ICON_BASE}/${raw.replace(/^.*\//, "")}`;

  const token = normalizeColorToken(raw);
  const slug = slugFromToken(token);
  if (!slug) return LIVE_MAP_DEFAULT_VEHICLE_ICON;

  return `${ICON_BASE}/${slug}.png`;
}
