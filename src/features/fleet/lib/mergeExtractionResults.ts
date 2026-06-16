import type {
  DocumentExtractionResult,
  MergedExtraction,
} from "./documentExtraction.types";
import { vehicleIdentityPriority } from "@/app/api/document-extract/vehicleDocumentParsers";
import { consolidateExtractionWarnings } from "./localizeExtractionWarning";

function mergeVehicleFromResults(
  results: DocumentExtractionResult[],
  vehicle: MergedExtraction["vehicle"]
): void {
  const vehicleResults = results
    .filter((r) => r.vehicle && !r.error)
    .sort(
      (a, b) =>
        vehicleIdentityPriority(a.vehicleSubtype) - vehicleIdentityPriority(b.vehicleSubtype)
    );

  for (const result of vehicleResults) {
    const v = result.vehicle!;
    if (v.plate && !vehicle.plate) vehicle.plate = v.plate;
    if (v.brand && !vehicle.brand) vehicle.brand = v.brand;
    if (v.model && !vehicle.model) vehicle.model = v.model;
    if (v.year && !vehicle.year) vehicle.year = v.year;
    if (v.color && !vehicle.color) vehicle.color = v.color;
    if (v.confidence != null && vehicle.confidence == null) {
      vehicle.confidence = v.confidence;
    }
  }
}

export function mergeExtractionResults(
  results: DocumentExtractionResult[]
): MergedExtraction {
  const warnings: string[] = [];
  const driver: MergedExtraction["driver"] = {};
  const vehicle: MergedExtraction["vehicle"] = {};

  for (const result of results) {
    if (result.error) {
      warnings.push(`${result.documentType}: ${result.error}`);
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
  }

  mergeVehicleFromResults(results, vehicle);

  return {
    driver,
    vehicle,
    warnings: consolidateExtractionWarnings(warnings),
    byDocument: results,
  };
}
