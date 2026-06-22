import type { LiveMapDriver } from "@/shared/types";

const VEHICLE_COLOR_HEX_FALLBACK: Record<string, string> = {
  blanc: "#f5f5f5",
  white: "#f5f5f5",
  noir: "#1a1a1a",
  black: "#1a1a1a",
  gris: "#9ca3af",
  gray: "#9ca3af",
  grey: "#9ca3af",
  argent: "#c0c0c0",
  silver: "#c0c0c0",
  rouge: "#dc2626",
  red: "#dc2626",
  bleu: "#1e5aa8",
  blue: "#1e5aa8",
  vert: "#16a34a",
  green: "#16a34a",
  jaune: "#eab308",
  yellow: "#eab308",
  orange: "#ea580c",
  marron: "#78350f",
  maron: "#78350f",
  brown: "#78350f",
};

const HEX_TO_COLOR_LABEL: Record<string, string> = {
  "#ffffff": "Blanc",
  "#f5f5f5": "Blanc",
  "#1a1a1a": "Noir",
  "#000000": "Noir",
  "#9ca3af": "Gris",
  "#808080": "Gris",
  "#c0c0c0": "Argent",
  "#dc2626": "Rouge",
  "#ff0000": "Rouge",
  "#1e5aa8": "Bleu",
  "#0000ff": "Bleu",
  "#16a34a": "Vert",
  "#008000": "Vert",
  "#eab308": "Jaune",
  "#ffff00": "Jaune",
  "#ea580c": "Orange",
  "#ffa500": "Orange",
  "#78350f": "Marron",
  "#800000": "Marron",
};

function normalizeColorToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function resolveLiveMapVehicleColorHex(
  driver: Pick<LiveMapDriver, "vehicle_color" | "vehicle_color_label" | "vehicle_color_hex">
): string | undefined {
  if (driver.vehicle_color_hex?.trim()) return driver.vehicle_color_hex.trim();

  const token = normalizeColorToken(
    driver.vehicle_color_label ?? driver.vehicle_color ?? ""
  );
  if (!token) return undefined;

  if (VEHICLE_COLOR_HEX_FALLBACK[token]) return VEHICLE_COLOR_HEX_FALLBACK[token];

  const first = token.split(/[\s_/|-]+/)[0] ?? token;
  return VEHICLE_COLOR_HEX_FALLBACK[first];
}

export function getLiveMapVehicleColorLabel(
  driver: Pick<LiveMapDriver, "vehicle_color" | "vehicle_color_label">
): string | undefined {
  if (driver.vehicle_color_label?.trim()) return driver.vehicle_color_label.trim();
  const raw = driver.vehicle_color?.trim();
  if (!raw) return undefined;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(raw)) {
    return HEX_TO_COLOR_LABEL[raw.toLowerCase()] ?? raw;
  }
  return raw;
}

/** Ligne véhicule (modèle · plaque) sans la couleur. */
export function formatLiveMapVehicleLine(driver: LiveMapDriver): string {
  return driver.vehicle?.trim() ?? "";
}

function safeCssHexColor(hex: string): string {
  return /^#[0-9A-Fa-f]{3,8}$/.test(hex) ? hex : "#9ca3af";
}

function vehicleColorSwatchHtml(hex: string): string {
  const safe = safeCssHexColor(hex);
  return `<span class="mapbox-live-popup__swatch" style="background-color:${safe}" aria-hidden="true"></span>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bloc HTML couleur pour popup Mapbox. */
export function buildLiveMapVehicleColorHtml(driver: LiveMapDriver): string {
  const label = getLiveMapVehicleColorLabel(driver);
  if (!label) return "";

  const hex = resolveLiveMapVehicleColorHex(driver) ?? "#9ca3af";
  return `<p class="mapbox-live-popup__meta mapbox-live-popup__color">${vehicleColorSwatchHtml(hex)}Couleur : ${escapeHtml(label)}</p>`;
}
