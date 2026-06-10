import type { ApiLiveMapDriver } from "./liveMap.api.types";

type ColorLookup = Map<string, { code: string; label: string }>;

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readVehicleBlock(
  driver: ApiLiveMapDriver
): Record<string, unknown> | undefined {
  const vehicle = (driver as { vehicle?: unknown }).vehicle;
  if (!vehicle || typeof vehicle !== "object") return undefined;
  return vehicle as Record<string, unknown>;
}

function readNestedVehicleColor(
  vehicle?: Record<string, unknown>
): { code?: string; label?: string; id?: string; hex?: string } | undefined {
  const colorField = vehicle?.color;
  if (!colorField || typeof colorField !== "object") return undefined;
  const color = colorField as Record<string, unknown>;
  return {
    code:
      readString(color.code) ??
      readString(color.colorCode) ??
      readString(color.color_code),
    label:
      readString(color.label) ??
      readString(color.colorLabel) ??
      readString(color.color_label),
    id: readString(color.id) ?? readString(color.colorId) ?? readString(color.color_id),
    hex: readString(color.hex) ?? readString(color.color_hex),
  };
}

/** Extrait la couleur véhicule depuis la réponse live-map (champs variables selon API). */
export function extractLiveMapDriverVehicleColor(
  driver: ApiLiveMapDriver,
  colorById?: ColorLookup
): string | undefined {
  const vehicle = readVehicleBlock(driver);
  const extended = driver as unknown as Record<string, unknown>;
  const nested = readNestedVehicleColor(vehicle);

  const direct =
    readString(extended.vehicleColorCode) ??
    readString(extended.vehicle_color_code) ??
    nested?.code ??
    readString(vehicle?.colorCode) ??
    readString(vehicle?.color_code) ??
    readString(extended.vehicleColor) ??
    readString(extended.vehicle_color) ??
    readString(vehicle?.color) ??
    nested?.label ??
    readString(vehicle?.colorLabel) ??
    readString(vehicle?.color_label);

  if (direct) return direct;

  const colorId =
    nested?.id ??
    readString(vehicle?.colorId) ??
    readString(vehicle?.color_id) ??
    readString(extended.vehicleColorId) ??
    readString(extended.vehicle_color_id);

  if (colorId && colorById) {
    const fromCatalog = colorById.get(colorId);
    if (fromCatalog?.code) return fromCatalog.code;
    if (fromCatalog?.label) return fromCatalog.label;
  }

  return undefined;
}

/** Libellé affichable (ex. « Bleu ») — préfère le label catalogue au code. */
export function extractLiveMapDriverVehicleColorLabel(
  driver: ApiLiveMapDriver,
  colorById?: ColorLookup
): string | undefined {
  const vehicle = readVehicleBlock(driver);
  const extended = driver as unknown as Record<string, unknown>;
  const nested = readNestedVehicleColor(vehicle);

  const label =
    readString(extended.vehicleColor) ??
    nested?.label ??
    readString(vehicle?.colorLabel) ??
    readString(vehicle?.color_label);

  if (label && !/^[A-Z0-9_]+$/.test(label)) return label;

  const code = extractLiveMapDriverVehicleColor(driver, colorById);
  if (!code) return label;

  if (colorById) {
    for (const entry of colorById.values()) {
      if (entry.code === code) return entry.label;
    }
  }

  return label ?? code;
}

/** Hex catalogue (#1E5AA8) si fourni par l’API live-map. */
export function extractLiveMapDriverVehicleColorHex(
  driver: ApiLiveMapDriver
): string | undefined {
  const vehicle = readVehicleBlock(driver);
  const nested = readNestedVehicleColor(vehicle);
  return nested?.hex;
}
