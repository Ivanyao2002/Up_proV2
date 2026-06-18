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
import { extractKycOcrGroup } from "@/features/fleet/api/kycOcr.service";
import type { WizardExtractionJob } from "@/shared/types/documentUpload";

function localizeWarnings(warnings: string[] | undefined): string[] {
  return (warnings ?? []).map(localizeExtractionWarning);
}

export async function extractDocumentGroup(
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  const result = await extractKycOcrGroup(documentType, files, vehicleSubtype);

  return {
    ...result,
    warnings: localizeWarnings(result.warnings),
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
