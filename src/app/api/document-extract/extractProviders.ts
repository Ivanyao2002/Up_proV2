import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import {
  getOpenRouterModel,
  getOpenRouterStructureModel,
  type DocumentExtractProvider,
} from "./config";
import { buildTextStructuringPrompt, EXTRACTION_PROMPTS } from "./prompts";
import { parseJsonFromContent } from "./parseJson";
import { callOpenRouterChat, fileToDataUrl } from "./openrouterClient";
import { runPaddleOcrOnFiles } from "./paddleOcrClient";
import { extractWithRulesFromOcr } from "./rulesParser";

function pickNonEmptyString(
  primary?: string | null,
  fallback?: string | null
): string | null | undefined {
  const p = primary?.trim();
  if (p) return p;
  const f = fallback?.trim();
  return f || fallback;
}

function mergeWithRulesFallback(
  primary: DocumentExtractionResult,
  rules: DocumentExtractionResult
): DocumentExtractionResult {
  const merged: DocumentExtractionResult = {
    ...primary,
    warnings: [...(primary.warnings ?? []), ...(rules.warnings ?? [])],
  };

  if (rules.driver) {
    merged.driver = {
      first_name: pickNonEmptyString(primary.driver?.first_name, rules.driver.first_name) ?? null,
      last_name: pickNonEmptyString(primary.driver?.last_name, rules.driver.last_name) ?? null,
      document_number:
        pickNonEmptyString(primary.driver?.document_number, rules.driver.document_number) ?? null,
      confidence: primary.driver?.confidence ?? rules.driver.confidence,
    };
  }

  if (rules.vehicle) {
    merged.vehicle = {
      plate: pickNonEmptyString(primary.vehicle?.plate, rules.vehicle.plate) ?? null,
      brand: pickNonEmptyString(primary.vehicle?.brand, rules.vehicle.brand) ?? null,
      model: pickNonEmptyString(primary.vehicle?.model, rules.vehicle.model) ?? null,
      year: primary.vehicle?.year ?? rules.vehicle.year,
      color: pickNonEmptyString(primary.vehicle?.color, rules.vehicle.color) ?? null,
      confidence: primary.vehicle?.confidence ?? rules.vehicle.confidence,
    };
  }

  return merged;
}

function mapParsedToResult(
  documentType: ExtractionDocumentType,
  parsed: Record<string, unknown>
): DocumentExtractionResult {
  return {
    documentType,
    driver: (parsed.driver as DocumentExtractionResult["driver"]) ?? null,
    vehicle: (parsed.vehicle as DocumentExtractionResult["vehicle"]) ?? null,
    warnings: Array.isArray(parsed.warnings)
      ? (parsed.warnings as string[])
      : [],
    error: null,
  };
}

async function structureWithOpenRouterText(
  apiKey: string,
  documentType: ExtractionDocumentType,
  ocrText: string,
  _vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  const content = await callOpenRouterChat({
    apiKey,
    model: getOpenRouterStructureModel(),
    content: [{ type: "text", text: buildTextStructuringPrompt(documentType, ocrText) }],
  });

  const parsed = parseJsonFromContent(content);
  if (!parsed) {
    return {
      documentType,
      warnings: [
        "OCR PaddleOK — structuration JSON échouée, saisissez les champs manuellement.",
      ],
      error: "Réponse IA non interprétable",
    };
  }

  return mapParsedToResult(documentType, parsed);
}

export async function extractWithOpenRouterVision(
  apiKey: string,
  documentType: ExtractionDocumentType,
  files: File[]
): Promise<DocumentExtractionResult> {
  const imageParts = await Promise.all(
    files.map(async (file) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUrl(file) },
    }))
  );

  const content = await callOpenRouterChat({
    apiKey,
    model: getOpenRouterModel(),
    content: [{ type: "text", text: EXTRACTION_PROMPTS[documentType] }, ...imageParts],
  });

  const parsed = parseJsonFromContent(content);
  if (!parsed) {
    return {
      documentType,
      warnings: ["Format JSON invalide — saisissez les champs manuellement."],
      error: "Réponse IA non interprétable",
    };
  }

  return mapParsedToResult(documentType, parsed);
}

export async function extractWithPaddleOcr(
  apiKey: string | undefined,
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  const ocrText = await runPaddleOcrOnFiles(files);
  const rulesResult = extractWithRulesFromOcr(documentType, ocrText, vehicleSubtype);

  if (!apiKey?.trim()) {
    return rulesResult;
  }

  const aiResult = await structureWithOpenRouterText(apiKey, documentType, ocrText, vehicleSubtype);
  if (aiResult.error && !aiResult.driver && !aiResult.vehicle) {
    return rulesResult;
  }
  return mergeWithRulesFallback(aiResult, rulesResult);
}

export async function extractWithPaddleRules(
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  const ocrText = await runPaddleOcrOnFiles(files);
  return extractWithRulesFromOcr(documentType, ocrText, vehicleSubtype);
}

export async function runDocumentExtraction(
  provider: DocumentExtractProvider,
  apiKey: string | undefined,
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null
): Promise<DocumentExtractionResult> {
  if (provider === "rules") {
    return extractWithPaddleRules(documentType, files, vehicleSubtype);
  }
  if (provider === "paddle") {
    return extractWithPaddleOcr(apiKey, documentType, files, vehicleSubtype);
  }
  if (!apiKey?.trim()) {
    return {
      documentType,
      warnings: [],
      error: "OPENROUTER_API_KEY manquant sur le serveur.",
    };
  }
  return extractWithOpenRouterVision(apiKey, documentType, files);
}
