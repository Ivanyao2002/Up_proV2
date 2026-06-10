import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  MergedExtraction,
} from "./documentExtraction.types";

export async function extractDocumentGroup(
  documentType: ExtractionDocumentType,
  files: File[]
): Promise<DocumentExtractionResult> {
  const form = new FormData();
  form.append("documentType", documentType);
  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch("/api/document-extract", {
    method: "POST",
    body: form,
  });

  const json = (await res.json().catch(() => ({}))) as DocumentExtractionResult & {
    message?: string;
  };

  if (!res.ok) {
    return {
      documentType,
      warnings: [],
      error: json.message ?? json.error ?? `Erreur HTTP ${res.status}`,
    };
  }

  return {
    documentType,
    driver: json.driver ?? null,
    vehicle: json.vehicle ?? null,
    warnings: json.warnings ?? [],
    error: null,
  };
}

export async function runFullExtraction(
  groups: { type: ExtractionDocumentType; files: File[] }[]
): Promise<MergedExtraction> {
  const byDocument: DocumentExtractionResult[] = [];
  const warnings: string[] = [];
  const driver: MergedExtraction["driver"] = {};
  const vehicle: MergedExtraction["vehicle"] = {};

  for (const group of groups) {
    const result = await extractDocumentGroup(group.type, group.files);
    byDocument.push(result);

    if (result.error) {
      warnings.push(`${group.type}: ${result.error}`);
      continue;
    }

    if (result.warnings?.length) warnings.push(...result.warnings);

    if (result.driver?.first_name && !driver.first_name) {
      driver.first_name = result.driver.first_name;
      driver.confidence = result.driver.confidence;
    }
    if (result.driver?.last_name && !driver.last_name) {
      driver.last_name = result.driver.last_name;
    }
    if (result.driver?.document_number && !driver.document_number) {
      driver.document_number = result.driver.document_number;
    }

    if (result.vehicle?.plate && !vehicle.plate) vehicle.plate = result.vehicle.plate;
    if (result.vehicle?.brand && !vehicle.brand) vehicle.brand = result.vehicle.brand;
    if (result.vehicle?.model && !vehicle.model) vehicle.model = result.vehicle.model;
    if (result.vehicle?.year && !vehicle.year) vehicle.year = result.vehicle.year;
    if (result.vehicle?.color && !vehicle.color) vehicle.color = result.vehicle.color;
    if (result.vehicle?.confidence != null && vehicle.confidence == null) {
      vehicle.confidence = result.vehicle.confidence;
    }
  }

  return { driver, vehicle, warnings, byDocument };
}
