import { NextRequest, NextResponse } from "next/server";
import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import { resolveDocumentExtractProvider } from "./config";
import { EXTRACTION_PROMPTS } from "./prompts";
import { runDocumentExtraction } from "./extractProviders";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOCUMENT_TYPES = Object.keys(EXTRACTION_PROMPTS) as ExtractionDocumentType[];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const form = await req.formData();
  const documentType = form.get("documentType") as ExtractionDocumentType | null;
  const vehicleSubtypeRaw = form.get("vehicleSubtype") as string | null;
  const vehicleSubtype = vehicleSubtypeRaw?.trim()
    ? (vehicleSubtypeRaw.trim() as VehicleIdentitySubtype)
    : null;
  const providerOverride = form.get("provider") as string | null;
  const resolvedProvider = resolveDocumentExtractProvider(providerOverride);
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!documentType || !DOCUMENT_TYPES.includes(documentType)) {
    return NextResponse.json({ message: "documentType invalide" }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ message: "Aucun fichier fourni" }, { status: 400 });
  }

  if (resolvedProvider === "openrouter" && !apiKey) {
    return NextResponse.json(
      {
        message:
          "OPENROUTER_API_KEY manquant. Utilisez DOCUMENT_EXTRACT_PROVIDER=rules (Paddle + règles, gratuit) ou paddle/openrouter.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runDocumentExtraction(
      resolvedProvider,
      apiKey,
      documentType,
      files,
      vehicleSubtype
    );

    if (result.error && !result.driver && !result.vehicle) {
      return NextResponse.json(
        { ...result, meta: { provider: resolvedProvider } } satisfies DocumentExtractionResult & {
          meta?: { provider: string };
        },
        {
          status: result.error.includes("interprétable") ? 422 : 502,
        }
      );
    }

    return NextResponse.json({
      ...result,
      meta: { provider: resolvedProvider },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur extraction document";
    const status = message.startsWith("PaddleOCR") ? 502 : 500;
    return NextResponse.json({ message }, { status });
  }
}
