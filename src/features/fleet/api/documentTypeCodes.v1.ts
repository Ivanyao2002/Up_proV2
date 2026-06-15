import type { DriverKycDocumentType } from "@/shared/types/driverDocuments";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";

/** Codes API `GET /v1/catalog/document-types` — un fichier UI = recto / face principale. */
const DRIVER_UI_TO_API: Record<DriverKycDocumentType, string> = {
  cni: "ID_CARD_FRONT",
  license: "DRIVER_LICENSE_FRONT",
  selfie: "PROFILE_PHOTO",
};

const VEHICLE_UI_TO_API: Partial<Record<VehicleDocumentType, string>> = {
  registration: "REGISTRATION_CARD",
  insurance: "INSURANCE",
};

export function mapDriverDocumentTypeToApiCode(
  type: DriverKycDocumentType
): string {
  const code = DRIVER_UI_TO_API[type];
  if (!code) {
    throw new Error(`Type de document chauffeur non supporté : ${type}`);
  }
  return code;
}

export function mapVehicleDocumentTypeToApiCode(
  type: VehicleDocumentType
): string {
  const code = VEHICLE_UI_TO_API[type];
  if (!code) {
    throw new Error(
      `Type de document véhicule non supporté par l'API v1 : ${type}`
    );
  }
  return code;
}
