import type { VehicleIdentitySubtype } from "./documentExtraction.types";

const VEHICLE_IDENTITY_PRIORITY: Record<VehicleIdentitySubtype, number> = {
  carte_grise: 0,
  autorisation_provisoire: 1,
  recepisse_ww: 2,
  visite_technique: 3,
  vignette: 4,
  assurance: 5,
};

export function vehicleIdentityPriority(subtype?: VehicleIdentitySubtype | null): number {
  if (!subtype) return 99;
  return VEHICLE_IDENTITY_PRIORITY[subtype] ?? 99;
}
