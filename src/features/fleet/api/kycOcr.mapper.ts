import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  ExtractedDriverFields,
  ExtractedVehicleFields,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import type {
  KycOcrDocumentTypeCode,
  KycOcrCatalogMatch,
  KycOcrExtractPayload,
  KycOcrIdCardPrefill,
  KycOcrDriverLicensePrefill,
  KycOcrInsurancePrefill,
  KycOcrVehicleRegistrationPrefill,
} from "./kycOcr.types";

const LOW_CONFIDENCE = 0.6;

export function resolveKycDocumentTypeCode(
  documentType: ExtractionDocumentType,
  vehicleSubtype?: VehicleIdentitySubtype | null
): KycOcrDocumentTypeCode | null {
  if (documentType === "cni") return "ID_CARD";
  if (documentType === "license") return "DRIVER_LICENSE";
  if (documentType === "registration") {
    if (vehicleSubtype === "assurance") return "INSURANCE";
    if (vehicleSubtype === "visite_technique") return null;
    return "VEHICLE_REGISTRATION";
  }
  return null;
}

function avgConfidence(ocr: KycOcrExtractPayload): number | undefined {
  const values = Object.values(ocr.fields ?? {})
    .map((f) => f?.confidence)
    .filter((c): c is number => typeof c === "number" && c > 0);
  if (!values.length) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function lowConfidenceWarnings(ocr: KycOcrExtractPayload): string[] {
  const out: string[] = [];
  for (const [key, field] of Object.entries(ocr.fields ?? {})) {
    if (field.confidence < LOW_CONFIDENCE && field.value != null && field.value !== "") {
      out.push(`Champ « ${key} » à vérifier (confiance ${Math.round(field.confidence * 100)} %).`);
    }
  }
  return out;
}

function mapDriverPrefill(
  prefill: KycOcrIdCardPrefill | KycOcrDriverLicensePrefill,
  documentNumberKey: "idNumber" | "licenseNumber"
): ExtractedDriverFields {
  const docNumber =
    documentNumberKey === "idNumber"
      ? (prefill as KycOcrIdCardPrefill).idNumber
      : (prefill as KycOcrDriverLicensePrefill).licenseNumber;

  return {
    first_name: prefill.firstName ?? null,
    last_name: prefill.lastName ?? null,
    document_number: docNumber ?? null,
  };
}

function yearFromRegistrationDate(date?: string | null): number | null {
  if (!date?.trim()) return null;
  const iso = date.trim().match(/^(\d{4})/);
  if (iso) return Number(iso[1]);
  const parsed = new Date(date);
  const y = parsed.getFullYear();
  return Number.isFinite(y) && y > 1900 ? y : null;
}

function mapVehiclePrefill(
  prefill: KycOcrVehicleRegistrationPrefill | KycOcrInsurancePrefill,
  matches?: Partial<Record<"brand" | "model" | "color", KycOcrCatalogMatch>>
): ExtractedVehicleFields {
  const reg = prefill as KycOcrVehicleRegistrationPrefill;
  const ins = prefill as KycOcrInsurancePrefill;
  const plate = reg.plateNumber ?? ins.plateNumber ?? null;

  const brand =
    reg.brandLabel ?? reg.brand ?? matches?.brand?.label ?? null;
  const model =
    reg.modelLabel ??
    reg.commercialType ??
    matches?.model?.label ??
    null;
  const color =
    reg.colorLabel ?? reg.color ?? matches?.color?.label ?? null;
  const year =
    reg.manufactureYear ?? yearFromRegistrationDate(reg.firstRegistrationDate) ?? null;

  return {
    plate,
    brand,
    model,
    year,
    color,
    brand_code: reg.brandCode ?? matches?.brand?.code ?? null,
    model_id: reg.modelId ?? matches?.model?.id ?? null,
    color_id: reg.colorId ?? matches?.color?.id ?? null,
    color_code: matches?.color?.code ?? null,
  };
}

export function mapKycOcrToDocumentResult(
  documentType: ExtractionDocumentType,
  vehicleSubtype: VehicleIdentitySubtype | null | undefined,
  ocr: KycOcrExtractPayload
): Pick<DocumentExtractionResult, "driver" | "vehicle" | "warnings"> {
  const warnings = [...(ocr.warnings ?? []), ...lowConfidenceWarnings(ocr)];
  const confidence = avgConfidence(ocr);

  if (ocr.quality === "unreadable") {
    return {
      driver: null,
      vehicle: null,
      warnings: [
        "Photo illisible — reprenez la photo du document.",
        ...warnings,
      ],
    };
  }

  const prefill = ocr.prefill ?? {};

  if (ocr.documentTypeCode === "ID_CARD") {
    const driver = mapDriverPrefill(prefill as KycOcrIdCardPrefill, "idNumber");
    if (confidence != null) driver.confidence = confidence;
    return { driver, vehicle: null, warnings };
  }

  if (ocr.documentTypeCode === "DRIVER_LICENSE") {
    const driver = mapDriverPrefill(prefill as KycOcrDriverLicensePrefill, "licenseNumber");
    if (confidence != null) driver.confidence = confidence;
    return { driver, vehicle: null, warnings };
  }

  if (ocr.documentTypeCode === "VEHICLE_REGISTRATION" || ocr.documentTypeCode === "INSURANCE") {
    const vehicle = mapVehiclePrefill(
      prefill as KycOcrVehicleRegistrationPrefill | KycOcrInsurancePrefill,
      ocr.matches
    );
    if (confidence != null) vehicle.confidence = confidence;
    if (ocr.quality === "partial") {
      warnings.push("Analyse partielle — vérifiez les champs pré-remplis.");
    }
    return { driver: null, vehicle, warnings };
  }

  return {
    driver: null,
    vehicle: null,
    warnings: [`Type OCR non géré : ${ocr.documentTypeCode}`],
  };
}
