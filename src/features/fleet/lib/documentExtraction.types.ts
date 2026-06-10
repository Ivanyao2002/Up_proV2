export type ExtractionDocumentType = "cni" | "license" | "registration";

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
  confidence?: number;
}

export interface DocumentExtractionResult {
  documentType: ExtractionDocumentType;
  driver?: ExtractedDriverFields | null;
  vehicle?: ExtractedVehicleFields | null;
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
