import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  MergedExtraction,
  VehicleIdentitySubtype,
} from "./documentExtraction.types";
import { mergeExtractionResults } from "./mergeExtractionResults";
import {
  consolidateExtractionWarnings,
  localizeExtractionWarning,
} from "./localizeExtractionWarning";
import { withBasePath } from "@/shared/lib/basePath";
import type { WizardExtractionJob } from "@/shared/types/documentUpload";

function localizeWarnings(warnings: string[] | undefined): string[] {
  return (warnings ?? []).map(localizeExtractionWarning);
}

function resolveClientOcrProvider(): string | null {
  const value = process.env.NEXT_PUBLIC_DOCUMENT_EXTRACT_PROVIDER?.trim().toLowerCase();
  if (value === "openrouter" || value === "paddle" || value === "rules") return value;
  return null;
}

export async function extractDocumentGroup(
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  const form = new FormData();
  form.append("documentType", documentType);
  const provider = resolveClientOcrProvider();
  if (provider) form.append("provider", provider);
  if (vehicleSubtype) form.append("vehicleSubtype", vehicleSubtype);
  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch(withBasePath("/api/document-extract"), {
    method: "POST",
    body: form,
  });

  const json = (await res.json().catch(() => ({}))) as DocumentExtractionResult & {
    message?: string;
  };

  if (!res.ok) {
    return {
      documentType,
      vehicleSubtype: vehicleSubtype ?? null,
      warnings: [],
      error: json.message ?? json.error ?? `Erreur HTTP ${res.status}`,
    };
  }

  return {
    documentType,
    driver: json.driver ?? null,
    vehicle: json.vehicle ?? null,
    vehicleSubtype: json.vehicleSubtype ?? vehicleSubtype ?? null,
    warnings: localizeWarnings(json.warnings),
    error: null,
  };
}

export async function runFullExtraction(
  groups: WizardExtractionJob[]
): Promise<MergedExtraction> {
  const byDocument: DocumentExtractionResult[] = [];
  const warnings: string[] = [];

  for (const group of groups) {
    const result = await extractDocumentGroup(
      group.type,
      group.files,
      group.vehicleSubtype
    );
    byDocument.push(result);

    if (result.error) {
      warnings.push(`${group.label ?? group.type}: ${result.error}`);
      continue;
    }

    if (result.warnings?.length) warnings.push(...localizeWarnings(result.warnings));
  }

  const merged = mergeExtractionResults(byDocument);
  return {
    ...merged,
    warnings: consolidateExtractionWarnings([...warnings, ...merged.warnings]),
    byDocument,
  };
}
