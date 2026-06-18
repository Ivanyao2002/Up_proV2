export type KycOcrDocumentTypeCode =
  | "DRIVER_LICENSE"
  | "VEHICLE_REGISTRATION"
  | "INSURANCE"
  | "ID_CARD";

export type KycOcrQuality = "good" | "partial" | "unreadable";

export interface KycOcrFieldValue {
  value: string | number | string[] | null;
  confidence: number;
}

export interface KycOcrCatalogMatch {
  id: string;
  code?: string;
  label: string;
}

export interface KycOcrDriverLicensePrefill {
  firstName?: string | null;
  lastName?: string | null;
  licenseNumber?: string | null;
  licenseCategories?: string[] | null;
  licenseExpiry?: string | null;
  dateOfBirth?: string | null;
}

export interface KycOcrVehicleRegistrationPrefill {
  plateNumber?: string | null;
  vin?: string | null;
  manufactureYear?: number | null;
  firstRegistrationDate?: string | null;
  seatsCount?: number | null;
  brandId?: string | null;
  brandCode?: string | null;
  brandLabel?: string | null;
  /** Libellé marque brut si pas encore résolu catalogue */
  brand?: string | null;
  modelId?: string | null;
  modelLabel?: string | null;
  /** Type commercial carte grise CI (= modèle véhicule) */
  commercialType?: string | null;
  colorId?: string | null;
  colorLabel?: string | null;
  /** Couleur brute si pas encore résolue catalogue */
  color?: string | null;
  registrationNumber?: string | null;
  ownerName?: string | null;
  ownerIdNumber?: string | null;
}

export interface KycOcrInsurancePrefill {
  policyNumber?: string | null;
  insurerName?: string | null;
  plateNumber?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface KycOcrIdCardPrefill {
  firstName?: string | null;
  lastName?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  idExpiry?: string | null;
}

export type KycOcrPrefill =
  | KycOcrDriverLicensePrefill
  | KycOcrVehicleRegistrationPrefill
  | KycOcrInsurancePrefill
  | KycOcrIdCardPrefill;

export interface KycOcrExtractPayload {
  documentTypeCode: KycOcrDocumentTypeCode;
  documentLabel: string;
  model: string;
  fallbackUsed: boolean;
  quality: KycOcrQuality;
  fields: Record<string, KycOcrFieldValue>;
  matches?: Partial<Record<"brand" | "model" | "color", KycOcrCatalogMatch>>;
  prefill: KycOcrPrefill;
  warnings: string[];
}

export interface KycOcrExtractResponse {
  status: string;
  generatedAt?: string;
  ocr: KycOcrExtractPayload;
  error?: { code: string; message: string };
}

export interface KycOcrExtractRequest {
  documentTypeCode: KycOcrDocumentTypeCode;
  imageBase64?: string;
  imageUrl?: string;
  uploadId?: string;
  contentType?: string;
}
