export type ExtractionDocumentType = "cni" | "license" | "registration";

export type VehicleIdentitySubtype =
  | "carte_grise"
  | "vignette"
  | "recepisse_ww"
  | "assurance"
  | "visite_technique"
  | "autorisation_provisoire";

export type FieldSource = "ai" | "manual" | "empty";

export interface ExtractedDriverFields {
  first_name?: string | null;
  last_name?: string | null;
  document_number?: string | null;
  confidence?: number;
}

export interface ExtractedVehicleFields {
  plate?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  brand_code?: string | null;
  model_id?: string | null;
  color_id?: string | null;
  color_code?: string | null;
  confidence?: number;
}

export interface DocumentExtractionResult {
  documentType: ExtractionDocumentType;
  driver?: ExtractedDriverFields | null;
  vehicle?: ExtractedVehicleFields | null;
  vehicleSubtype?: VehicleIdentitySubtype | null;
  warnings?: string[];
  error?: string | null;
}

export interface MergedExtraction {
  driver: ExtractedDriverFields;
  vehicle: ExtractedVehicleFields;
  warnings: string[];
  byDocument: DocumentExtractionResult[];
}

export type ExtractionJobStatus = "idle" | "running" | "done" | "error" | "skipped";

export type FieldProvenance = Record<string, FieldSource>;
