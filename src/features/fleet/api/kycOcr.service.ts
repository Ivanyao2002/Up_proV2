import { env } from "@/core/config/env";
import { fetchClient } from "@/core/http/fetchClient";
import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import {
  mapKycOcrToDocumentResult,
  resolveKycDocumentTypeCode,
} from "./kycOcr.mapper";
import type { KycOcrExtractRequest, KycOcrExtractResponse } from "./kycOcr.types";

const OCR_ERROR_MESSAGES: Record<string, string> = {
  OCR_DOCUMENT_TYPE_INVALID: "Type de document non reconnu.",
  OCR_IMAGE_REQUIRED: "Aucune image fournie.",
  OCR_IMAGE_INVALID: "Image invalide — reprenez la photo.",
  OCR_IMAGE_TOO_LARGE: "Image trop lourde (max 8 Mo). Compressez la photo.",
  OCR_PDF_UNSUPPORTED: "PDF non supporté — envoyez une photo ou une capture.",
  OCR_RATE_LIMITED: "Trop de requêtes OCR — réessayez dans un instant.",
  OCR_PROVIDER_ERROR: "Service OCR indisponible — saisie manuelle.",
  OCR_PARSE_FAILED: "Lecture du document impossible — réessayez ou saisissez manuellement.",
  OCR_DISABLED: "OCR désactivé — saisie manuelle.",
  OCR_NOT_CONFIGURED: "OCR non configuré — saisie manuelle.",
};

export function localizeKycOcrError(code: string | undefined, fallback?: string): string {
  if (!code) return fallback ?? "Erreur OCR";
  return OCR_ERROR_MESSAGES[code] ?? fallback ?? code;
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (typeof window !== "undefined" && typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type?.trim() || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function pickPrimaryFile(files: File[]): File {
  return files[0]!;
}

async function postKycOcrExtract(
  body: KycOcrExtractRequest,
  options?: { server?: boolean }
): Promise<{ ok: boolean; status: number; json: KycOcrExtractResponse & { message?: string } }> {
  const payload = JSON.stringify(body);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };

  if (options?.server) {
    const origin = env.apiUrl.replace(/\/$/, "");
    const res = await fetch(`${origin}/v1/kyc/ocr/extract`, {
      method: "POST",
      headers,
      body: payload,
    });
    const json = (await res.json().catch(() => ({}))) as KycOcrExtractResponse & {
      message?: string;
    };
    return { ok: res.ok, status: res.status, json };
  }

  const res = await fetchClient("/v1/kyc/ocr/extract", {
    method: "POST",
    headers,
    body: payload,
  });
  const json = (await res.json().catch(() => ({}))) as KycOcrExtractResponse & {
    message?: string;
  };
  return { ok: res.ok, status: res.status, json };
}

export async function extractKycOcrGroup(
  documentType: ExtractionDocumentType,
  files: File[],
  vehicleSubtype?: VehicleIdentitySubtype | null,
  options?: { server?: boolean }
): Promise<DocumentExtractionResult> {
  const documentTypeCode = resolveKycDocumentTypeCode(documentType, vehicleSubtype);

  if (!documentTypeCode) {
    return {
      documentType,
      vehicleSubtype: vehicleSubtype ?? null,
      warnings: ["Ce type de pièce n'est pas pris en charge par l'OCR — saisie manuelle."],
      error: null,
      driver: null,
      vehicle: null,
    };
  }

  if (!files.length) {
    return {
      documentType,
      vehicleSubtype: vehicleSubtype ?? null,
      warnings: [],
      error: "Aucun fichier fourni",
    };
  }

  try {
    const file = pickPrimaryFile(files);
    const imageBase64 = await fileToDataUrl(file);
    const { ok, status, json } = await postKycOcrExtract(
      { documentTypeCode, imageBase64 },
      options
    );

    if (!ok) {
      const code = json.error?.code;
      return {
        documentType,
        vehicleSubtype: vehicleSubtype ?? null,
        warnings: [],
        error: localizeKycOcrError(code, json.error?.message ?? json.message ?? `HTTP ${status}`),
      };
    }

    if (!json.ocr) {
      return {
        documentType,
        vehicleSubtype: vehicleSubtype ?? null,
        warnings: [],
        error: "Réponse OCR invalide",
      };
    }

    const mapped = mapKycOcrToDocumentResult(documentType, vehicleSubtype, json.ocr);
    const unreadable = json.ocr.quality === "unreadable";

    return {
      documentType,
      vehicleSubtype: vehicleSubtype ?? null,
      driver: mapped.driver,
      vehicle: mapped.vehicle,
      warnings: mapped.warnings,
      error: unreadable ? "Photo illisible — reprenez la photo du document." : null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur réseau lors de l'OCR";
    return {
      documentType,
      vehicleSubtype: vehicleSubtype ?? null,
      warnings: [],
      error: message,
    };
  }
}
